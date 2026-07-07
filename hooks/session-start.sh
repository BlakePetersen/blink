#!/usr/bin/env bash
# ABOUTME: Blink session-start hook - detects snapshots and triggers resume confirmation
# ABOUTME: Follows superpowers-marketplace patterns for context injection

set -euo pipefail

# Determine plugin root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Debug logging (optional)
debug_log() {
    echo "[blink] $1" >> /tmp/blink-hook-debug.log 2>/dev/null || true
}

debug_log "Hook ran at $(date), pwd=$(pwd)"

# Marker written by scripts/browse-sessions.sh when the user picks a session
# in the TUI. It points at the snapshot to restore on the next session start.
PENDING_MARKER=".claude/sessions/.pending-restore"

# Settings written by the TUI (see cli/blink-tui/src/lib/settings.ts).
SETTINGS_FILE="$HOME/.claude/plugins/blink/settings.json"

# How many recent snapshots to surface in the resume picker (#59).
PICKER_LIMIT=5

# Read a single behavior setting. Prefers jq; falls back to a crude grep so the
# hook still honors settings on machines without jq installed.
#   $1 = jq path (e.g. .behavior.resumePrompt)
#   $2 = plain key name for the grep fallback (e.g. resumePrompt)
read_setting() {
    local jq_path="$1"
    local key="$2"
    [ -f "$SETTINGS_FILE" ] || return 0
    if command -v jq >/dev/null 2>&1; then
        # Note: avoid `// empty` here - jq treats a literal `false` as absent,
        # which would mask a `resumePrompt: false` setting. A missing key yields
        # the string "null", which callers treat as "unset".
        jq -r "${jq_path}" "$SETTINGS_FILE" 2>/dev/null || true
    else
        grep -o "\"${key}\"[[:space:]]*:[[:space:]]*[^,}]*" "$SETTINGS_FILE" 2>/dev/null \
            | head -1 \
            | sed 's/.*:[[:space:]]*//; s/[[:space:]]*$//; s/"//g' || true
    fi
}

# Escape a string for embedding inside a JSON string literal. Prefers jq, which
# correctly encodes every control character; the value is returned WITHOUT the
# surrounding quotes since callers embed it inside their own quotes. Falls back
# to a bash loop that emits \uXXXX for any C0 control char (< 0x20) so a stray
# ESC or other control byte can never produce invalid JSON (#41).
escape_for_json() {
    local input="$1"
    if command -v jq >/dev/null 2>&1; then
        local encoded
        # If jq is present but somehow fails, fall through to the bash loop
        # rather than aborting under `set -e` (which would drop the injection).
        if encoded=$(printf '%s' "$input" | jq -Rs . 2>/dev/null) && [ -n "$encoded" ]; then
            # Strip the leading and trailing quote jq adds around the string.
            encoded=${encoded#\"}
            encoded=${encoded%\"}
            printf '%s' "$encoded"
            return 0
        fi
    fi
    local output="" i char code hex
    for (( i=0; i<${#input}; i++ )); do
        char="${input:$i:1}"
        case "$char" in
            $'\\') output+='\\' ;;
            '"') output+='\"' ;;
            $'\n') output+='\n' ;;
            $'\r') output+='\r' ;;
            $'\t') output+='\t' ;;
            *)
                printf -v code '%d' "'$char" 2>/dev/null || code=32
                if [ "$code" -ge 0 ] && [ "$code" -lt 32 ]; then
                    printf -v hex '%04x' "$code"
                    output+="\\u${hex}"
                else
                    output+="$char"
                fi
                ;;
        esac
    done
    printf '%s' "$output"
}

# Extract the title from a snapshot's frontmatter.
extract_title() {
    grep -m1 '^title:' "$1" 2>/dev/null | sed 's/^title:[[:space:]]*//; s/^"//; s/"$//' || true
}

# Extract the created timestamp from a snapshot's frontmatter.
extract_created() {
    grep -m1 '^created:' "$1" 2>/dev/null | sed 's/^created:[[:space:]]*//' || true
}

