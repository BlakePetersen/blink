#!/bin/bash
# ABOUTME: Tests for Blink session-start hook
# ABOUTME: Verifies hook correctly detects and outputs most recent restart snapshot

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_SCRIPT="$SCRIPT_DIR/../hooks/session-start.sh"
TEST_DIR=$(mktemp -d)
ORIGINAL_DIR=$(pwd)

# Sandbox HOME so the hook's global fallback ($HOME/.claude/sessions/restarts)
# resolves inside TEST_DIR and never touches the developer's real home directory.
export HOME="$TEST_DIR/home"
mkdir -p "$HOME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

pass() { echo -e "${GREEN}PASS${NC}: $1"; }
fail() { echo -e "${RED}FAIL${NC}: $1"; exit 1; }

# jq is used to assert the hook emits valid JSON. Skip that assertion gracefully
# when jq is unavailable so the suite still runs in minimal environments.
if command -v jq >/dev/null 2>&1; then
  HAS_JQ=true
else
  HAS_JQ=false
fi

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
if [[ "$OUTPUT" == *"BLINK_SESSION_AVAILABLE"* ]] && [[ "$OUTPUT" == *"Test Session"* ]] && [[ "$OUTPUT" == *"Test content"* ]]; then
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
if [[ "$OUTPUT" == *"BLINK_SESSION_AVAILABLE"* ]] && [[ "$OUTPUT" == *"Newer"* ]] && [[ "$OUTPUT" != *"Older"* ]]; then
  pass "Outputs most recent file by modification time"
else
  fail "Expected resume context with 'Newer' but not 'Older', got: $OUTPUT"
fi

# Test 5: Global sessions fallback (when no project sessions)
# HOME is sandboxed to "$TEST_DIR/home", so the global path lives inside TEST_DIR.
echo "Test 5: Global sessions fallback"
rm -rf "$TEST_DIR/.claude"
mkdir -p "$HOME/.claude/sessions/restarts"
GLOBAL_FILE="$HOME/.claude/sessions/restarts/test-global-2025-01-10T18-00-00.md"
echo "---" > "$GLOBAL_FILE"
echo "title: Global Test" >> "$GLOBAL_FILE"
echo "---" >> "$GLOBAL_FILE"

OUTPUT=$("$HOOK_SCRIPT" 2>&1) || true
if [[ "$OUTPUT" == *"BLINK_SESSION_AVAILABLE"* ]] && [[ "$OUTPUT" == *"Global Test"* ]]; then
  pass "Falls back to global sessions when no project sessions"
else
  fail "Expected resume context with 'Global Test', got: $OUTPUT"
fi

# Cleanup global test file
rm -f "$GLOBAL_FILE"

# Test 6: Archived snapshots are NOT selected by find_latest_snapshot
echo "Test 6: Archived snapshots skipped"
rm -rf "$TEST_DIR/.claude" "$HOME/.claude"
cd "$TEST_DIR"
mkdir -p "$TEST_DIR/.claude/sessions/restarts/archived"
ARCHIVED_FILE="$TEST_DIR/.claude/sessions/restarts/archived/2025-01-10T20-00-00.md"
printf -- '---\ntitle: Archived Only\n---\n' > "$ARCHIVED_FILE"

OUTPUT=$("$HOOK_SCRIPT" 2>&1) || true
if [ -z "$OUTPUT" ]; then
  pass "Archived-only snapshots are not surfaced"
else
  fail "Expected no output when only archived snapshots exist, got: $OUTPUT"
fi

# Test 7: Active restart chosen over an archived sibling
echo "Test 7: Active restart preferred over archived"
ACTIVE_FILE="$TEST_DIR/.claude/sessions/restarts/2025-01-10T21-00-00.md"
printf -- '---\ntitle: Active Restart\n---\n' > "$ACTIVE_FILE"

OUTPUT=$("$HOOK_SCRIPT" 2>&1) || true
if [[ "$OUTPUT" == *"Active Restart"* ]] && [[ "$OUTPUT" != *"Archived Only"* ]]; then
  pass "Selects active restart, ignores archived sibling"
else
  fail "Expected 'Active Restart' not 'Archived Only', got: $OUTPUT"
fi

# Test 8: pending-restore marker selects the marked snapshot over the newest
echo "Test 8: pending-restore marker selects marked snapshot"
rm -rf "$TEST_DIR/.claude" "$HOME/.claude"
cd "$TEST_DIR"
mkdir -p "$TEST_DIR/.claude/sessions/restarts" "$TEST_DIR/.claude/sessions/saved"
NEWEST_FILE="$TEST_DIR/.claude/sessions/restarts/2025-01-11T09-00-00.md"
printf -- '---\ntitle: Newest Restart\n---\n' > "$NEWEST_FILE"
MARKED_FILE="$TEST_DIR/.claude/sessions/saved/picked.md"
printf -- '---\ntitle: Picked Session\n---\n' > "$MARKED_FILE"
MARKER="$TEST_DIR/.claude/sessions/.pending-restore"
echo "$MARKED_FILE" > "$MARKER"

OUTPUT=$("$HOOK_SCRIPT" 2>&1) || true
if [[ "$OUTPUT" == *"Picked Session"* ]] && [[ "$OUTPUT" != *"Newest Restart"* ]]; then
  pass "Marker selects the marked snapshot over the newest"
