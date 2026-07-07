// ABOUTME: Tests for plain-mode detection and ASCII-only marker helpers
// ABOUTME: Validates NO_COLOR / TERM=dumb triggers and screen-reader-friendly fallbacks

import { describe, it, expect } from 'vitest';
import {
  isPlainMode,
  plainGroupMarker,
  formatTag,
  PLAIN_TITLE_MARKER,
} from '../plain-mode.js';

const ASCII_ONLY = /^[\x00-\x7f]*$/;

describe('isPlainMode', () => {
  it('is plain when NO_COLOR is present and non-empty', () => {
    expect(isPlainMode({ NO_COLOR: '1' })).toBe(true);
  });

  it('treats an empty NO_COLOR as not set', () => {
    expect(isPlainMode({ NO_COLOR: '' })).toBe(false);
  });

  it('is plain when TERM is dumb', () => {
    expect(isPlainMode({ TERM: 'dumb' })).toBe(true);
  });

  it('is not plain for a normal terminal with neither set', () => {
    expect(isPlainMode({ TERM: 'xterm-256color' })).toBe(false);
    expect(isPlainMode({})).toBe(false);
  });
});

describe('plainGroupMarker', () => {
  it('maps known non-ASCII group icons to ASCII markers', () => {
    expect(plainGroupMarker('☽')).toMatch(ASCII_ONLY);
    expect(plainGroupMarker('↻')).toMatch(ASCII_ONLY);
    expect(plainGroupMarker('⚠')).toMatch(ASCII_ONLY);
  });

  it('falls back to an ASCII marker for unknown icons', () => {
    expect(plainGroupMarker('🧪')).toMatch(ASCII_ONLY);
    expect(plainGroupMarker('')).toMatch(ASCII_ONLY);
  });
});

describe('formatTag', () => {
  it('uses ASCII square brackets in plain mode', () => {
    const out = formatTag('i18n', true);
    expect(out).toBe('[i18n]');
    expect(out).toMatch(ASCII_ONLY);
  });

  it('uses CJK brackets when not plain', () => {
    expect(formatTag('i18n', false)).toBe('「i18n」');
  });
});

describe('PLAIN_TITLE_MARKER', () => {
  it('is a readable ASCII marker', () => {
    expect(PLAIN_TITLE_MARKER).toMatch(ASCII_ONLY);
    expect(PLAIN_TITLE_MARKER.length).toBeGreaterThan(0);
  });
});
