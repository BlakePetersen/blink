// ABOUTME: ASCII art header variants for different screen sizes
// ABOUTME: Brutalist style - bold, stark, Berlin nightclub aesthetic

export const HEADER_HEIGHTS = {
  full: 6,
  medium: 3,
  minimal: 1,
} as const;

export type HeaderSize = keyof typeof HEADER_HEIGHTS;

// Brutalist block letters - heavy, industrial
const HEADER_FULL = `
██████╗ ██╗     ██╗███╗   ██╗██╗  ██╗
██╔══██╗██║     ██║████╗  ██║██║ ██╔╝
██████╔╝██║     ██║██╔██╗ ██║█████╔╝
██╔══██╗██║     ██║██║╚██╗██║██╔═██╗
██████╔╝███████╗██║██║ ╚████║██║  ██╗
╚═════╝ ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝`.trim();

// Condensed for medium width
const HEADER_MEDIUM = `
█▀▀▄ █   █ █▄ █ █ █
█▀▀▄ █   █ █ ▀█ █▀▄
▀▀▀  ▀▀▀ ▀ ▀  ▀ ▀ ▀`.trim();

// Single line - just the word
const HEADER_MINIMAL = `▌BLINK▐`;

export function getHeaderArt(size: HeaderSize): string {
  switch (size) {
    case 'full':
      return HEADER_FULL;
    case 'medium':
      return HEADER_MEDIUM;
    case 'minimal':
      return HEADER_MINIMAL;
  }
}

export function getHeaderLines(size: HeaderSize): string[] {
  return getHeaderArt(size).split('\n');
}
