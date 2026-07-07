#!/bin/bash
# ABOUTME: Tests for Blink create-snapshot script
# ABOUTME: Verifies correct filepath generation for restart and saved snapshots

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CREATE_SCRIPT="$SCRIPT_DIR/../scripts/create-snapshot.sh"
TEST_DIR=$(mktemp -d)
ORIGINAL_DIR=$(pwd)

# Sandbox HOME so the script's global path ($HOME/.claude/sessions) and settings
# ($HOME/.claude/plugins/blink/settings.json) resolve inside TEST_DIR and never
# touch the developer's real home directory.
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

# Test 7: Degenerate title with symbols and spaces falls back to timestamp
echo "Test 7: Degenerate title ('!!! ???')"
OUTPUT=$("$CREATE_SCRIPT" saved false '!!! ???' 2>&1)
BASENAME=$(basename "$OUTPUT")
if [ "$BASENAME" = ".md" ] || [ "$BASENAME" = "-.md" ]; then
  fail "Degenerate title produced invalid filename: $BASENAME"
elif [[ "$BASENAME" =~ ^session-[0-9]{4}-[0-9]{2}-[0-9]{2}t[0-9]{2}-[0-9]{2}-[0-9]{2}\.md$ ]]; then
  pass "Degenerate title falls back to timestamp"
else
  fail "Expected 'session-<timestamp>.md', got: $BASENAME"
fi

# Test 8: Symbols-only title (no spaces) falls back to timestamp
echo "Test 8: Symbols-only title ('@#\$%')"
OUTPUT=$("$CREATE_SCRIPT" saved false '@#$%' 2>&1)
BASENAME=$(basename "$OUTPUT")
if [ "$BASENAME" = ".md" ] || [ "$BASENAME" = "-.md" ]; then
  fail "Symbols-only title produced invalid filename: $BASENAME"
elif [[ "$BASENAME" =~ ^session-[0-9]{4}-[0-9]{2}-[0-9]{2}t[0-9]{2}-[0-9]{2}-[0-9]{2}\.md$ ]]; then
  pass "Symbols-only title falls back to timestamp"
else
  fail "Expected 'session-<timestamp>.md', got: $BASENAME"
fi

