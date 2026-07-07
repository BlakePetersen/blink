#!/bin/bash
# ABOUTME: Tests for Blink archive-snapshot script
# ABOUTME: Verifies snapshots move into archived/ and repeated calls stay safe

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHIVE_SCRIPT="$SCRIPT_DIR/../scripts/archive-snapshot.sh"
TEST_DIR=$(mktemp -d)
ORIGINAL_DIR=$(pwd)

# Sandbox HOME so nothing touches the real home directory
export HOME="$TEST_DIR/home"
mkdir -p "$HOME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

pass() { echo -e "${GREEN}PASS${NC}: $1"; }
fail() { echo -e "${RED}FAIL${NC}: $1"; exit 1; }

cleanup() {
  cd "$ORIGINAL_DIR"
  rm -rf "$TEST_DIR"
}
trap cleanup EXIT

echo "Testing archive-snapshot script..."
echo "Test dir: $TEST_DIR"
echo ""

cd "$TEST_DIR"

# Test 1: Moves a snapshot into a sibling archived/ directory
echo "Test 1: Moves snapshot into archived/"
mkdir -p "$TEST_DIR/.claude/sessions/restarts"
SNAP="$TEST_DIR/.claude/sessions/restarts/2025-01-10T14-30-00.md"
printf -- '---\ntitle: To Archive\n---\n' > "$SNAP"

"$ARCHIVE_SCRIPT" "$SNAP" >/dev/null 2>&1 || fail "archive-snapshot.sh exited non-zero"
DEST="$TEST_DIR/.claude/sessions/restarts/archived/2025-01-10T14-30-00.md"
if [ ! -f "$SNAP" ] && [ -f "$DEST" ]; then
  pass "Snapshot moved from restarts/ into restarts/archived/"
else
  fail "Expected snapshot moved to archived/ (src gone, dest present)"
fi

# Test 2: Creates the archived/ directory when it does not exist
echo "Test 2: Creates archived/ directory"
if [ -d "$TEST_DIR/.claude/sessions/restarts/archived" ]; then
  pass "archived/ directory was created"
else
  fail "Expected archived/ directory to be created"
fi

# Test 3: Idempotent-safe - re-archiving an already-moved snapshot succeeds
echo "Test 3: Idempotent when already archived"
if "$ARCHIVE_SCRIPT" "$SNAP" >/dev/null 2>&1; then
  if [ -f "$DEST" ]; then
    pass "Second call on already-archived path exits 0 and keeps archive"
  else
    fail "Archived copy disappeared after idempotent call"
  fi
else
  fail "Expected idempotent call to exit 0 when archived copy exists"
fi

# Test 4: Missing snapshot with no archived copy fails loudly
echo "Test 4: Missing snapshot errors"
if "$ARCHIVE_SCRIPT" "$TEST_DIR/.claude/sessions/restarts/nope.md" >/dev/null 2>&1; then
  fail "Expected non-zero exit for a missing snapshot"
else
  pass "Non-zero exit for a missing snapshot"
fi

# Test 5: No argument errors
echo "Test 5: Missing argument errors"
if "$ARCHIVE_SCRIPT" >/dev/null 2>&1; then
  fail "Expected non-zero exit when no path is given"
else
  pass "Non-zero exit when no path is given"
fi

echo ""
echo -e "${GREEN}All tests passed!${NC}"
