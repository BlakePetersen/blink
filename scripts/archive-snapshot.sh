#!/usr/bin/env bash
# ABOUTME: Moves a consumed Blink snapshot into a sibling archived/ directory
# ABOUTME: so the resume hook stops re-surfacing it while history survives

set -euo pipefail

SNAPSHOT="${1:-}"

if [ -z "$SNAPSHOT" ]; then
  echo "usage: archive-snapshot.sh <snapshot-path>" >&2
  exit 1
fi

SNAPSHOT_DIR="$(dirname "$SNAPSHOT")"
SNAPSHOT_NAME="$(basename "$SNAPSHOT")"
ARCHIVE_DIR="${SNAPSHOT_DIR}/archived"
DEST="${ARCHIVE_DIR}/${SNAPSHOT_NAME}"

# Idempotent-safe: if the source is gone but an archived copy already exists,
# treat it as already archived instead of failing.
if [ ! -e "$SNAPSHOT" ]; then
  if [ -e "$DEST" ]; then
    echo "$DEST"
    exit 0
  fi
  echo "archive-snapshot.sh: no such snapshot: $SNAPSHOT" >&2
  exit 1
fi

mkdir -p "$ARCHIVE_DIR"

# Preserve any existing archived snapshot with the same name.
if [ -e "$DEST" ]; then
  DEST="${ARCHIVE_DIR}/${SNAPSHOT_NAME%.md}-$(date +%s).md"
fi

mv "$SNAPSHOT" "$DEST"
echo "$DEST"