# Test 9: Title with quotes and backslashes slugifies to a safe filename
echo "Test 9: Title with quotes/backslashes ('He said \"hi\" C:\\path')"
OUTPUT=$("$CREATE_SCRIPT" saved false 'He said "hi" C:\path' 2>&1)
BASENAME=$(basename "$OUTPUT")
if [[ "$BASENAME" == *'"'* ]] || [[ "$BASENAME" == *'\'* ]]; then
  fail "Slug retained quotes/backslashes: $BASENAME"
elif [ "$BASENAME" = "he-said-hi-cpath.md" ]; then
  pass "Quotes and backslashes stripped from slug"
else
  fail "Expected 'he-said-hi-cpath.md', got: $BASENAME"
fi

# Helpers for retention tests: count *.md directly in a dir (excludes subdirs).
count_md() {
  find "$1" -maxdepth 1 -type f -name '*.md' 2>/dev/null | wc -l | tr -d '[:space:]'
}

# Test 10: Retention prunes old restarts down to the default (keep 20) (#30)
echo "Test 10: Restart retention prunes to default (20)"
RETAIN_DIR="$TEST_DIR/retention-default"
mkdir -p "$RETAIN_DIR"
cd "$RETAIN_DIR"
rm -rf ".claude"
mkdir -p ".claude/sessions/restarts"
# Create 25 restart snapshots with strictly increasing mtimes.
for i in $(seq -w 1 25); do
  f=".claude/sessions/restarts/2025-01-01T00-00-$i.md"
  printf -- '---\ntitle: R%s\n---\n' "$i" > "$f"
  # Strictly increasing mtime: YYMMDDhhmm with the minute field driven by $i.
  touch -t "25010100$i" "$f" 2>/dev/null || true
done
# Sanity: the oldest snapshot exists before pruning.
OLDEST=".claude/sessions/restarts/2025-01-01T00-00-01.md"
[ -f "$OLDEST" ] || fail "Setup error: oldest restart missing before prune"
NEWFILE=$("$CREATE_SCRIPT" restart false 2>&1)
# Simulate the agent writing the returned snapshot path.
printf -- '---\ntitle: Brand New\n---\n' > "$NEWFILE"
REMAINING=$(count_md ".claude/sessions/restarts")
if [ "$REMAINING" = "20" ]; then
  pass "Restarts pruned to the default retention of 20 (incl. the new one)"
else
  fail "Expected 20 restarts after prune, got: $REMAINING"
fi
if [ ! -f "$OLDEST" ]; then
  pass "Oldest restart was pruned"
else
  fail "Expected oldest restart to be pruned"
fi
if [ -f "$NEWFILE" ]; then
  pass "Newly created restart is retained"
else
  fail "Expected the new restart to survive pruning"
fi

# Test 11: Retention count is configurable via settings.json
echo "Test 11: Retention honors behavior.retentionCount from settings"
mkdir -p "$HOME/.claude/plugins/blink"
printf '{"behavior":{"retentionCount":5}}' > "$HOME/.claude/plugins/blink/settings.json"
RETAIN_DIR2="$TEST_DIR/retention-configured"
mkdir -p "$RETAIN_DIR2"
cd "$RETAIN_DIR2"
rm -rf ".claude"
mkdir -p ".claude/sessions/restarts"
for i in $(seq -w 1 12); do
  f=".claude/sessions/restarts/2025-02-01T00-00-$i.md"
  printf -- '---\ntitle: C%s\n---\n' "$i" > "$f"
  touch -t "25020100$i" "$f" 2>/dev/null || true
done
NEWFILE2=$("$CREATE_SCRIPT" restart false 2>&1)
printf -- '---\ntitle: Configured New\n---\n' > "$NEWFILE2"
REMAINING2=$(count_md ".claude/sessions/restarts")
if [ "$REMAINING2" = "5" ]; then
  pass "Restarts pruned to the configured retention of 5"
else
  fail "Expected 5 restarts after prune, got: $REMAINING2"
fi
rm -rf "$HOME/.claude/plugins"

# Test 12: saved/ and restarts/archived/ are NEVER pruned
echo "Test 12: saved/ and archived/ are exempt from pruning"
RETAIN_DIR3="$TEST_DIR/retention-exempt"
mkdir -p "$RETAIN_DIR3"
cd "$RETAIN_DIR3"
rm -rf ".claude"
mkdir -p ".claude/sessions/restarts/archived" ".claude/sessions/saved"
# Many saved + archived files that must all survive a restart prune.
for i in $(seq -w 1 30); do
  printf -- '---\ntitle: S%s\n---\n' "$i" > ".claude/sessions/saved/saved-$i.md"
  printf -- '---\ntitle: A%s\n---\n' "$i" > ".claude/sessions/restarts/archived/arch-$i.md"
done
# A couple of active restarts so pruning actually runs.
for i in $(seq -w 1 25); do
  f=".claude/sessions/restarts/2025-03-01T00-00-$i.md"
  printf -- '---\ntitle: X%s\n---\n' "$i" > "$f"
  touch -t "25030100$i" "$f" 2>/dev/null || true
done
NEWFILE3=$("$CREATE_SCRIPT" restart false 2>&1)
printf -- '---\ntitle: Exempt New\n---\n' > "$NEWFILE3"
SAVED_COUNT=$(count_md ".claude/sessions/saved")
ARCHIVED_COUNT=$(count_md ".claude/sessions/restarts/archived")
ACTIVE_COUNT=$(count_md ".claude/sessions/restarts")
if [ "$SAVED_COUNT" = "30" ]; then
  pass "saved/ snapshots are never pruned (30 intact)"
else
  fail "Expected 30 saved snapshots, got: $SAVED_COUNT"
fi
if [ "$ARCHIVED_COUNT" = "30" ]; then
  pass "restarts/archived/ snapshots are never pruned (30 intact)"
else
  fail "Expected 30 archived snapshots, got: $ARCHIVED_COUNT"
fi
if [ "$ACTIVE_COUNT" = "20" ]; then
  pass "Active restarts still pruned to default while exempt dirs untouched"
else
  fail "Expected 20 active restarts after prune, got: $ACTIVE_COUNT"
fi

# Test 13: Saved snapshots do not trigger any pruning of restarts
echo "Test 13: Creating a saved snapshot never prunes restarts"
RETAIN_DIR4="$TEST_DIR/saved-no-prune"
mkdir -p "$RETAIN_DIR4"
cd "$RETAIN_DIR4"
rm -rf ".claude"
mkdir -p ".claude/sessions/restarts"
for i in $(seq -w 1 25); do
  printf -- '---\ntitle: Y%s\n---\n' "$i" > ".claude/sessions/restarts/2025-04-01T00-00-$i.md"
done
"$CREATE_SCRIPT" saved false "Milestone" >/dev/null 2>&1
RESTART_AFTER_SAVE=$(count_md ".claude/sessions/restarts")
if [ "$RESTART_AFTER_SAVE" = "25" ]; then
  pass "A saved snapshot leaves all 25 restarts untouched"
else
  fail "Expected 25 restarts untouched by a saved snapshot, got: $RESTART_AFTER_SAVE"
fi

echo ""
echo -e "${GREEN}All tests passed!${NC}"
