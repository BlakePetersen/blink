---
name: restart
description: "Creates a session snapshot for seamless handoff to the next Claude instance"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/create-snapshot.sh:*)", "Bash(cat:*)", "Bash(jq:*)", "Write"]
---

# Blink Restart Session

You are creating a session snapshot for handoff to the next Claude instance.

## Step 1: Get snapshot filepath

Run this command to get the filepath:

```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/create-snapshot.sh" restart false
```

## Step 2: Create the snapshot

Write a markdown file to the filepath from Step 1 with this format:

```markdown
---
title: "[Brief descriptive title of current work]"
tags: []
created: [Current ISO timestamp]
project: [Current working directory absolute path]
type: restart
---

## Working On
[1-2 sentences describing the current task/goal]

## Status
[Current progress - what phase, what's done, what's in progress]

## Key Decisions
[Bullet list of important decisions made this session]

## Files Involved
[Bullet list of key files being worked on]

## Next Steps
[Numbered list of immediate next actions]

## Context
[Any additional context the next agent needs to continue seamlessly]
```

## Step 3: Confirm to user

Output exactly:

```
Session snapshot saved. Restart Claude Code to continue.
```

## Important

- Be thorough but concise in the snapshot
- Focus on what the NEXT agent needs to know to continue immediately
- Include any gotchas, blockers, or important context
- Do NOT include conversation history - just actionable state
