# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Blink, please report it privately:

1. **Do not** open a public GitHub issue
2. Email the maintainer directly or use GitHub's private vulnerability reporting feature
3. Include a detailed description of the vulnerability and steps to reproduce

You can expect:
- Acknowledgment within 48 hours
- A fix timeline within 7 days for critical issues
- Credit in the release notes (unless you prefer anonymity)

## Scope

Blink is a local CLI plugin that stores session snapshots on your filesystem. Security concerns include:
- Snapshot files containing sensitive conversation data
- Path traversal in session file handling
- Arbitrary code execution via malformed snapshots
