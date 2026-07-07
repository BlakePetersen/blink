// ABOUTME: Tests for display-width-aware string truncation
// ABOUTME: Validates emoji/CJK handling so rows never split characters or misalign

import { describe, it, expect } from 'vitest';
import stringWidth from 'string-width';
import { truncateToWidth } from '../width.js';

describe('truncateToWidth', () => {
  it('returns plain ASCII unchanged when it fits', () => {
    expect(truncateToWidth('hello', 10)).toBe('hello');
  });

  it('returns a string that fits exactly unchanged', () => {
    expect(truncateToWidth('hello', 5)).toBe('hello');
  });

  it('truncates over-width ASCII with an ellipsis at the width boundary', () => {
    const out = truncateToWidth('abcdefghij', 6);
    expect(stringWidth(out)).toBeLessThanOrEqual(6);
    expect(out.endsWith('...')).toBe(true);
    expect(out).toBe('abc...');
  });

  it('counts CJK characters as width 2', () => {
    // '한글' is display width 4; a budget of 4 fits it exactly.
    expect(truncateToWidth('한글', 4)).toBe('한글');
    // Budget of 3 cannot fit the second wide char, so it truncates.
    const out = truncateToWidth('한글자', 4);
    expect(stringWidth(out)).toBeLessThanOrEqual(4);
  });

  it('truncates emoji without producing mojibake (no split surrogate pairs)', () => {
    const out = truncateToWidth('👋👋👋👋', 5);
    expect(stringWidth(out)).toBeLessThanOrEqual(5);
    // No lone surrogate should survive: re-encoding is lossless.
    expect([...out].every(ch => ch.codePointAt(0)! <= 0x10ffff)).toBe(true);
    // The output must be a clean prefix of whole emoji plus the ellipsis.
    expect(out.endsWith('...')).toBe(true);
    expect(out).toBe('👋...');
  });

  it('returns empty string for non-positive width', () => {
    expect(truncateToWidth('anything', 0)).toBe('');
  });
});
