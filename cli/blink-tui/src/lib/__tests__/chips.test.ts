// ABOUTME: Tests for tag-chip helpers (glyph label, width-aware truncation)
// ABOUTME: Covers issues #48 (chip truncation) and #54 (color-independent active glyph)

import { describe, it, expect } from 'vitest';
import { chipLabel, fitChips } from '../chips.js';

describe('chips', () => {
  describe('chipLabel', () => {
    it('renders an inactive chip as [tag]', () => {
      expect(chipLabel('bug', false)).toBe('[bug]');
    });

    it('renders an active chip with a check glyph independent of color', () => {
      expect(chipLabel('bug', true)).toBe('[bug ✓]');
    });
  });

  describe('fitChips', () => {
    it('returns nothing for an empty list', () => {
      expect(fitChips([], 100)).toEqual({ visible: [], overflow: 0 });
    });

    it('shows all chips when they fit exactly', () => {
      expect(fitChips(['[a]', '[b]'], 7)).toEqual({ visible: ['[a]', '[b]'], overflow: 0 });
    });

    it('shows all chips when there is ample room', () => {
      expect(fitChips(['[a]', '[b]'], 100)).toEqual({ visible: ['[a]', '[b]'], overflow: 0 });
    });

    it('truncates chips that overflow and reports the overflow count', () => {
      expect(fitChips(['[aa]', '[bb]', '[cc]'], 10)).toEqual({ visible: ['[aa]'], overflow: 2 });
    });

    it('drops all chips when even one cannot fit', () => {
      expect(fitChips(['[toolong]'], 3)).toEqual({ visible: [], overflow: 1 });
    });

    it('treats a non-positive width as no room', () => {
      expect(fitChips(['[a]', '[b]'], 0)).toEqual({ visible: [], overflow: 2 });
    });
  });
});
