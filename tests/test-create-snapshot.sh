#!/bin/bash
# ABOUTME: Tests for Blink create-snapshot script
# ABOUTME: Verifies correct filepath generation for restart and saved snapshots

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CREATE_SCRIPT="$SCRIPT_DIR/../scripts/create-snapshot.sh"
TEST_DIR=$(mktemp -d)
ORIGINAL_DIR=$(pwd)

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

echo "Testing create-snapshot script..."
echo "Test dir: $TEST_DIR"
echo ""

cd "$TEST_DIR"

# Test 1: Restart snapshot creates correct path
echo "Test 1: Restart snapshot path format"
OUTPUT=$("$CREATE_SCRIPT" restart false 2>&1)
if [[ "$OUTPUT" =~ ^\.claude/sessions/restarts/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}-[0-9]{2}\.md$ ]]; then
  pass "Restart path has correct format"
else
  fail "Expected format '.claude/sessions/restarts/YYYY-MM-DDTHH-MM-SS.md', got: $OUTPUT"
fi

# Test 2: Directory is created
echo "Test 2: Directory creation"
if [ -d ".claude/sessions/restarts" ]; then
  pass "Restarts directory was created"
else
  fail "Expected directory '.claude/sessions/restarts' to exist"
fi

# Test 3: Saved snapshot with title
echo "Test 3: Saved snapshot with title"
OUTPUT=$("$CREATE_SCRIPT" saved false "My Feature Work" 2>&1)
EXPECTED=".claude/sessions/saved/my-feature-work.md"
if [ "$OUTPUT" = "$EXPECTED" ]; then
  pass "Saved path slugifies title correctly"
else
  fail "Expected '$EXPECTED', got: $OUTPUT"
fi

# Test 4: Saved directory is created
echo "Test 4: Saved directory creation"
if [ -d ".claude/sessions/saved" ]; then
  pass "Saved directory was created"
else
  fail "Expected directory '.claude/sessions/saved' to exist"
fi

# Test 5: Saved snapshot without title uses timestamp
echo "Test 5: Saved snapshot without title"
OUTPUT=$("$CREATE_SCRIPT" saved false "" 2>&1)
if [[ "$OUTPUT" =~ ^\.claude/sessions/saved/session-[0-9]{4}-[0-9]{2}-[0-9]{2}t[0-9]{2}-[0-9]{2}-[0-9]{2}\.md$ ]]; then
  pass "Saved path without title uses timestamp"
else
  fail "Expected format with timestamp, got: $OUTPUT"
fi

# Test 6: Global restart path
echo "Test 6: Global restart path"
OUTPUT=$("$CREATE_SCRIPT" restart true 2>&1)
if [[ "$OUTPUT" =~ ^$HOME/\.claude/sessions/restarts/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}-[0-9]{2}\.md$ ]]; then
  pass "Global restart path is correct"
else
  fail "Expected global path format, got: $OUTPUT"
fi

echo ""
echo -e "${GREEN}All tests passed!${NC}"
