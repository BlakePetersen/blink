# GitHub Repository Setup

## Branch Protection Rules

Configure these rules for the `main` branch in GitHub Settings > Branches:

### Required Settings

1. **Require a pull request before merging**
   - Require approvals: 1 (or 0 if solo maintainer)
   - Dismiss stale pull request approvals when new commits are pushed: ✓

2. **Require status checks to pass before merging**
   - Require branches to be up to date before merging: ✓
   - Status checks required: `test` (once CI is set up)

3. **Do not allow bypassing the above settings**
   - Even admins should go through PR process

### Optional but Recommended

- Require conversation resolution before merging: ✓
- Require signed commits: ✓ (if contributors have GPG set up)

## GitHub Actions CI

Create `.github/workflows/test.yml`:

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'pnpm'
          cache-dependency-path: cli/blink-tui/pnpm-lock.yaml
      - run: cd cli/blink-tui && pnpm install
      - run: cd cli/blink-tui && pnpm test
      - run: cd cli/blink-tui && pnpm build
```

## Issue Templates

Consider adding `.github/ISSUE_TEMPLATE/`:
- `bug_report.md` - Bug report template
- `feature_request.md` - Feature request template

## PR Template

Create `.github/pull_request_template.md`:

```markdown
## Description

[Describe your changes]

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Refactoring

## Checklist

- [ ] Tests pass locally
- [ ] Code follows project style
- [ ] Documentation updated (if needed)
```
