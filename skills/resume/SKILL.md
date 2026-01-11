---
name: resume
description: "Handles session resume confirmation when a snapshot is detected at session start"
---

# Blink Session Resume

A session snapshot was detected. Your response depends on what the user said.

## Detect User Intent

Analyze the user's first message:

**Casual greeting** - "hi", "hello", "hey", "yo", "sup", or similar:
→ Use the **Greeting Response** below

**Task-oriented** - anything with a specific request or question:
→ Use the **Task Response** below

## Greeting Response

When the user just says hi, lead with the snapshot conversationally:

```
Hey! You've got a session snapshot waiting:

  "[TITLE]"
  [RELATIVE_TIME] ago

Pick up where you left off?

  [R] Restore   [B] Browse sessions   [S] Start fresh
```

## Task Response

When the user has a specific task, acknowledge it but offer the snapshot first:

```
On it. Quick thing first - you have a snapshot from earlier:

  "[TITLE]"

[R] Restore that session   [S] Skip, help with this instead   [B] Browse all
```

## Placeholders

- `[TITLE]` - Extract from snapshot frontmatter
- `[RELATIVE_TIME]` - Calculate from created timestamp (e.g., "20 minutes", "2 hours", "yesterday")

## Handle Response

### Restore (R)

Load the snapshot context and announce:

```
Resuming: [title]. [Brief status]. Continuing with [first next step].
```

Then proceed with the next steps from the snapshot.

### Skip (S)

If they had a task, help with it:
```
Starting fresh. [Address their original request]
```

If they just said hi:
```
Starting fresh. What are we working on?
```

### Browse (B)

```
Opening session browser...
```

Then invoke the `blink:recall` skill to launch the TUI.

## Notes

- Keep it brief - don't block the user
- Snapshot persists until manually deleted via browser
- If snapshot data is malformed, skip silently and help with their request
