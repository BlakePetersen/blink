#!/bin/bash
# ABOUTME: Tests for Blink session-start hook
# ABOUTME: Verifies hook correctly detects and outputs most recent restart snapshot

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_SCRIPT="$SCRIPT_DIR/../hooks/session-start.sh"
TEST_DIR=$(mktemp -d)
ORIGINAL_DIR=$(pwd)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

pass() { echo -e "${GREEN}PASS${NC}: $1"; }
fail() { echo -e "${RED}FAIL${NC}: $1"; exit 1; }

cleanup() {
  cd "$ORIGINAL_DIR"
  rm -rf "$TEST_DIR"
}
trap cleanup EXIT

echo "Testing session-start hook..."
echo "Test dir: $TEST_DIR"
echo ""

# Test 1: No .claude/sessions/restarts directory - should output nothing
echo "Test 1: No restart directory"
cd "$TEST_DIR"
OUTPUT=$("$HOOK_SCRIPT" 2>&1) || true
if [ -z "$OUTPUT" ]; then
  pass "No output when no restart directory exists"
else
  fail "Expected no output, got: $OUTPUT"
fi

# Test 2: Empty restarts directory - should output nothing
echo "Test 2: Empty restarts directory"
mkdir -p "$TEST_DIR/.claude/sessions/restarts"
OUTPUT=$("$HOOK_SCRIPT" 2>&1) || true
if [ -z "$OUTPUT" ]; then
  pass "No output when restart directory is empty"
else
  fail "Expected no output, got: $OUTPUT"
fi

# Test 3: Single restart file - should output full resume context
echo "Test 3: Single restart file"
SNAPSHOT_FILE="$TEST_DIR/.claude/sessions/restarts/2025-01-10T14-30-00.md"
echo "---" > "$SNAPSHOT_FILE"
echo "title: Test Session" >> "$SNAPSHOT_FILE"
echo "---" >> "$SNAPSHOT_FILE"
echo "## Working On" >> "$SNAPSHOT_FILE"
echo "Test content" >> "$SNAPSHOT_FILE"

OUTPUT=$("$HOOK_SCRIPT" 2>&1) || true
if [[ "$OUTPUT" == *"BLINK SESSION RESUME"* ]] && [[ "$OUTPUT" == *"Test Session"* ]] && [[ "$OUTPUT" == *"Test content"* ]]; then
  pass "Outputs full resume context with snapshot content"
else
  fail "Expected resume context with snapshot content, got: $OUTPUT"
fi

# Test 4: Multiple restart files - should output most recent (by modification time)
echo "Test 4: Multiple restart files - most recent by mtime"
OLDER_FILE="$TEST_DIR/.claude/sessions/restarts/2025-01-10T12-00-00.md"
NEWER_FILE="$TEST_DIR/.claude/sessions/restarts/2025-01-10T16-00-00.md"

echo "---" > "$OLDER_FILE"
echo "title: Older" >> "$OLDER_FILE"
echo "---" >> "$OLDER_FILE"
sleep 0.1  # Ensure different mtime

echo "---" > "$NEWER_FILE"
echo "title: Newer" >> "$NEWER_FILE"
echo "---" >> "$NEWER_FILE"

OUTPUT=$("$HOOK_SCRIPT" 2>&1) || true
if [[ "$OUTPUT" == *"BLINK SESSION RESUME"* ]] && [[ "$OUTPUT" == *"Newer"* ]] && [[ "$OUTPUT" != *"Older"* ]]; then
  pass "Outputs most recent file by modification time"
else
  fail "Expected resume context with 'Newer' but not 'Older', got: $OUTPUT"
fi

# Test 5: Global sessions fallback (when no project sessions)
echo "Test 5: Global sessions fallback"
rm -rf "$TEST_DIR/.claude"
mkdir -p "$HOME/.claude/sessions/restarts"
GLOBAL_FILE="$HOME/.claude/sessions/restarts/test-global-2025-01-10T18-00-00.md"
echo "---" > "$GLOBAL_FILE"
echo "title: Global Test" >> "$GLOBAL_FILE"
echo "---" >> "$GLOBAL_FILE"

OUTPUT=$("$HOOK_SCRIPT" 2>&1) || true
if [[ "$OUTPUT" == *"BLINK SESSION RESUME"* ]] && [[ "$OUTPUT" == *"Global Test"* ]]; then
  pass "Falls back to global sessions when no project sessions"
else
  fail "Expected resume context with 'Global Test', got: $OUTPUT"
fi

# Cleanup global test file
rm -f "$GLOBAL_FILE"

echo ""
echo -e "${GREEN}All tests passed!${NC}"
