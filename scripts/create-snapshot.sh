#!/bin/bash
# ABOUTME: Creates a Blink session snapshot file with proper directory structure
# ABOUTME: Called by agent when running /blink:restart or /blink:save commands

set -e

# Parse arguments
TYPE="${1:-restart}"  # "restart" or "saved"
GLOBAL="${2:-false}"  # "true" for global, "false" for project-local
TITLE="${3:-}"        # Optional title (for saved sessions)

# Settings written by the TUI (see cli/blink-tui/src/lib/settings.ts).
SETTINGS_FILE="$HOME/.claude/plugins/blink/settings.json"

# How many restart snapshots to retain. Restart snapshots accumulate on every
# /blink:restart and nothing else prunes them (#30). Configurable via the
# behavior.retentionCount setting; falls back to this documented default when
# unset or unreadable. saved/ and restarts/archived/ are never pruned.
DEFAULT_RETENTION=20

# Modification time as an epoch value for newest-first sort. GNU stat is tried
# first: BSD's `stat -c` exits nonzero cleanly on macOS, whereas GNU's `stat -f`
# means "filesystem status" and emits stray text that corrupts the sort on Linux.
stat_mtime() {
  stat -c '%.9Y' "$1" 2>/dev/null || stat -f '%Fm' "$1" 2>/dev/null || echo 0
}

# Read the configured retention count, clamped to a sane integer >= 1.
read_retention() {
  local val=""
  if [ -f "$SETTINGS_FILE" ]; then
    if command -v jq >/dev/null 2>&1; then
      val=$(jq -r '.behavior.retentionCount // empty' "$SETTINGS_FILE" 2>/dev/null || true)
    else
      val=$(grep -o '"retentionCount"[[:space:]]*:[[:space:]]*[0-9]*' "$SETTINGS_FILE" 2>/dev/null \
        | head -1 | sed 's/.*:[[:space:]]*//' || true)
    fi
  fi
  if [[ "$val" =~ ^[0-9]+$ ]] && [ "$val" -ge 1 ]; then
    echo "$val"
  else
    echo "$DEFAULT_RETENTION"
  fi
}

# Prune the newest restart snapshots in $1 down to $2 total, reserving one slot
# for the snapshot about to be written. Only files directly in the directory are
# considered, so restarts/archived/ is untouched; saved/ is never passed here.
prune_restarts() {
  local dir="$1" keep="$2"
  [ -d "$dir" ] || return 0
  # Reserve one slot for the snapshot being created so the end state is `keep`.
  local reserve=$((keep - 1))
  [ "$reserve" -lt 0 ] && reserve=0
  local ranked count=0 f
  ranked=""
  while IFS= read -r -d '' f; do
    ranked+="$(printf '%s\t%s' "$(stat_mtime "$f")" "$f")"$'\n'
  done < <(find "$dir" -maxdepth 1 -type f -name '*.md' -print0 2>/dev/null)
  [ -n "$ranked" ] || return 0
  # Newest first; delete everything beyond the reserved slots.
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    count=$((count + 1))
    if [ "$count" -gt "$reserve" ]; then
      rm -f "${line#*$'\t'}"
    fi
  done < <(printf '%s' "$ranked" | sort -rn)
}

# Determine base directory
if [ "$GLOBAL" = "true" ]; then
  BASE_DIR="$HOME/.claude/sessions"
else
  BASE_DIR=".claude/sessions"
fi

# Determine subdirectory based on type
if [ "$TYPE" = "restart" ]; then
  TARGET_DIR="$BASE_DIR/restarts"
else
  TARGET_DIR="$BASE_DIR/saved"
fi

# Create directory if needed
mkdir -p "$TARGET_DIR"

# Generate filename
if [ "$TYPE" = "restart" ]; then
  # Use ISO timestamp for restarts
  TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")
  FILENAME="$TIMESTAMP.md"
else
  # Use slugified title for saved sessions
  if [ -z "$TITLE" ]; then
    TITLE="session-$(date +"%Y-%m-%dT%H-%M-%S")"
  fi
  # Slugify: lowercase, replace spaces with hyphens, remove special chars
  SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g')
  # Fall back to a timestamp if the slug is empty or only hyphens
  if [[ ! "$SLUG" =~ [a-z0-9] ]]; then
    SLUG="session-$(date +"%Y-%m-%dt%H-%M-%S")"
  fi
  FILENAME="$SLUG.md"
fi

FILEPATH="$TARGET_DIR/$FILENAME"

# Enforce retention on restart snapshots only. saved/ is intentionally exempt.
if [ "$TYPE" = "restart" ]; then
  prune_restarts "$TARGET_DIR" "$(read_retention)"
fi

# Output the filepath for the agent to use
echo "$FILEPATH"
