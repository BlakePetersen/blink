// ABOUTME: Tests for ASCII art header generation
// ABOUTME: Validates header content for each size variant

import { describe, it, expect } from 'vitest';
import { getHeaderArt, getHeaderLines, HEADER_HEIGHTS } from '../ascii-art.js';

describe('ascii-art', () => {
  describe('HEADER_HEIGHTS', () => {
    it('defines heights for each size', () => {
      expect(HEADER_HEIGHTS.full).toBe(3);
      expect(HEADER_HEIGHTS.medium).toBe(2);
      expect(HEADER_HEIGHTS.minimal).toBe(1);
    });
  });

  describe('getHeaderArt', () => {
    it('returns full header with box-drawing characters', () => {
      const art = getHeaderArt('full');
      expect(art).toContain('┏'); // box drawing
      expect(art).toContain('━'); // horizontal line
    });

    it('returns medium header with box-drawing characters', () => {
      const art = getHeaderArt('medium');
      expect(art).toContain('┣');
      expect(art).toContain('┗');
    });

    it('returns minimal single-line header', () => {
      const art = getHeaderArt('minimal');
      expect(art).toContain('BLINK');
      expect(art.split('\n').length).toBe(1);
    });
  });

  describe('getHeaderLines', () => {
    it('returns array of lines', () => {
      const lines = getHeaderLines('minimal');
      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBe(1);
    });

    it('returns correct number of lines for full header', () => {
      const lines = getHeaderLines('full');
      expect(lines.length).toBe(HEADER_HEIGHTS.full);
    });

    it('returns correct number of lines for medium header', () => {
      const lines = getHeaderLines('medium');
      expect(lines.length).toBe(HEADER_HEIGHTS.medium);
    });
  });
});
