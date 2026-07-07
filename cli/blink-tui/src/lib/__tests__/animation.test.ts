// ABOUTME: Tests for animation utility functions
// ABOUTME: Validates color interpolation, cycle positions, breathing, and shimmer

import { describe, it, expect } from 'vitest';
import {
  calculateCyclePosition,
  calculateBreathPhase,
  shouldShimmer,
  calculateAnimationState,
  interpolateColor,
  brightenColor,
  adjustBrightness
} from '../animation.js';

describe('animation', () => {
  describe('calculateCyclePosition', () => {
    it('returns value between 0 and 1', () => {
      const position = calculateCyclePosition(1000, 4000);
      expect(position).toBeGreaterThanOrEqual(0);
      expect(position).toBeLessThanOrEqual(1);
    });

    it('cycles based on elapsed time and duration', () => {
      expect(calculateCyclePosition(0, 4000)).toBe(0);
      expect(calculateCyclePosition(2000, 4000)).toBe(0.5);
      expect(calculateCyclePosition(4000, 4000)).toBe(0);
    });
  });

  describe('calculateBreathPhase', () => {
    it('returns brightness multiplier between 0.7 and 1', () => {
      for (let t = 0; t < 4000; t += 100) {
        const phase = calculateBreathPhase(t, 4000);
        expect(phase).toBeGreaterThanOrEqual(0.7);
        expect(phase).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('interpolateColor', () => {
    it('returns first color at position 0', () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff'];
      expect(interpolateColor(colors, 0)).toBe('#ff0000');
    });

    it('returns last color at position 1', () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff'];
      expect(interpolateColor(colors, 1)).toBe('#0000ff');
    });

    it('blends colors at intermediate positions', () => {
      const colors = ['#000000', '#ffffff'];
      const result = interpolateColor(colors, 0.5);
      expect(result).toBe('#808080');
    });

    it('returns white for empty color array', () => {
      expect(interpolateColor([], 0.5)).toBe('#ffffff');
    });

    it('returns the color for single-element array', () => {
      expect(interpolateColor(['#ff0000'], 0.5)).toBe('#ff0000');
    });
  });

  describe('shouldShimmer', () => {
    it('returns boolean', () => {
      const result = shouldShimmer(0, 0, 0.5);
      expect(typeof result).toBe('boolean');
    });

    it('is deterministic for same inputs', () => {
      const result1 = shouldShimmer(5, 1000, 0.5);
      const result2 = shouldShimmer(5, 1000, 0.5);
      expect(result1).toBe(result2);
    });

    it('varies by character index', () => {
      // Different indices at same time may give different results
      const results = Array.from({ length: 20 }, (_, i) => shouldShimmer(i, 1000, 0.5));
      // With 50% probability, we should see both true and false
      expect(results.some(r => r === true)).toBe(true);
      expect(results.some(r => r === false)).toBe(true);
    });

    it('honors the speed setting for its time bucket', () => {
      // At elapsed 500ms: speed 250 -> bucket 2, speed 500 -> bucket 1.
      // For charIndex 0 with probability 0.02 the two buckets straddle the
      // threshold, so the speed must change the result.
      expect(shouldShimmer(0, 500, 0.02, 250)).toBe(false);
      expect(shouldShimmer(0, 500, 0.02, 500)).toBe(true);
    });

    it('produces the same result for the same effective bucket', () => {
      // 500ms at speed 250 and 1000ms at speed 500 both land in bucket 2.
      expect(shouldShimmer(0, 500, 0.5, 250)).toBe(shouldShimmer(0, 1000, 0.5, 500));
    });
  });

  describe('calculateAnimationState', () => {
    it('returns all animation state properties', () => {
      const state = calculateAnimationState(1000);
      expect(state).toHaveProperty('cyclePosition');
      expect(state).toHaveProperty('breathPhase');
      expect(state).toHaveProperty('elapsed');
    });

    it('includes elapsed time in state', () => {
      const state = calculateAnimationState(1234);
      expect(state.elapsed).toBe(1234);
    });
  });

  describe('brightenColor', () => {
    it('returns same color with amount 0', () => {
      expect(brightenColor('#808080', 0)).toBe('#808080');
    });

    it('returns white with amount 1', () => {
      expect(brightenColor('#000000', 1)).toBe('#ffffff');
    });

    it('brightens color proportionally', () => {
      // #000000 brightened by 0.5 should give #808080
      expect(brightenColor('#000000', 0.5)).toBe('#808080');
    });

    it('handles already bright colors', () => {
      // Should not exceed #ffffff
      const result = brightenColor('#ffffff', 0.5);
      expect(result).toBe('#ffffff');
    });
  });

  describe('adjustBrightness', () => {
    it('returns same color with multiplier 1', () => {
      expect(adjustBrightness('#808080', 1)).toBe('#808080');
    });

    it('returns black with multiplier 0', () => {
      expect(adjustBrightness('#ffffff', 0)).toBe('#000000');
    });

    it('darkens color with multiplier < 1', () => {
      const result = adjustBrightness('#ffffff', 0.5);
      expect(result).toBe('#808080');
    });

    it('clamps values to valid range', () => {
      // Should not exceed #ffffff even with multiplier > 1
      const result = adjustBrightness('#808080', 3);
      expect(result).toBe('#ffffff');
    });
  });
});
