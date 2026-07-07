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

## Step 2: Choose scope (project vs global)

By default, save into the current project's `.claude/sessions/`. If the user
asks to save **globally** (e.g. `/blink:save --global`, "save this globally", or
"make it available everywhere"), save into `~/.claude/sessions/` instead so the
snapshot is not tied to this project.

## Step 3: Get snapshot filepath

Run this command with the title. The second argument is the global flag —
`false` for a project-local save, `true` for a global save:

```bash
# Project-local (default)
"${CLAUDE_PLUGIN_ROOT}/scripts/create-snapshot.sh" saved false "SESSION_TITLE_HERE"

# Global (when the user requested --global)
"${CLAUDE_PLUGIN_ROOT}/scripts/create-snapshot.sh" saved true "SESSION_TITLE_HERE"
```

## Step 4: Create the snapshot

Write a markdown file to the filepath from Step 3 with this format:

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

## Step 5: Confirm to user

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
