// ABOUTME: Settings system for theme presets and animation configuration
// ABOUTME: Persists user preferences to ~/.claude/plugins/blink/settings.json

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export interface AnimationSettings {
  speed: number;
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
      cycling: true,
      wave: true,
      shimmer: false,
      breathing: true,
    },
  },
};

export const DEFAULT_SETTINGS: Settings = THEME_PRESETS['goth-whimsy'];

function getSettingsPath(): string {
  return path.join(os.homedir(), '.claude', 'plugins', 'blink', 'settings.json');
}

export function loadSettings(): Settings {
  const settingsPath = getSettingsPath();

  try {
    const content = fs.readFileSync(settingsPath, 'utf-8');
    const parsed = JSON.parse(content) as Partial<Settings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      colors: { ...DEFAULT_SETTINGS.colors, ...(parsed.colors || {}) },
      animation: { ...DEFAULT_SETTINGS.animation, ...(parsed.animation || {}) },
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
