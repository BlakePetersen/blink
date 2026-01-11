---
name: save
description: "Creates a named session snapshot with optional tags"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/create-snapshot.sh:*)", "Write", "AskUserQuestion"]
---

# Blink Save Session

You are creating a named session snapshot for later recall.

## Step 1: Get title and tags

Ask the user for a title and optional tags using AskUserQuestion:

```
question: "What should we call this session?"
header: "Title"
options:
  - label: "[Auto-suggested title based on current work]"
    description: "Use suggested title"
  - label: "Custom title"
    description: "Enter your own title"
```

If they want custom, ask them to type it.

Then ask for tags:

```
question: "Any tags for this session? (helps with filtering later)"
header: "Tags"
options:
  - label: "No tags"
    description: "Skip tagging"
  - label: "Add tags"
    description: "Enter comma-separated tags"
```

## Step 2: Get snapshot filepath

Run this command with the title:

```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/create-snapshot.sh" saved false "SESSION_TITLE_HERE"
```

## Step 3: Create the snapshot

Write a markdown file to the filepath from Step 2 with this format:

```markdown
---
title: "[The title from Step 1]"
tags: [tag1, tag2, tag3]
created: [Current ISO timestamp]
project: [Current working directory absolute path]
type: saved
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
[Any additional context needed to continue this work later]
```

## Step 4: Confirm to user

Output:

```
Session saved as "[title]"
```

If they added tags, also mention: `Tagged: tag1, tag2`

## Notes

- Suggest a title based on the current work (be specific, not generic)
- Tags should be lowercase, single words or hyphenated
- Be thorough - saved sessions may be loaded weeks later
- Focus on context that would be lost without this snapshot
