---
name: recall
description: "Browse and load saved sessions"
allowed-tools: ["Bash(ls:*)", "Bash(cat:*)", "Bash(head:*)", "Bash(grep:*)", "Bash(pnpm:*)", "Read", "AskUserQuestion"]
---

# Blink Recall Session

You are helping the user browse and load a saved session.

## Step 1: Check for sessions

```bash
# Count available sessions
ls .claude/sessions/saved/*.md .claude/sessions/restarts/*.md ~/.claude/sessions/saved/*.md ~/.claude/sessions/restarts/*.md 2>/dev/null | wc -l
```

If zero sessions, say: "No saved sessions found. Use /blink-save to create one."

## Step 2: Offer options

Ask the user:

```
question: "How do you want to browse sessions?"
header: "Browser"
options:
  - label: "Quick select"
    description: "List sessions here and pick one"
  - label: "TUI browser"
    description: "Launch the fancy terminal browser (opens in terminal)"
```

## If Quick Select

List available sessions:

```bash
# List all sessions with titles
for f in .claude/sessions/saved/*.md .claude/sessions/restarts/*.md 2>/dev/null; do
  [ -f "$f" ] && head -5 "$f" | grep -m1 "^title:" | sed "s/^title: *//" | tr -d '"'
done
```

Present as numbered list and let user pick. Then:

1. Read the selected session file
2. Announce: "Loading session: [title]"
3. Summarize the session state
4. Ask: "Ready to continue with [first next step]?"

## If TUI Browser

Tell the user:

```
To launch the TUI browser, run this in your terminal:

  cd [current directory] && pnpm --dir ~/.claude/plugins/local/blink/cli/blink-tui dev

Use arrow keys to navigate, Enter to select, q to quit.
```

Note: The TUI requires direct terminal access and can't run within Claude Code's context.

## Notes

- Sort by most recent first
- Show relative timestamps when possible
- The TUI is the premium experience but requires manual launch
