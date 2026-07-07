// ABOUTME: Tests for development-mode detection via the BLINK_DEV env var
// ABOUTME: Verifies fixture-loading/debug keybindings gate on the right values

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
