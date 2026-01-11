// ABOUTME: Tests for responsive layout calculations
// ABOUTME: Validates breakpoints, pane widths, and layout modes

import { describe, it, expect } from 'vitest';
import { getLayoutMode, calculatePaneWidths, BREAKPOINTS } from '../layout.js';

describe('layout', () => {
  describe('BREAKPOINTS', () => {
    it('defines stacked threshold at 60', () => {
      expect(BREAKPOINTS.stacked).toBe(60);
    });

    it('defines full header threshold at 100', () => {
      expect(BREAKPOINTS.fullHeader).toBe(100);
    });
  });

  describe('getLayoutMode', () => {
    it('returns stacked below 60 columns', () => {
      expect(getLayoutMode(59)).toBe('stacked');
    });

    it('returns side-by-side at 60+ columns', () => {
      expect(getLayoutMode(60)).toBe('side-by-side');
      expect(getLayoutMode(120)).toBe('side-by-side');
    });
  });

  describe('calculatePaneWidths', () => {
    it('returns full width for stacked mode', () => {
      const result = calculatePaneWidths(50, 'stacked', 0.4);
      expect(result.list).toBe(50);
      expect(result.preview).toBe(50);
    });

    it('splits width for side-by-side mode', () => {
      const result = calculatePaneWidths(100, 'side-by-side', 0.4);
      expect(result.list).toBe(40);
      expect(result.preview).toBe(57); // 100 - 40 - 3 (divider)
    });

    it('respects custom split ratio', () => {
      const result = calculatePaneWidths(100, 'side-by-side', 0.5);
      expect(result.list).toBe(50);
      expect(result.preview).toBe(47);
    });

    it('enforces minimum pane width of 20', () => {
      const result = calculatePaneWidths(100, 'side-by-side', 0.1);
      expect(result.list).toBe(20);
    });
  });
});
