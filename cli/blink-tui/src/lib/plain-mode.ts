// ABOUTME: Detects plain rendering mode and provides ASCII-only fallback markers
// ABOUTME: Honors NO_COLOR and TERM=dumb, mirroring the env pattern in motion.ts

export interface PlainEnv {
  NO_COLOR?: string;
  TERM?: string;
  [key: string]: string | undefined;
}

// An env flag counts as set when present and non-empty (NO_COLOR convention).
function isEnvFlagSet(value: string | undefined): boolean {
  return value !== undefined && value !== '';
}

// Plain mode strips decorative Unicode (ASCII art, emoji, CJK brackets) in favor
// of readable text — for screen readers and terminals with poor font coverage.
export function isPlainMode(env: PlainEnv = process.env): boolean {
  if (isEnvFlagSet(env.NO_COLOR)) return true;
  if (env.TERM === 'dumb') return true;
  return false;
}

// ASCII stand-ins for the decorative group icons used in the session list.
const PLAIN_GROUP_MARKERS: Record<string, string> = {
  '☽': '*', // saved
  '↻': '~', // restarts
  '⚠': '!', // unreadable files
};

export function plainGroupMarker(icon: string): string {
  return PLAIN_GROUP_MARKERS[icon] ?? '-';
}

// Wrap a tag in brackets — ASCII square brackets in plain mode, CJK otherwise.
export function formatTag(tag: string, plain: boolean): string {
  return plain ? `[${tag}]` : `「${tag}」`;
}

// ASCII marker prefixed to the preview title in plain mode (replaces `✦`).
export const PLAIN_TITLE_MARKER = '*';
