# Blink

Session persistence for Claude Code. Never lose your context again.

## What is Blink?

Blink lets you save and restore Claude Code sessions. When you're deep in a task and need to restart Claude, Blink captures your context—what you're working on, key decisions, next steps—so the next session can pick up exactly where you left off.

## Commands

| Command | Description |
|---------|-------------|
| `/blink-restart` | Save current session and restart. On next launch, you'll be prompted to restore. |
| `/blink-save` | Save a named snapshot with optional tags. Great for bookmarking milestones. |
| `/blink-recall` | Browse and load saved sessions. |

Add `--global` to `/blink-restart` or `/blink-save` to store the snapshot in
`~/.claude/sessions/` (available from any project) instead of the current
project's `.claude/sessions/`.

## Installation

### From Local Directory

1. Clone this repo:
   ```bash
   git clone https://github.com/blakepetersen/blink.git ~/Sites/blink
   ```

2. Symlink to your Claude plugins directory:
   ```bash
   ln -s ~/Sites/blink ~/.claude/plugins/local/blink
   ```

3. Enable the plugin in Claude Code settings or restart Claude Code.

### From Marketplace (Coming Soon)

```
/install blink
```

## How It Works

### Session Restart Flow

1. Run `/blink-restart` when you need to restart Claude
2. Blink captures your current context as a snapshot
3. Restart Claude Code
4. On launch, you'll see:
   ```
   Hey! You've got a session snapshot waiting:

     "JWT Authentication Flow"
     20 minutes ago

   Pick up where you left off?

     [R] Restore   [B] Browse sessions   [S] Start fresh
   ```

### Saved Sessions

Use `/blink-save` to create named snapshots at any point. These persist until you delete them, making it easy to return to past work.

### Session Browser (TUI)

For power users, Blink includes a terminal UI for browsing sessions. Launch it
with the browse script:

```bash
cd your-project && "$CLAUDE_PLUGIN_ROOT/scripts/browse-sessions.sh"
```

Navigate with the arrow keys and press Enter to pick a session. Your selection
is recorded as a pending-restore marker (`.claude/sessions/.pending-restore`),
and the **next** Claude Code session you start in that project resumes the
chosen snapshot instead of merely the newest one. The marker is cleared once
consumed.

### Consuming restarts

When you Restore or dismiss an auto-detected restart snapshot, Blink archives it
to `.claude/sessions/restarts/archived/` so the resume prompt does not keep
re-surfacing the same stale session. Archived snapshots are kept for history but
are never offered on start. Named saves under `saved/` persist untouched.

## Settings

Blink stores preferences in `~/.claude/plugins/blink/settings.json` (edit them
in the TUI settings screen). Alongside the theme and animation options, a
`behavior` block controls how sessions behave:

| Setting | Default | Effect |
|---------|---------|--------|
| `resumePrompt` | `true` | When `false`, the session-start hook stays silent and never offers to resume. |
| `retentionCount` | `10` | How many recent snapshots to keep. |
| `defaultScope` | `project` | Whether new snapshots default to project-local or `global`. |

## Storage

Sessions are stored as markdown files:

```
.claude/sessions/           # Per-project
  restarts/                 # Auto-saves from /blink-restart
    archived/               # Consumed restarts (kept for history, not offered)
  saved/                    # Named saves from /blink-save
  .pending-restore          # Marker: TUI-selected snapshot to restore next start

~/.claude/sessions/         # Global (with --global flag)
```

## Development

```bash
# Install TUI dependencies
cd cli/blink-tui && pnpm install

# Run TUI in dev mode
pnpm dev

# Build TUI
pnpm build
```

## License

MIT
