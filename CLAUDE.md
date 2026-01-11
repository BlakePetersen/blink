# Blink Development Guidelines

## Project Overview

Blink is a session persistence plugin for Claude Code. It enables saving, restoring, and browsing conversation snapshots.

## Architecture

- **Skills** (`/skills/`): Markdown skill definitions that Claude Code loads
- **Hooks** (`/hooks/`): Session-start detection for automatic resume prompts
- **TUI** (`/cli/blink-tui/`): React/Ink terminal interface for browsing sessions
- **Scripts** (`/scripts/`): Bash utilities for snapshot creation

## Development Rules

### Code Style
- All files MUST start with `// ABOUTME:` comments (2 lines) explaining the file's purpose
- Match existing code style - this project uses functional patterns
- No classes unless absolutely necessary

### Testing
- TDD is REQUIRED: Write failing test first, then implement
- Run `pnpm test` before every commit
- All new functions in `src/lib/` MUST have corresponding tests

### Commits
- Commit frequently - one logical change per commit
- Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`
- All commits must pass tests

### Pull Requests
- Branch from `main`, PR back to `main`
- PRs require passing CI before merge
- Keep PRs focused - one feature/fix per PR

### Version Bumping
- Follow semver: MAJOR.MINOR.PATCH
- PATCH: Bug fixes, no API changes
- MINOR: New features, backward compatible
- MAJOR: Breaking changes
- Version lives in `.claude-plugin/plugin.json`

## Dev Mode

Run TUI in dev mode for testing:
```bash
cd cli/blink-tui && pnpm dev /path/to/project
```

Dev mode features:
- `R` key: Restore fixture data (kitchen-sink mock sessions)
- Fixtures in `src/lib/__fixtures__/sessions/`

## Testing

```bash
# Unit tests (TUI)
cd cli/blink-tui && pnpm test

# With coverage
cd cli/blink-tui && pnpm test:coverage

# Bash tests (hooks/scripts)
./tests/test-create-snapshot.sh
./tests/test-session-start-hook.sh
```

## File Structure

```
blink/
├── .claude-plugin/      # Plugin manifest (version here)
├── cli/blink-tui/       # Terminal UI (React/Ink)
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── lib/         # Business logic (MUST have tests)
│   │   └── __fixtures__/ # Mock data for testing
├── commands/            # Slash command definitions
├── hooks/               # Claude Code hooks
├── scripts/             # Bash utilities
├── skills/              # Skill definitions
└── tests/               # Bash test scripts
```

## Releasing

1. Update version in `.claude-plugin/plugin.json`
2. Update CHANGELOG.md
3. Create git tag: `git tag v0.X.Y`
4. Push with tags: `git push --tags`
