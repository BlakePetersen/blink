# Changelog

All notable changes to Blink will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Dev mode with `BLINK_DEV=1` environment variable
- Kitchen-sink mock session fixtures for testing
- `R` keybinding in dev mode to restore fixture data
- Vitest testing framework for TUI
- CLAUDE.md development guidelines
- CONTRIBUTING.md for open source contributors

## [0.4.0] - 2026-01-10

### Added
- TUI session browser with Ink/React
- Keyboard navigation (j/k, arrows)
- Session search and tag filtering
- Session preview pane
- Delete session functionality

## [0.3.0] - 2026-01-09

### Added
- Session-start hook for automatic resume detection
- Resume skill with intent detection (greeting vs task)
- Project-local and global session storage

## [0.2.0] - 2026-01-08

### Added
- `/blink-save` command for named snapshots
- Tag support for session organization
- `/blink-recall` command for browsing sessions

## [0.1.0] - 2026-01-07

### Added
- Initial release
- `/blink-restart` command for session snapshots
- Markdown-based session format with YAML frontmatter
