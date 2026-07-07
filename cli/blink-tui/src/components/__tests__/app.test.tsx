// ABOUTME: Smoke-render test for the App component
// ABOUTME: Proves the .tsx test pipeline works and the empty state renders

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('App smoke render', () => {
  const originalEnv = process.env;
  let cwd: string;
  let home: string;

  beforeEach(() => {
    // Point HOME at an empty dir so global session paths (resolved from
    // homedir() at config load) are empty too, keeping the empty state
    // deterministic regardless of the machine running the test.
    vi.resetModules();
    process.env = { ...originalEnv };
    cwd = mkdtempSync(join(tmpdir(), 'blink-app-'));
    home = mkdtempSync(join(tmpdir(), 'blink-home-'));
    process.env.HOME = home;
  });

  afterEach(() => {
    process.env = originalEnv;
    rmSync(cwd, { recursive: true, force: true });
    rmSync(home, { recursive: true, force: true });
  });

  it('renders without throwing and shows the empty state', async () => {
    const { App } = await import('../../app.js');
    const { lastFrame, unmount } = render(<App cwd={cwd} />);
    expect(lastFrame()).toContain('No sessions yet');
    unmount();
  });

  it('retags the selected session through the e prompt', async () => {
    const savedDir = join(cwd, '.claude/sessions/saved');
    mkdirSync(savedDir, { recursive: true });
    const file = join(savedDir, 'session.md');
    writeFileSync(file, '---\ntitle: Retag Me\ncreated: 2026-01-01\n---\n## Status\nok\n');

    const { App } = await import('../../app.js');
    const { parseSession } = await import('../../lib/sessions.js');
    const { stdin, unmount } = render(<App cwd={cwd} />);
    await delay(20);

    stdin.write('e'); // open retag prompt
    await delay(20);
    stdin.write('alpha, beta');
    await delay(20);
    stdin.write('\r'); // submit
    await delay(20);

    const result = parseSession(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.tags).toEqual(['alpha', 'beta']);
    }
    unmount();
  });
});
