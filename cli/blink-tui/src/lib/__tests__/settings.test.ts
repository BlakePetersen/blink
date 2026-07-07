// ABOUTME: Tests for settings loading, saving, and defaults
// ABOUTME: Validates theme presets and settings persistence

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  applyPreset,
  applyThemeToSettings,
  DEFAULT_BEHAVIOR,
  DEFAULT_SETTINGS,
  loadSettings,
  mergeSettings,
  persistSettings,
  previewSwatch,
  snapSpeedToBucket,
  THEME_PRESETS,
  type Settings,
} from '../settings.js';

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

    it('enables the resume prompt by default', () => {
      expect(DEFAULT_SETTINGS.behavior.resumePrompt).toBe(true);
    });

    it('defaults to project scope', () => {
      expect(DEFAULT_SETTINGS.behavior.defaultScope).toBe('project');
    });

    it('has a positive default retention count', () => {
      expect(DEFAULT_SETTINGS.behavior.retentionCount).toBeGreaterThan(0);
    });
  });

  describe('behavior settings', () => {
    it('every theme preset carries the default behavior', () => {
      for (const preset of Object.values(THEME_PRESETS)) {
        expect(preset.behavior).toEqual(DEFAULT_BEHAVIOR);
      }
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

  describe('applyPreset', () => {
    it('returns settings for valid preset name', () => {
      const result = applyPreset('minimal');
      expect(result.theme).toBe('minimal');
      expect(result.colors).toEqual(THEME_PRESETS['minimal'].colors);
    });

    it('returns DEFAULT_SETTINGS for unknown preset name', () => {
      const result = applyPreset('nonexistent');
      expect(result).toEqual(DEFAULT_SETTINGS);
    });

    it('returns correct settings for each preset', () => {
      for (const [name, preset] of Object.entries(THEME_PRESETS)) {
        const result = applyPreset(name);
        expect(result).toEqual(preset);
      }
    });
  });

  describe('applyThemeToSettings', () => {
    it('replaces only theme and colors, preserving the user animation settings', () => {
      const current: Settings = {
        ...THEME_PRESETS['goth-whimsy'],
        animation: {
          speed: 500,
          reducedMotion: true,
          cycling: false,
          wave: false,
          shimmer: false,
          breathing: false,
        },
      };

      const result = applyThemeToSettings(current, THEME_PRESETS['minimal']);

      expect(result.theme).toBe('minimal');
      expect(result.colors).toEqual(THEME_PRESETS['minimal'].colors);
      expect(result.animation).toEqual(current.animation);
    });

    it('does not mutate the current settings', () => {
      const current: Settings = { ...THEME_PRESETS['ember'] };
      applyThemeToSettings(current, THEME_PRESETS['cyberpunk']);
      expect(current.theme).toBe('ember');
    });
  });

  describe('snapSpeedToBucket', () => {
    it('snaps each preset speed to the nearest bucket', () => {
      expect(snapSpeedToBucket(THEME_PRESETS['goth-whimsy'].animation.speed)).toBe(250);
      expect(snapSpeedToBucket(THEME_PRESETS['minimal'].animation.speed)).toBe(500);
      expect(snapSpeedToBucket(THEME_PRESETS['cyberpunk'].animation.speed)).toBe(150);
      // ember's 300ms falls between buckets and must snap to the nearest (250)
      expect(snapSpeedToBucket(THEME_PRESETS['ember'].animation.speed)).toBe(250);
    });

    it('clamps out-of-range values to the nearest bucket', () => {
      expect(snapSpeedToBucket(10)).toBe(150);
      expect(snapSpeedToBucket(9999)).toBe(500);
    });
  });

  describe('loadSettings', () => {
    let tmpHome: string;
    let originalHome: string | undefined;

    beforeEach(() => {
      originalHome = process.env.HOME;
      tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'blink-settings-'));
      process.env.HOME = tmpHome;
    });

    afterEach(() => {
      if (originalHome === undefined) {
        delete process.env.HOME;
      } else {
        process.env.HOME = originalHome;
      }
      fs.rmSync(tmpHome, { recursive: true, force: true });
    });

    function writeSettings(obj: unknown): void {
      const dir = path.join(tmpHome, '.claude', 'plugins', 'blink');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify(obj));
    }

    it('returns defaults when no settings file exists', () => {
      const result = loadSettings();
      expect(result).toEqual(DEFAULT_SETTINGS);
    });

    it('coerces corrupt fields to defaults while keeping valid ones', () => {
      writeSettings({
        theme: 'not-a-real-theme',
        colors: {
          base: ['#123456', 'nope', '#abcdef'],
          accent1: 'red',
          accent2: '#00ffff',
          accent3: '#ffd700',
        },
        animation: {
          speed: 'fast',
          reducedMotion: 'yes',
          cycling: false,
          wave: true,
          shimmer: true,
          breathing: true,
        },
      });

      const result = loadSettings();

      // Unknown theme falls back to default
      expect(result.theme).toBe(DEFAULT_SETTINGS.theme);
      // String speed coerced to default number
      expect(result.animation.speed).toBe(DEFAULT_SETTINGS.animation.speed);
      // Non-hex accent coerced to default
      expect(result.colors.accent1).toBe(DEFAULT_SETTINGS.colors.accent1);
      // Non-boolean coerced to default boolean
      expect(result.animation.reducedMotion).toBe(DEFAULT_SETTINGS.animation.reducedMotion);

      // Valid fields preserved
      expect(result.colors.accent2).toBe('#00ffff');
      expect(result.colors.accent3).toBe('#ffd700');
      expect(result.colors.base[0]).toBe('#123456');
      expect(result.colors.base[2]).toBe('#abcdef');
      expect(result.animation.cycling).toBe(false);
      expect(result.animation.shimmer).toBe(true);

      // A single bad element in base falls back per-index without nuking the rest
      expect(result.colors.base[1]).toBe(DEFAULT_SETTINGS.colors.base[1]);
    });

    it('keeps a valid in-range numeric speed', () => {
      writeSettings({
        ...DEFAULT_SETTINGS,
        animation: { ...DEFAULT_SETTINGS.animation, speed: 300 },
      });
      const result = loadSettings();
      expect(result.animation.speed).toBe(300);
    });

    it('applies behavior defaults when the behavior block is missing', () => {
      writeSettings({ theme: 'minimal' });
      const result = loadSettings();
      expect(result.behavior).toEqual(DEFAULT_BEHAVIOR);
    });

    it('preserves valid behavior settings', () => {
      writeSettings({
        ...DEFAULT_SETTINGS,
        behavior: { resumePrompt: false, retentionCount: 25, defaultScope: 'global' },
      });
      const result = loadSettings();
      expect(result.behavior.resumePrompt).toBe(false);
      expect(result.behavior.retentionCount).toBe(25);
      expect(result.behavior.defaultScope).toBe('global');
    });

    it('coerces corrupt behavior fields back to defaults', () => {
      writeSettings({
        behavior: { resumePrompt: 'nope', retentionCount: -4, defaultScope: 'sideways' },
      });
      const result = loadSettings();
      expect(result.behavior.resumePrompt).toBe(DEFAULT_BEHAVIOR.resumePrompt);
      expect(result.behavior.retentionCount).toBe(DEFAULT_BEHAVIOR.retentionCount);
      expect(result.behavior.defaultScope).toBe(DEFAULT_BEHAVIOR.defaultScope);
    });
  });

  describe('mergeSettings', () => {
    it('deep-merges colors and animation without dropping siblings', () => {
      const next = mergeSettings(DEFAULT_SETTINGS, {
        animation: { ...DEFAULT_SETTINGS.animation, shimmer: false },
      });
      expect(next.animation.shimmer).toBe(false);
      // Other animation fields are preserved.
      expect(next.animation.cycling).toBe(DEFAULT_SETTINGS.animation.cycling);
      // Untouched blocks are preserved.
      expect(next.colors).toEqual(DEFAULT_SETTINGS.colors);
    });

    it('does not mutate the source settings', () => {
      const source = applyPreset('minimal');
      const snapshot = JSON.parse(JSON.stringify(source));
      mergeSettings(source, { theme: 'ember' });
      expect(source).toEqual(snapshot);
    });
  });

  describe('previewSwatch', () => {
    it('returns the base ramp followed by the three accents', () => {
      const swatch = previewSwatch(DEFAULT_SETTINGS.colors);
      expect(swatch).toEqual([
        ...DEFAULT_SETTINGS.colors.base,
        DEFAULT_SETTINGS.colors.accent1,
        DEFAULT_SETTINGS.colors.accent2,
        DEFAULT_SETTINGS.colors.accent3,
      ]);
    });
  });

  describe('persistSettings', () => {
    let tmpHome: string;
    let originalHome: string | undefined;

    beforeEach(() => {
      originalHome = process.env.HOME;
      tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'blink-persist-'));
      process.env.HOME = tmpHome;
    });

    afterEach(() => {
      if (originalHome === undefined) {
        delete process.env.HOME;
      } else {
        process.env.HOME = originalHome;
      }
      fs.rmSync(tmpHome, { recursive: true, force: true });
    });

    it('writes settings and returns true on success', () => {
      expect(persistSettings(DEFAULT_SETTINGS)).toBe(true);
      const saved = loadSettings();
      expect(saved).toEqual(DEFAULT_SETTINGS);
    });

    it('returns false without throwing when the write fails', () => {
      // Plant a regular file where the settings directory tree must live, so
      // mkdirSync/writeFileSync fail with ENOTDIR - simulating a read-only or
      // otherwise unwritable target without mocking (unspyable in ESM).
      fs.writeFileSync(path.join(tmpHome, '.claude'), 'not a directory');
      expect(() => persistSettings(DEFAULT_SETTINGS)).not.toThrow();
      expect(persistSettings(DEFAULT_SETTINGS)).toBe(false);
    });
  });
});
