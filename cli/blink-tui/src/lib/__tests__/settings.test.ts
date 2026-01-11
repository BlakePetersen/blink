// ABOUTME: Tests for settings loading, saving, and defaults
// ABOUTME: Validates theme presets and settings persistence

import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS, THEME_PRESETS } from '../settings.js';

describe('settings', () => {
  describe('DEFAULT_SETTINGS', () => {
    it('has goth-whimsy as default theme', () => {
      expect(DEFAULT_SETTINGS.theme).toBe('goth-whimsy');
    });

    it('has all animation options enabled by default', () => {
      expect(DEFAULT_SETTINGS.animation.cycling).toBe(true);
      expect(DEFAULT_SETTINGS.animation.wave).toBe(true);
      expect(DEFAULT_SETTINGS.animation.shimmer).toBe(true);
      expect(DEFAULT_SETTINGS.animation.breathing).toBe(true);
    });

    it('has balanced animation speed', () => {
      expect(DEFAULT_SETTINGS.animation.speed).toBe(250);
    });
  });

  describe('THEME_PRESETS', () => {
    it('includes all four preset themes', () => {
      expect(THEME_PRESETS).toHaveProperty('goth-whimsy');
      expect(THEME_PRESETS).toHaveProperty('minimal');
      expect(THEME_PRESETS).toHaveProperty('cyberpunk');
      expect(THEME_PRESETS).toHaveProperty('ember');
    });
  });
});
