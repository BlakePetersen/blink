// ABOUTME: Tests for session loading and parsing logic
// ABOUTME: Validates frontmatter parsing, filtering, and edge cases

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadFixtureSessions, parseSession } from '../sessions.js';
import { FIXTURES_DIR } from '../__fixtures__/index.js';

declare global {
  // eslint-disable-next-line no-var
  var __blink_rce_probe: boolean | undefined;
}

describe('parseSession frontmatter security', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'blink-rce-'));
    globalThis.__blink_rce_probe = false;
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    delete globalThis.__blink_rce_probe;
  });

  it('does not execute JavaScript frontmatter payloads', () => {
    // A snapshot file whose fence selects gray-matter's `javascript` engine.
    // If that engine runs, the body is eval'd and the probe flips to true.
    const malicious = [
      '---js',
      'globalThis.__blink_rce_probe = true;',
      "module.exports = { title: 'pwned' };",
      '---',
      '# Body',
    ].join('\n');
    const file = join(dir, 'malicious.md');
    writeFileSync(file, malicious, 'utf-8');

    // Must not throw uncaught; parseSession swallows errors and returns null.
    const result = parseSession(file);

    expect(globalThis.__blink_rce_probe).toBe(false);
    expect(result).toBeNull();
  });

  it('still parses normal YAML frontmatter', () => {
    const yaml = [
      '---',
      'title: Real Session',
      'tags:',
      '  - alpha',
      '  - beta',
      'created: 2026-01-01',
      '---',
      '# Body',
    ].join('\n');
    const file = join(dir, 'valid.md');
    writeFileSync(file, yaml, 'utf-8');

    const result = parseSession(file);

    expect(result).not.toBeNull();
    expect(result?.title).toBe('Real Session');
    expect(result?.tags).toEqual(['alpha', 'beta']);
  });
});

describe('loadFixtureSessions', () => {
  it('loads all fixture sessions', () => {
    const sessions = loadFixtureSessions(FIXTURES_DIR);
    expect(sessions.length).toBeGreaterThanOrEqual(7);
  });

  it('parses session titles correctly', () => {
    const sessions = loadFixtureSessions(FIXTURES_DIR);
    const titles = sessions.map(s => s.title);
    expect(titles).toContain('Quick fix');
    expect(titles).toContain('Authentication System Overhaul - OAuth2 + PKCE Implementation');
  });

  it('parses session tags correctly', () => {
    const sessions = loadFixtureSessions(FIXTURES_DIR);
    const authSession = sessions.find(s => s.title.includes('OAuth2'));
    expect(authSession?.tags).toContain('auth');
    expect(authSession?.tags).toContain('security');
  });

  it('handles sessions with special characters in title', () => {
    const sessions = loadFixtureSessions(FIXTURES_DIR);
    const specialSession = sessions.find(s => s.title.includes('quotes'));
    expect(specialSession).toBeDefined();
    expect(specialSession?.title).toContain('"quotes"');
  });
});

describe('dev-mode', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns true when BLINK_DEV is set to "1"', async () => {
    process.env.BLINK_DEV = '1';
    const { isDevMode } = await import('../dev-mode.js');
    expect(isDevMode()).toBe(true);
  });

  it('returns true when BLINK_DEV is set to "true"', async () => {
    process.env.BLINK_DEV = 'true';
    const { isDevMode } = await import('../dev-mode.js');
    expect(isDevMode()).toBe(true);
  });

  it('returns false when BLINK_DEV is not set', async () => {
    delete process.env.BLINK_DEV;
    const { isDevMode } = await import('../dev-mode.js');
    expect(isDevMode()).toBe(false);
  });
});