# Extract the project path recorded in a snapshot's frontmatter, stripping any
# surrounding quotes. Used to scope the global fallback to this project (#42).
extract_project() {
    grep -m1 '^project:' "$1" 2>/dev/null | sed 's/^project:[[:space:]]*//; s/^"//; s/"$//' || true
}

# Modification time as an epoch value, preferring sub-second precision. Tries
# GNU stat first, then BSD, so ordering is correct on Linux and macOS alike.
# GNU stat is tried first on purpose: BSD's `stat -c` exits nonzero cleanly on
# macOS, whereas GNU's `stat -f` means "filesystem status" and would emit stray
# `File: ...` text that contaminates the path if tried first on Linux.
stat_mtime() {
    stat -c '%.9Y' "$1" 2>/dev/null || stat -f '%Fm' "$1" 2>/dev/null || echo 0
}

# The project the current session is running in. The global snapshot store is
# only surfaced for snapshots whose `project:` frontmatter matches this path, so
# another project's snapshot (and its absolute paths) never leaks in (#42).
CURRENT_PROJECT="$(pwd)"

# Convert a possibly-relative path into an absolute one.
to_absolute() {
    local p="$1"
    printf '%s/%s\n' "$(cd "$(dirname "$p")" && pwd)" "$(basename "$p")"
}

# Gather active (non-archived) snapshots newest-first as absolute paths.
# Project-local restarts/ + saved/ take precedence; otherwise the global store
# is used but scoped to snapshots created for THIS project (#42). find -maxdepth
# 1 only matches files directly in each dir, so archived/ is intentionally
# excluded, and stat-based mtime sorting replaces the fragile `ls -t` (#41).
gather_snapshots() {
    local base f ranked line
    for base in ".claude/sessions" "$HOME/.claude/sessions"; do
        ranked=""
        while IFS= read -r -d '' f; do
            if [ "$base" = "$HOME/.claude/sessions" ]; then
                [ "$(extract_project "$f")" = "$CURRENT_PROJECT" ] || continue
            fi
            ranked+="$(printf '%s\t%s' "$(stat_mtime "$f")" "$f")"$'\n'
        done < <(find "$base/restarts" "$base/saved" -maxdepth 1 -type f -name '*.md' -print0 2>/dev/null)
        [ -n "$ranked" ] || continue
        # Newest first by mtime; strip the sort key and emit absolute paths.
        printf '%s' "$ranked" | sort -rn | while IFS= read -r line; do
            [ -n "$line" ] || continue
            to_absolute "${line#*$'\t'}"
        done
        return 0
    done
    return 1
}

# Resume prompt disabled in settings -> stay silent (#62).
if [ "$(read_setting '.behavior.resumePrompt' 'resumePrompt')" = "false" ]; then
    debug_log "resumePrompt disabled in settings, skipping injection"
    exit 0
fi

# Detect the SessionStart source from stdin. compact/clear should NOT re-inject
# full content (#64); startup/resume get the full snapshot. Reading is guarded so
# an interactive terminal (no piped payload) never blocks.
SOURCE=""
if [ ! -t 0 ]; then
    STDIN_JSON=$(cat 2>/dev/null || true)
    if [ -n "$STDIN_JSON" ]; then
        if command -v jq >/dev/null 2>&1; then
            SOURCE=$(printf '%s' "$STDIN_JSON" | jq -r '.source // empty' 2>/dev/null || true)
        else
            SOURCE=$(printf '%s' "$STDIN_JSON" \
                | grep -o '"source"[[:space:]]*:[[:space:]]*"[^"]*"' \
                | head -1 \
                | sed 's/.*"source"[[:space:]]*:[[:space:]]*"//; s/"$//' || true)
        fi
    fi
fi
debug_log "SOURCE=$SOURCE"

# Resolve the featured snapshot. An explicit TUI selection (pending-restore
# marker) wins and suppresses the picker; the marker is single-use.
MARKED=""
if [ -f "$PENDING_MARKER" ]; then
    PENDING="$(head -1 "$PENDING_MARKER" 2>/dev/null || true)"
    rm -f "$PENDING_MARKER"
    if [ -n "$PENDING" ] && [ -f "$PENDING" ]; then
        debug_log "Using pending-restore marker: $PENDING"
        MARKED="$PENDING"
    else
        debug_log "Stale pending-restore marker cleared, falling back to newest"
    fi
