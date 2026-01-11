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

# Find latest snapshot - check project-local first, then global
find_latest_snapshot() {
    local project_dir=".claude/sessions/restarts"
    local global_dir="$HOME/.claude/sessions/restarts"

    # Try project-local first
    if [ -d "$project_dir" ]; then
        local latest=$(ls -t "$project_dir"/*.md 2>/dev/null | head -1)
        if [ -n "$latest" ]; then
            echo "$(cd "$(dirname "$latest")" && pwd)/$(basename "$latest")"
            return 0
        fi
    fi

    # Fall back to global
    if [ -d "$global_dir" ]; then
        local latest=$(ls -t "$global_dir"/*.md 2>/dev/null | head -1)
        if [ -n "$latest" ]; then
            echo "$latest"
            return 0
        fi
    fi

    return 1
}

# Escape string for JSON embedding
escape_for_json() {
    local input="$1"
    local output=""
    local i char
    for (( i=0; i<${#input}; i++ )); do
        char="${input:$i:1}"
        case "$char" in
            $'\\') output+='\\' ;;
            '"') output+='\"' ;;
            $'\n') output+='\n' ;;
            $'\r') output+='\r' ;;
            $'\t') output+='\t' ;;
            *) output+="$char" ;;
        esac
    done
    printf '%s' "$output"
}

# Check for snapshot
LATEST=$(find_latest_snapshot || echo "")
debug_log "LATEST=$LATEST"

if [ -n "$LATEST" ] && [ -f "$LATEST" ]; then
    debug_log "Found snapshot, preparing context injection"

    # Extract metadata from snapshot
    TITLE=$(grep -m1 '^title:' "$LATEST" 2>/dev/null | sed 's/^title:[[:space:]]*//; s/^"//; s/"$//' || echo "Untitled Session")
    CREATED=$(grep -m1 '^created:' "$LATEST" 2>/dev/null | sed 's/^created:[[:space:]]*//' || echo "unknown")

    # Read resume skill content
    RESUME_SKILL=$(cat "${PLUGIN_ROOT}/skills/resume/SKILL.md" 2>/dev/null || echo "Error reading resume skill")

    # Read full snapshot content for context
    SNAPSHOT_CONTENT=$(cat "$LATEST" 2>/dev/null || echo "Error reading snapshot")

    # Escape for JSON
    TITLE_ESCAPED=$(escape_for_json "$TITLE")
    CREATED_ESCAPED=$(escape_for_json "$CREATED")
    RESUME_SKILL_ESCAPED=$(escape_for_json "$RESUME_SKILL")
    SNAPSHOT_ESCAPED=$(escape_for_json "$SNAPSHOT_CONTENT")
    LATEST_ESCAPED=$(escape_for_json "$LATEST")

    # Output context injection
    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<BLINK_SESSION_AVAILABLE>\\nA previous session snapshot was detected.\\n\\n**Snapshot Details:**\\n- Title: ${TITLE_ESCAPED}\\n- Created: ${CREATED_ESCAPED}\\n- Path: ${LATEST_ESCAPED}\\n\\n**You MUST follow the resume skill below to present options to the user:**\\n\\n${RESUME_SKILL_ESCAPED}\\n\\n**Snapshot Content (for restore):**\\n\\n${SNAPSHOT_ESCAPED}\\n</BLINK_SESSION_AVAILABLE>"
  }
}
EOF
else
    debug_log "No snapshot found, clean start"
    # No snapshot - output simple success
    echo "Success"
fi

exit 0
