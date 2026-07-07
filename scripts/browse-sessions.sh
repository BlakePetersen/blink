#!/usr/bin/env bash
# ABOUTME: Launches the Blink TUI browser and records the chosen session
# ABOUTME: as a pending-restore marker the session-start hook consumes next start

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TUI_DIR="${PLUGIN_ROOT}/cli/blink-tui"

# Where the TUI browses from (defaults to the current project).
PROJECT_DIR="${1:-$(pwd)}"
MARKER_DIR="${PROJECT_DIR}/.claude/sessions"
MARKER="${MARKER_DIR}/.pending-restore"

# The TUI needs a build; produce one on first run.
if [ ! -f "${TUI_DIR}/dist/index.js" ]; then
  pnpm --dir "$TUI_DIR" build >&2
fi

# The interactive UI renders to stderr (the terminal); stdout carries only the
# BLINK_SELECTED:<path> protocol line, so we can capture the selection cleanly.
TUI_STDOUT="$(pnpm --silent --dir "$TUI_DIR" start "$PROJECT_DIR")"

SELECTED="$(printf '%s\n' "$TUI_STDOUT" | grep -m1 '^BLINK_SELECTED:' | sed 's/^BLINK_SELECTED://')"

if [ -z "$SELECTED" ]; then
  echo "No session selected." >&2
  exit 0
fi

mkdir -p "$MARKER_DIR"
printf '%s\n' "$SELECTED" > "$MARKER"
echo "Session queued for restore. Start a new Claude Code session to resume it."
echo "  $SELECTED"
