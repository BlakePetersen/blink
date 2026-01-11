#!/bin/bash
# ABOUTME: Blink status line script for Claude Code
# ABOUTME: Displays session resume status in the bottom-right indicator

# Read Claude Code context from stdin (we don't use it currently, but consume it)
cat > /dev/null

BLINK_STATE="/tmp/blink/session-status.json"
DISPLAY_DURATION=300  # Show for 5 minutes after resume

# Check if we have a resumed session
if [ -f "$BLINK_STATE" ]; then
  TIMESTAMP=$(jq -r '.timestamp // ""' "$BLINK_STATE" 2>/dev/null)

  # Check if within display duration
  if [ -n "$TIMESTAMP" ] && [ "$TIMESTAMP" != "null" ]; then
    RESUME_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$TIMESTAMP" "+%s" 2>/dev/null)
    NOW_EPOCH=$(date "+%s")

    if [ -n "$RESUME_EPOCH" ]; then
      ELAPSED=$((NOW_EPOCH - RESUME_EPOCH))

      if [ "$ELAPSED" -lt "$DISPLAY_DURATION" ]; then
        TITLE=$(jq -r '.title // "Session"' "$BLINK_STATE" 2>/dev/null)
        if [ -n "$TITLE" ] && [ "$TITLE" != "null" ]; then
          # Truncate long titles
          if [ ${#TITLE} -gt 30 ]; then
            TITLE="${TITLE:0:27}..."
          fi
          echo "⚡ $TITLE"
          exit 0
        fi
      fi
    fi
  fi
fi

# No Blink session or expired - output nothing
echo ""
