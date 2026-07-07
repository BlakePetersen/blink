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

If the injected context includes a **Recent snapshots** list with more than one
entry, also offer the picker so a newer trivial restart does not shadow earlier
work or a saved session:

```
Or pick a specific one:

  [1] "[TITLE #1]"  [2] "[TITLE #2]"  [3] "[TITLE #3]"
```

## Task Response

When the user has a specific task, acknowledge it but offer the snapshot first:

```
On it. Quick thing first - you have a snapshot from earlier:

  "[TITLE]"

[R] Restore that session   [S] Skip, help with this instead   [B] Browse all
```

If a **Recent snapshots** list is present, mention they can pick another by
number instead of restoring the featured one.

## Placeholders

- `[TITLE]` - Extract from snapshot frontmatter
- `[RELATIVE_TIME]` - Calculate from created timestamp (e.g., "20 minutes", "2 hours", "yesterday")

## Handle Response

### Restore (R)

Load the snapshot context and announce:

```
Resuming: [title]. [Brief status]. Continuing with [first next step].
```

Then **consume the snapshot** so it is not offered again (see "Consuming the snapshot" below), and proceed with the next steps from the snapshot.

### Skip (S)

This is an explicit dismissal, so **consume the snapshot** (see below) before continuing.

If they had a task, help with it:
```
Starting fresh. [Address their original request]
```

If they just said hi:
```
Starting fresh. What are we working on?
```

### Pick by number (1, 2, 3, ...)

When the user picks a number from the **Recent snapshots** list, read that
snapshot's file (its path is shown beneath each entry), then restore it exactly
as in **Restore (R)** — announce, consume (if it is a restart), and continue.

### Browse (B)

```
Opening session browser...
```

Then invoke the `blink:recall` skill to launch the TUI. Do **not** consume this
snapshot on Browse — the browser writes its own pending-restore selection.

## Consuming the snapshot

When the user Restores or Skips, archive the auto-detected restart snapshot so
the next session start does not re-surface it. The snapshot Path is provided in
the injected context above.

```bash
# Only archive auto-detected restart snapshots (path under restarts/).
# Saved sessions persist by design and must not be archived here.
case "[PATH]" in
  */restarts/*) "${CLAUDE_PLUGIN_ROOT}/scripts/archive-snapshot.sh" "[PATH]" ;;
esac
```

## Notes

- Keep it brief - don't block the user
- Restored/dismissed restart snapshots are moved to `restarts/archived/` (they
  survive there for history but are no longer offered on start)
- If snapshot data is malformed, skip silently and help with their request
