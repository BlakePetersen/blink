// ABOUTME: Tests for terminal-background detection and background palette selection
// ABOUTME: Ensures light terminals get a legible fill instead of a fixed dark one

import { describe, it, expect } from 'vitest';
import { isLightTerminal, getBackgrounds } from '../backgrounds.js';

describe('isLightTerminal', () => {
  it('assumes dark when COLORFGBG is unset', () => {
    expect(isLightTerminal({})).toBe(false);
  });

  it('detects a light background from COLORFGBG (bg 15)', () => {
    expect(isLightTerminal({ COLORFGBG: '0;15' })).toBe(true);
  });

  it('detects a light background from COLORFGBG (bg 7)', () => {
    expect(isLightTerminal({ COLORFGBG: '0;7' })).toBe(true);
  });

  it('detects a dark background from COLORFGBG (bg 0)', () => {
    expect(isLightTerminal({ COLORFGBG: '15;0' })).toBe(false);
  });

  it('treats bg 8 as dark', () => {
    expect(isLightTerminal({ COLORFGBG: '7;8' })).toBe(false);
  });

  it('handles the three-part COLORFGBG form (fg;default;bg)', () => {
    expect(isLightTerminal({ COLORFGBG: '0;default;15' })).toBe(true);
  });

  it('assumes dark when COLORFGBG is malformed', () => {
    expect(isLightTerminal({ COLORFGBG: 'garbage' })).toBe(false);
  });
});

describe('getBackgrounds', () => {
  it('returns the dark palette by default', () => {
    const bg = getBackgrounds({});
    expect(bg.filterBar).toBe('#3a3a3a');
  });

  it('returns a distinct light palette on a light terminal', () => {
    const dark = getBackgrounds({});
    const light = getBackgrounds({ COLORFGBG: '0;15' });
    expect(light.filterBar).not.toBe(dark.filterBar);
    expect(light.divider).not.toBe(dark.divider);
  });
});
