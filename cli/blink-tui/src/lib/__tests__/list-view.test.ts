// ABOUTME: Tests for list-view helpers (index clamping, empty-state text, position label)
// ABOUTME: Covers filter-shrink edge cases from issue #45

import { describe, it, expect } from 'vitest';
import { clampIndex, emptyStateMessage, positionLabel, moreLabel } from '../list-view.js';

describe('list-view', () => {
  describe('clampIndex', () => {
    it('returns 0 when the list is empty', () => {
      expect(clampIndex(0, 5)).toBe(0);
      expect(clampIndex(0, 0)).toBe(0);
    });

    it('clamps an over-max index to the last item', () => {
      expect(clampIndex(3, 5)).toBe(2);
      expect(clampIndex(3, 8)).toBe(2);
    });

    it('clamps a negative index to 0', () => {
      expect(clampIndex(3, -1)).toBe(0);
    });

    it('leaves an in-range index unchanged', () => {
      expect(clampIndex(3, 1)).toBe(1);
    });

    it('allows the exact last index', () => {
      expect(clampIndex(3, 2)).toBe(2);
    });
  });

  describe('emptyStateMessage', () => {
    it('reports no sessions at all when there are none', () => {
      expect(emptyStateMessage(false, '')).toBe('No sessions yet');
      expect(emptyStateMessage(false, 'foo')).toBe('No sessions yet');
    });

    it('reports a query mismatch when sessions exist but none match', () => {
      expect(emptyStateMessage(true, 'foo')).toBe("No sessions match 'foo' — esc to clear");
    });

    it('reports a generic filter mismatch when the query is empty', () => {
      expect(emptyStateMessage(true, '')).toBe('No sessions match the active filter — esc to clear');
    });
  });

  describe('positionLabel', () => {
    it('shows 0/0 when the list is empty', () => {
      expect(positionLabel(0, 0)).toBe('0/0');
      expect(positionLabel(5, 0)).toBe('0/0');
    });

    it('shows a 1-based position within the count', () => {
      expect(positionLabel(0, 3)).toBe('1/3');
      expect(positionLabel(2, 3)).toBe('3/3');
    });
  });

  describe('moreLabel', () => {
    it('returns null when nothing is hidden', () => {
      expect(moreLabel(3, 5)).toBeNull();
      expect(moreLabel(5, 5)).toBeNull();
    });

    it('reports the count hidden beyond the cap', () => {
      expect(moreLabel(7, 5)).toBe('+2 more');
      expect(moreLabel(6, 5)).toBe('+1 more');
    });
  });
});
