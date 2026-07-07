// ABOUTME: Tests for the scrolling viewport window helper
// ABOUTME: Validates windowing around a selected index for various positions

import { describe, it, expect } from 'vitest';
import { computeVisibleWindow } from '../viewport.js';

describe('computeVisibleWindow', () => {
  it('returns the full range when fewer items than rows', () => {
    expect(computeVisibleWindow(3, 0, 10)).toEqual({
      startIndex: 0,
      endIndex: 3,
      moreAbove: 0,
      moreBelow: 0,
    });
  });

  it('returns the full range when items exactly fit', () => {
    expect(computeVisibleWindow(10, 4, 10)).toEqual({
      startIndex: 0,
      endIndex: 10,
      moreAbove: 0,
      moreBelow: 0,
    });
  });

  it('handles an empty list', () => {
    expect(computeVisibleWindow(0, 0, 10)).toEqual({
      startIndex: 0,
      endIndex: 0,
      moreAbove: 0,
      moreBelow: 0,
    });
  });

  it('returns an empty window when there are no viewport rows', () => {
    expect(computeVisibleWindow(50, 10, 0)).toEqual({
      startIndex: 0,
      endIndex: 0,
      moreAbove: 0,
      moreBelow: 0,
    });
  });

  it('anchors to the top when selection is near the top', () => {
    const w = computeVisibleWindow(100, 0, 20);
    expect(w.startIndex).toBe(0);
    expect(w.endIndex).toBe(20);
    expect(w.moreAbove).toBe(0);
    expect(w.moreBelow).toBe(80);
  });

  it('centers the selection when it is in the middle', () => {
    const w = computeVisibleWindow(100, 50, 20);
    expect(w.startIndex).toBe(40);
    expect(w.endIndex).toBe(60);
    expect(w.moreAbove).toBe(40);
    expect(w.moreBelow).toBe(40);
    // selection stays inside the window
    expect(50).toBeGreaterThanOrEqual(w.startIndex);
    expect(50).toBeLessThan(w.endIndex);
  });

  it('anchors to the bottom when selection is near the end', () => {
    const w = computeVisibleWindow(100, 99, 20);
    expect(w.startIndex).toBe(80);
    expect(w.endIndex).toBe(100);
    expect(w.moreAbove).toBe(80);
    expect(w.moreBelow).toBe(0);
    expect(99).toBeGreaterThanOrEqual(w.startIndex);
    expect(99).toBeLessThan(w.endIndex);
  });

  it('keeps the selection visible for every index across the list', () => {
    const total = 100;
    const rows = 20;
    for (let sel = 0; sel < total; sel++) {
      const w = computeVisibleWindow(total, sel, rows);
      expect(sel).toBeGreaterThanOrEqual(w.startIndex);
      expect(sel).toBeLessThan(w.endIndex);
      expect(w.endIndex - w.startIndex).toBe(rows);
    }
  });

  it('clamps an out-of-range selected index', () => {
    const w = computeVisibleWindow(100, 999, 20);
    expect(w.endIndex).toBe(100);
    expect(w.startIndex).toBe(80);
  });
});
