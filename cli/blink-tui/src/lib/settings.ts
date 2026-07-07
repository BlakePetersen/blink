// ABOUTME: Settings system for theme presets and animation configuration
// ABOUTME: Persists user preferences to ~/.claude/plugins/blink/settings.json

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export interface AnimationSettings {
  speed: number;
  reducedMotion: boolean;
  cycling: boolean;
  wave: boolean;
  shimmer: boolean;
  breathing: boolean;
}

export interface ColorSettings {
  base: string[];
  accent1: string;
  accent2: string;
  accent3: string;
}

export interface Settings {
  theme: string;
  colors: ColorSettings;
  animation: AnimationSettings;
}

export const THEME_PRESETS: Record<string, Settings> = {
  'goth-whimsy': {
    theme: 'goth-whimsy',
    colors: {
      base: ['#5a189a', '#7b2cbf', '#c77dff'],
      accent1: '#00ffff',
      accent2: '#ff69b4',
      accent3: '#ffd700',
    },
    animation: {
      speed: 250,
      reducedMotion: false,
      cycling: true,
      wave: true,
      shimmer: true,
      breathing: true,
    },
  },
  minimal: {
    theme: 'minimal',
    colors: {
      base: ['#374151', '#6b7280', '#9ca3af'],
      accent1: '#3b82f6',
      accent2: '#3b82f6',
      accent3: '#3b82f6',
    },
    animation: {
      speed: 500,
      reducedMotion: false,
      cycling: true,
      wave: false,
      shimmer: false,
      breathing: true,
    },
  },
  cyberpunk: {
    theme: 'cyberpunk',
    colors: {
      base: ['#0f172a', '#312e81', '#06b6d4'],
      accent1: '#00ffff',
      accent2: '#ff00ff',
      accent3: '#ff00ff',
    },
    animation: {
      speed: 150,
      reducedMotion: false,
      cycling: true,
      wave: true,
      shimmer: true,
      breathing: true,
    },
  },
  ember: {
    theme: 'ember',
    colors: {
      base: ['#7c2d12', '#c2410c', '#fb923c'],
      accent1: '#fbbf24',
      accent2: '#f97316',
      accent3: '#fbbf24',
    },
    animation: {
      speed: 300,
      reducedMotion: false,
      cycling: true,
      wave: true,
      shimmer: false,
      breathing: true,
    },
  },
};

export const DEFAULT_SETTINGS: Settings = THEME_PRESETS['goth-whimsy'];

// Discrete animation speeds (ms) the Settings UI can produce.
export const SPEED_BUCKETS = [150, 250, 500];

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const MIN_SPEED = 50;
const MAX_SPEED = 2000;

// Snap an arbitrary speed to the nearest UI bucket so the displayed and stored
// values always agree (e.g. ember's 300ms shows and saves as balanced/250ms).
export function snapSpeedToBucket(speed: number): number {
  return SPEED_BUCKETS.reduce((nearest, bucket) =>
    Math.abs(bucket - speed) < Math.abs(nearest - speed) ? bucket : nearest
  );
}

// Replace only the theme identity (name + colors), preserving the user's
// animation settings so previewing themes never discards their toggles/speed.
export function applyThemeToSettings(current: Settings, preset: Settings): Settings {
  return {
    ...current,
    theme: preset.theme,
    colors: preset.colors,
  };
}

function coerceColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX_COLOR.test(value) ? value : fallback;
}

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function coerceSpeed(value: unknown, fallback: number): number {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= MIN_SPEED &&
    value <= MAX_SPEED
    ? value
    : fallback;
}

function coerceBaseColors(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value) || value.length !== fallback.length) {
    return fallback;
  }
  return fallback.map((defaultColor, i) => coerceColor(value[i], defaultColor));
}

function coerceColors(value: unknown, fallback: ColorSettings): ColorSettings {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Partial<ColorSettings>;
  return {
    base: coerceBaseColors(raw.base, fallback.base),
    accent1: coerceColor(raw.accent1, fallback.accent1),
    accent2: coerceColor(raw.accent2, fallback.accent2),
    accent3: coerceColor(raw.accent3, fallback.accent3),
  };
}

function coerceAnimation(value: unknown, fallback: AnimationSettings): AnimationSettings {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Partial<AnimationSettings>;
  return {
    speed: coerceSpeed(raw.speed, fallback.speed),
    reducedMotion: coerceBoolean(raw.reducedMotion, fallback.reducedMotion),
    cycling: coerceBoolean(raw.cycling, fallback.cycling),
    wave: coerceBoolean(raw.wave, fallback.wave),
    shimmer: coerceBoolean(raw.shimmer, fallback.shimmer),
    breathing: coerceBoolean(raw.breathing, fallback.breathing),
  };
}

function coerceTheme(value: unknown, fallback: string): string {
  return typeof value === 'string' && value in THEME_PRESETS ? value : fallback;
}

function getSettingsPath(): string {
  return path.join(os.homedir(), '.claude', 'plugins', 'blink', 'settings.json');
}

export function loadSettings(): Settings {
  const settingsPath = getSettingsPath();

  try {
    const content = fs.readFileSync(settingsPath, 'utf-8');
    const parsed = JSON.parse(content) as Partial<Settings>;
    return {
      theme: coerceTheme(parsed.theme, DEFAULT_SETTINGS.theme),
      colors: coerceColors(parsed.colors, DEFAULT_SETTINGS.colors),
      animation: coerceAnimation(parsed.animation, DEFAULT_SETTINGS.animation),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  const settingsPath = getSettingsPath();
  const settingsDir = path.dirname(settingsPath);

  fs.mkdirSync(settingsDir, { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
}

export function applyPreset(name: string): Settings {
  const preset = THEME_PRESETS[name];
  if (!preset) {
    return DEFAULT_SETTINGS;
  }
  return preset;
}
