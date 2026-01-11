// ABOUTME: ASCII art header variants for different screen sizes
// ABOUTME: Warez NFO-style with flames and all-seeing eye

export const HEADER_HEIGHTS = {
  full: 10,
  medium: 4,
  minimal: 1,
} as const;

export type HeaderSize = keyof typeof HEADER_HEIGHTS;

const HEADER_FULL = `░░    ░░    ░░    ░░                     ◢▀▀▀▀▀▀▀◠●◠▀▀▀▀▀▀▀◣                     ░░    ░░    ░░    ░░
░▒▒░  ░▒▒░  ░▒▒░  ░▒▒░                   ◥▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄◤                   ░▒▒░  ░▒▒░  ░▒▒░  ░▒▒░
 ░▒▓▒░ ░▒▓▒░ ░▒▓▒░ ░▒▓▒░                                                    ░▒▓▒░ ░▒▓▒░ ░▒▓▒░ ░▒▓▒░
  ░▒▓▓▒░▒▓▓▒░▒▓▓▒░▒▓▓▒░     ██████╗ ██╗     ██╗███╗   ██╗██╗  ██╗     ░▒▓▓▒░▒▓▓▒░▒▓▓▒░▒▓▓▒░
                            ██╔══██╗██║     ██║████╗  ██║██║ ██╔╝
                            ██████╔╝██║     ██║██╔██╗ ██║█████╔╝
                            ██╔══██╗██║     ██║██║╚██╗██║██╔═██╗
                            ██████╔╝███████╗██║██║ ╚████║██║  ██╗
                            ╚═════╝ ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
                                        BLINK                     `;

const HEADER_MEDIUM = `░░  ░░  ░░                                                            ░░  ░░  ░░
░▒▓▒░▒▓▒░   ██████╗ ██╗    ██╗███╗  ██╗██╗  ██╗   ░▒▓▒░▒▓▒░
            ██████╔╝██║    ██║██╔██╗██║█████╔╝
            ██████╔╝██████╗██║██║╚████║██║╚██╗  BLINK`;

const HEADER_MINIMAL = `░▒▓░░▒▓░  ▄▀ BLINK ▀▄  ░▓▒░░▓▒░`;

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
