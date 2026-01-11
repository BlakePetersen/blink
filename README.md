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

For power users, Blink includes a terminal UI for browsing sessions:

```bash
cd your-project && pnpm --dir ~/.claude/plugins/local/blink/cli/blink-tui dev
```

## Storage

Sessions are stored as markdown files:

```
.claude/sessions/           # Per-project
  restarts/                 # Auto-saves from /blink-restart
  saved/                    # Named saves from /blink-save

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