else
  fail "Expected 'Picked Session' not 'Newest Restart', got: $OUTPUT"
fi
if [ ! -f "$MARKER" ]; then
  pass "Pending-restore marker cleared after consumption"
else
  fail "Expected pending-restore marker to be cleared, but it still exists"
fi

# Test 9: stale marker (missing target) is cleared and falls back to newest
echo "Test 9: stale pending-restore marker falls back to newest"
rm -rf "$TEST_DIR/.claude" "$HOME/.claude"
cd "$TEST_DIR"
mkdir -p "$TEST_DIR/.claude/sessions/restarts"
FALLBACK_FILE="$TEST_DIR/.claude/sessions/restarts/2025-01-11T10-00-00.md"
printf -- '---\ntitle: Fallback Newest\n---\n' > "$FALLBACK_FILE"
MARKER="$TEST_DIR/.claude/sessions/.pending-restore"
echo "$TEST_DIR/.claude/sessions/saved/does-not-exist.md" > "$MARKER"

OUTPUT=$("$HOOK_SCRIPT" 2>&1) || true
if [[ "$OUTPUT" == *"Fallback Newest"* ]] && [ ! -f "$MARKER" ]; then
  pass "Stale marker cleared and falls back to newest restart"
else
  MARKER_STATE=$([ -f "$MARKER" ] && echo exists || echo cleared)
  fail "Expected fallback to 'Fallback Newest' with marker cleared ($MARKER_STATE), got: $OUTPUT"
fi

# Test 10: Snapshot with no/corrupt frontmatter still yields valid output
echo "Test 10: Missing/corrupt frontmatter"
rm -rf "$TEST_DIR/.claude" "$HOME/.claude"
cd "$TEST_DIR"
mkdir -p "$TEST_DIR/.claude/sessions/restarts"
CORRUPT_FILE="$TEST_DIR/.claude/sessions/restarts/2025-01-11T11-00-00.md"
# No frontmatter delimiters and no title: field at all.
printf 'just some body text with no frontmatter\nsecond line\n' > "$CORRUPT_FILE"

OUTPUT=$("$HOOK_SCRIPT" 2>&1) || true
if [[ "$OUTPUT" == *"BLINK_SESSION_AVAILABLE"* ]] && [[ "$OUTPUT" == *"just some body text"* ]]; then
  pass "Emits resume context even without frontmatter"
else
  fail "Expected resume context for frontmatter-less snapshot, got: $OUTPUT"
fi
if [ "$HAS_JQ" = true ]; then
  if echo "$OUTPUT" | jq . >/dev/null 2>&1; then
    pass "Frontmatter-less snapshot produces valid JSON"
  else
    fail "Hook output is not valid JSON: $OUTPUT"
  fi
else
  echo "  (skipping JSON assertion: jq not installed)"
fi

# Test 11: Title with quotes/backslashes is JSON-escaped into valid output
echo 'Test 11: Title with quotes/backslashes -> valid JSON'
rm -rf "$TEST_DIR/.claude" "$HOME/.claude"
cd "$TEST_DIR"
mkdir -p "$TEST_DIR/.claude/sessions/restarts"
QUOTED_FILE="$TEST_DIR/.claude/sessions/restarts/2025-01-11T12-00-00.md"
printf -- '---\ntitle: He said "hi" and C:\\path\n---\nBody with a "quote" and a \\backslash\n' > "$QUOTED_FILE"

OUTPUT=$("$HOOK_SCRIPT" 2>&1) || true
if [[ "$OUTPUT" == *"BLINK_SESSION_AVAILABLE"* ]]; then
  pass "Emits resume context for quoted/backslashed title"
else
  fail "Expected resume context for quoted title, got: $OUTPUT"
fi
if [ "$HAS_JQ" = true ]; then
  if echo "$OUTPUT" | jq . >/dev/null 2>&1; then
    pass "Quoted/backslashed title produces valid JSON"
  else
    fail "Hook output with quotes/backslashes is not valid JSON: $OUTPUT"
  fi
else
  echo "  (skipping JSON assertion: jq not installed)"
fi

# Test 12: Project sessions take precedence over global when both exist
echo "Test 12: Project-vs-global precedence"
rm -rf "$TEST_DIR/.claude" "$HOME/.claude"
cd "$TEST_DIR"
mkdir -p "$TEST_DIR/.claude/sessions/restarts" "$HOME/.claude/sessions/restarts"
PROJECT_FILE="$TEST_DIR/.claude/sessions/restarts/2025-01-11T13-00-00.md"
GLOBAL_FILE="$HOME/.claude/sessions/restarts/2025-01-11T14-00-00.md"
printf -- '---\ntitle: Project Wins\n---\n' > "$PROJECT_FILE"
# Make the global file newer to prove project still wins regardless of mtime.
sleep 0.1
printf -- '---\ntitle: Global Loses\n---\n' > "$GLOBAL_FILE"

OUTPUT=$("$HOOK_SCRIPT" 2>&1) || true
if [[ "$OUTPUT" == *"Project Wins"* ]] && [[ "$OUTPUT" != *"Global Loses"* ]]; then
  pass "Project snapshot preferred over global when both exist"
else
  fail "Expected 'Project Wins' not 'Global Loses', got: $OUTPUT"
fi

echo ""
echo -e "${GREEN}All tests passed!${NC}"
