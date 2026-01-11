# Contributing to Blink

Thank you for your interest in contributing to Blink!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/blink.git`
3. Install dependencies: `cd cli/blink-tui && pnpm install`
4. Run tests: `pnpm test`

## Development Workflow

### Setting Up

```bash
# Link plugin for local testing
ln -s ~/path/to/blink ~/.claude/plugins/local/blink

# Run TUI in dev mode
cd cli/blink-tui && pnpm dev /path/to/test/project
```

### Making Changes

1. Create a branch: `git checkout -b feat/your-feature`
2. Write a failing test for your change
3. Implement the minimal code to pass the test
4. Run tests: `pnpm test`
5. Commit with conventional commit message
6. Push and open a PR

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add new feature` - New functionality
- `fix: resolve bug` - Bug fixes
- `docs: update readme` - Documentation only
- `test: add tests` - Test additions/changes
- `chore: update deps` - Maintenance tasks

### Code Style

- Start every file with `// ABOUTME:` comments explaining its purpose
- Use functional patterns over classes
- Keep functions small and focused
- Match the style of surrounding code

### Testing

- **Required**: All changes to `src/lib/` must include tests
- Run the full test suite before pushing
- Tests live in `__tests__` directories next to the code they test

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Fill out the PR template
4. Wait for review

## Questions?

Open an issue for discussion before starting large changes.