fi

if [ -n "$MARKED" ]; then
    SNAPSHOTS="$MARKED"
else
    SNAPSHOTS="$(gather_snapshots || true)"
fi

PRIMARY="$(head -1 <<< "$SNAPSHOTS")"
if [ -z "$PRIMARY" ] || [ ! -f "$PRIMARY" ]; then
    debug_log "No snapshot found, clean start"
    exit 0
fi

TITLE="$(extract_title "$PRIMARY")"
[ -n "$TITLE" ] || TITLE="Untitled Session"
CREATED="$(extract_created "$PRIMARY")"
[ -n "$CREATED" ] || CREATED="unknown"

TITLE_ESCAPED=$(escape_for_json "$TITLE")
CREATED_ESCAPED=$(escape_for_json "$CREATED")
PRIMARY_ESCAPED=$(escape_for_json "$PRIMARY")

# Minimal injection for post-compaction/clear: a pointer, never the full body,
# so compaction does not re-bloat the context (#64).
if [ "$SOURCE" = "compact" ] || [ "$SOURCE" = "clear" ]; then
    debug_log "Minimal injection for source=$SOURCE"
    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<BLINK_SESSION_AVAILABLE>\\nA Blink snapshot is available (context was just compacted; full content is intentionally not re-injected).\\n- Title: ${TITLE_ESCAPED}\\n- Created: ${CREATED_ESCAPED}\\n- Path: ${PRIMARY_ESCAPED}\\n\\nRun the blink:resume skill or read the snapshot path above if you need to restore it.\\n</BLINK_SESSION_AVAILABLE>"
  }
}
EOF
    exit 0
fi

# Full injection for startup/resume.
RESUME_SKILL=$(cat "${PLUGIN_ROOT}/skills/resume/SKILL.md" 2>/dev/null || echo "Error reading resume skill")
SNAPSHOT_CONTENT=$(cat "$PRIMARY" 2>/dev/null || echo "Error reading snapshot")
RESUME_SKILL_ESCAPED=$(escape_for_json "$RESUME_SKILL")
SNAPSHOT_ESCAPED=$(escape_for_json "$SNAPSHOT_CONTENT")

# Build the recent-snapshot picker list (#59). The featured snapshot is #1; the
# rest are alternates the user can choose by number.
RECENT_LIST=""
INDEX=0
while IFS= read -r SNAP; do
    [ -n "$SNAP" ] || continue
    INDEX=$((INDEX + 1))
    [ "$INDEX" -gt "$PICKER_LIMIT" ] && break
    SNAP_TITLE="$(extract_title "$SNAP")"
    [ -n "$SNAP_TITLE" ] || SNAP_TITLE="Untitled Session"
    SNAP_CREATED="$(extract_created "$SNAP")"
    [ -n "$SNAP_CREATED" ] || SNAP_CREATED="unknown"
    RECENT_LIST+="${INDEX}. \"${SNAP_TITLE}\" — ${SNAP_CREATED}"$'\n'
    RECENT_LIST+="     ${SNAP}"$'\n'
done <<< "$SNAPSHOTS"

# Only surface the picker section when there is more than one option.
RECENT_SECTION=""
if [ "$INDEX" -gt 1 ]; then
    RECENT_SECTION=$'\n\n**Recent snapshots (the user may pick one by number):**\n\n'"$RECENT_LIST"
fi
RECENT_SECTION_ESCAPED=$(escape_for_json "$RECENT_SECTION")

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<BLINK_SESSION_AVAILABLE>\\nA previous session snapshot was detected.\\n\\n**Snapshot Details:**\\n- Title: ${TITLE_ESCAPED}\\n- Created: ${CREATED_ESCAPED}\\n- Path: ${PRIMARY_ESCAPED}${RECENT_SECTION_ESCAPED}\\n\\n**You MUST follow the resume skill below to present options to the user:**\\n\\n${RESUME_SKILL_ESCAPED}\\n\\n**Snapshot Content (for restore):**\\n\\n${SNAPSHOT_ESCAPED}\\n</BLINK_SESSION_AVAILABLE>"
  }
}
EOF

exit 0
