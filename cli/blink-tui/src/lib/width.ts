// ABOUTME: Display-width-aware string truncation for terminal rendering
// ABOUTME: Uses string-width so emoji/CJK are measured and never split mid-character

import stringWidth from 'string-width';

const ELLIPSIS = '...';

// Truncate `str` so its terminal display width never exceeds `maxWidth`.
// Iterates by Unicode code point (via the string iterator) so surrogate pairs
// stay intact — no mojibake — and counts each code point's real display width,
// so double-width CJK/emoji occupy 2 columns just like the terminal renders them.
export function truncateToWidth(str: string, maxWidth: number): string {
  if (maxWidth <= 0) return '';
  if (stringWidth(str) <= maxWidth) return str;

  // Reserve room for the ellipsis when there is space for it.
  const useEllipsis = maxWidth > stringWidth(ELLIPSIS);
  const budget = useEllipsis ? maxWidth - ELLIPSIS.length : maxWidth;

  let result = '';
  let width = 0;
  for (const char of str) {
    const charWidth = stringWidth(char);
    if (width + charWidth > budget) break;
    result += char;
    width += charWidth;
  }

  return useEllipsis ? result + ELLIPSIS : result;
}
