// ABOUTME: Terminal-aware background fills for UI regions
// ABOUTME: Detects light vs dark terminals via COLORFGBG so bars stay legible on both

export interface BackgroundPalette {
  sessionList: string;
  preview: string;
  filterBar: string;
  divider: string;
}

// Dark terminals: subtle near-black fills that read as depth against a dark bg.
const DARK: BackgroundPalette = {
  sessionList: '#1a1a1a',
  preview: '#2a2a2a',
  filterBar: '#3a3a3a',
  divider: '#333333',
};

// Light terminals: light-gray fills so default (dark) foreground text stays legible.
const LIGHT: BackgroundPalette = {
  sessionList: '#e8e8e8',
  preview: '#dcdcdc',
  filterBar: '#cfcfcf',
  divider: '#c8c8c8',
};

interface BackgroundEnv {
  COLORFGBG?: string;
  [key: string]: string | undefined;
}

// COLORFGBG is exported by many terminals as "fg;bg" (occasionally
// "fg;default;bg"). The trailing field is the background ANSI color index:
// 0-6 and 8 are dark, 7 and 9-15 are light. When it is unset or unparseable we
// assume a dark terminal, matching the historic default.
export function isLightTerminal(env: BackgroundEnv = process.env): boolean {
  const raw = env.COLORFGBG;
  if (!raw) return false;
  const parts = raw.split(';');
  const bg = Number(parts[parts.length - 1]);
  if (!Number.isInteger(bg)) return false;
  return bg === 7 || bg >= 9;
}

export function getBackgrounds(env: BackgroundEnv = process.env): BackgroundPalette {
  return isLightTerminal(env) ? LIGHT : DARK;
}
