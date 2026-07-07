// ABOUTME: Tests for session loading and parsing logic
// ABOUTME: Validates frontmatter parsing, filtering, and edge cases

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadFixtureSessions, loadSessionsFromDir } from '../sessions.js';
import { FIXTURES_DIR } from '../__fixtures__/index.js';

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

describe('loadSessionsFromDir parse errors', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'blink-sessions-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('loads valid sessions while collecting parse errors for malformed files', () => {
    writeFileSync(
      join(dir, 'good.md'),
      '---\ntitle: Good Session\ncreated: 2026-01-01\n---\n## Working On\nStuff\n'
    );
    writeFileSync(
      join(dir, 'bad.md'),
      '---\ntitle: "unterminated\ncreated: 2026-01-01\n---\nbody\n'
    );

    const { sessions, parseErrors } = loadSessionsFromDir(dir, 'saved');

    expect(sessions.map(s => s.title)).toContain('Good Session');
    expect(sessions).toHaveLength(1);
    expect(parseErrors).toHaveLength(1);
    expect(parseErrors[0].file).toContain('bad.md');
    expect(parseErrors[0].reason).toBeTruthy();
  });

  it('returns empty results for a directory that does not exist', () => {
    const { sessions, parseErrors } = loadSessionsFromDir(
      join(dir, 'nope'),
      'saved'
    );
    expect(sessions).toEqual([]);
    expect(parseErrors).toEqual([]);
  });

  it('reports no parse errors when all files are valid', () => {
    writeFileSync(
      join(dir, 'a.md'),
      '---\ntitle: A\ncreated: 2026-01-02\n---\n## Status\nok\n'
    );
    writeFileSync(
      join(dir, 'b.md'),
      '---\ntitle: B\ncreated: 2026-01-03\n---\n## Status\nok\n'
    );

    const { sessions, parseErrors } = loadSessionsFromDir(dir, 'saved');
    expect(sessions).toHaveLength(2);
    expect(parseErrors).toEqual([]);
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
