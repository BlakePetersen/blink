#!/bin/bash
# ABOUTME: Creates a Blink session snapshot file with proper directory structure
# ABOUTME: Called by agent when running /blink-rs or /blink-ss commands

set -e

# Parse arguments
TYPE="${1:-restart}"  # "restart" or "saved"
GLOBAL="${2:-false}"  # "true" for global, "false" for project-local
TITLE="${3:-}"        # Optional title (for saved sessions)

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
  FILENAME="$SLUG.md"
fi

FILEPATH="$TARGET_DIR/$FILENAME"

# Output the filepath for the agent to use
echo "$FILEPATH"
