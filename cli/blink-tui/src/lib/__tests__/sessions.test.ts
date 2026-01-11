// ABOUTME: Tests for session loading and parsing logic
// ABOUTME: Validates frontmatter parsing, filtering, and edge cases

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadFixtureSessions } from '../sessions.js';
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
