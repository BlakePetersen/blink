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

Tell the user to run the launcher in their terminal:

```
To browse and restore a session, run this in your terminal:

  "${CLAUDE_PLUGIN_ROOT}/scripts/browse-sessions.sh"

Use arrow keys to navigate, Enter to select, q to quit.
```

What happens: `browse-sessions.sh` runs the TUI, and when you press Enter it
records your choice as a pending-restore marker at
`.claude/sessions/.pending-restore`. The next time you start a Claude Code
session in this project, the session-start hook restores **that** snapshot
(then clears the marker). Selecting nothing leaves everything untouched.

Note: The TUI requires direct terminal access and can't run within Claude
Code's context, so it must be launched manually.

## Notes

- Sort by most recent first
- Show relative timestamps when possible
- The TUI is the premium experience but requires manual launch
- Enter → pending-restore marker → restored on next session start
