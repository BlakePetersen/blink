// ABOUTME: Tests for reduced-motion resolution from settings and environment
// ABOUTME: Validates NO_COLOR, BLINK_REDUCED_MOTION, and the master toggle

import { describe, it, expect } from 'vitest';
import { isReducedMotion } from '../motion.js';
import { DEFAULT_SETTINGS, Settings } from '../settings.js';

function settingsWith(overrides: Partial<Settings['animation']>): Settings {
  return {
    ...DEFAULT_SETTINGS,
    animation: { ...DEFAULT_SETTINGS.animation, ...overrides },
  };
}

describe('isReducedMotion', () => {
  it('is reduced when NO_COLOR is present, regardless of toggles', () => {
    const settings = settingsWith({
      reducedMotion: false,
      cycling: true,
      wave: true,
      shimmer: true,
      breathing: true,
    });
    expect(isReducedMotion(settings, { NO_COLOR: '1' })).toBe(true);
  });

  it('treats an empty NO_COLOR as not set', () => {
    const settings = settingsWith({ reducedMotion: false });
    expect(isReducedMotion(settings, { NO_COLOR: '' })).toBe(false);
  });

  it('is reduced when BLINK_REDUCED_MOTION is present', () => {
    const settings = settingsWith({ reducedMotion: false });
    expect(isReducedMotion(settings, { BLINK_REDUCED_MOTION: '1' })).toBe(true);
  });

  it('is reduced when the master toggle is on', () => {
    const settings = settingsWith({ reducedMotion: true });
    expect(isReducedMotion(settings, {})).toBe(true);
  });

  it('is not reduced when no env var and master toggle off, even with effects on', () => {
    const settings = settingsWith({
      reducedMotion: false,
      cycling: true,
      wave: false,
      shimmer: false,
      breathing: false,
    });
    expect(isReducedMotion(settings, {})).toBe(false);
  });
});
