// ABOUTME: Tests for animation utility functions
// ABOUTME: Validates color interpolation, cycle positions, wave effects, and shimmer

import { describe, it, expect } from 'vitest';
import {
  calculateCyclePosition,
  calculateWavePosition,
  calculateBreathPhase,
  shouldShimmer,
  calculateAnimationState,
  interpolateColor
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

  describe('calculateWavePosition', () => {
    it('returns value between 0 and 1', () => {
      const position = calculateWavePosition(500, 2000);
      expect(position).toBeGreaterThanOrEqual(0);
      expect(position).toBeLessThanOrEqual(1);
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
  });

  describe('calculateAnimationState', () => {
    it('returns all animation state properties', () => {
      const state = calculateAnimationState(1000);
      expect(state).toHaveProperty('cyclePosition');
      expect(state).toHaveProperty('wavePosition');
      expect(state).toHaveProperty('breathPhase');
      expect(state).toHaveProperty('elapsed');
    });

    it('includes elapsed time in state', () => {
      const state = calculateAnimationState(1234);
      expect(state.elapsed).toBe(1234);
    });
  });
});
