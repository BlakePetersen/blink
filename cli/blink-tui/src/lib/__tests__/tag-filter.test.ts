// ABOUTME: Tests for tag-filter cycling helper
// ABOUTME: Covers forward/backward single-tag cycling with a none step (issue #52)

import { describe, it, expect } from 'vitest';
import { cycleTag } from '../tag-filter.js';

describe('cycleTag', () => {
  const tags = ['alpha', 'beta', 'gamma'];

  it('returns an empty selection when there are no tags', () => {
    expect(cycleTag([], [], 'forward')).toEqual([]);
    expect(cycleTag([], ['alpha'], 'backward')).toEqual([]);
  });

  describe('forward', () => {
    it('selects the first tag from an empty selection', () => {
      expect(cycleTag(tags, [], 'forward')).toEqual(['alpha']);
    });

    it('advances to the next tag', () => {
      expect(cycleTag(tags, ['alpha'], 'forward')).toEqual(['beta']);
      expect(cycleTag(tags, ['beta'], 'forward')).toEqual(['gamma']);
    });

    it('wraps past the last tag back to none', () => {
      expect(cycleTag(tags, ['gamma'], 'forward')).toEqual([]);
    });
  });

  describe('backward', () => {
    it('selects the last tag from an empty selection', () => {
      expect(cycleTag(tags, [], 'backward')).toEqual(['gamma']);
    });

    it('steps to the previous tag', () => {
      expect(cycleTag(tags, ['gamma'], 'backward')).toEqual(['beta']);
      expect(cycleTag(tags, ['beta'], 'backward')).toEqual(['alpha']);
    });

    it('wraps before the first tag back to none', () => {
      expect(cycleTag(tags, ['alpha'], 'backward')).toEqual([]);
    });
  });

  it('treats a stale selection (tag no longer present) as none', () => {
    expect(cycleTag(tags, ['deleted'], 'forward')).toEqual(['alpha']);
    expect(cycleTag(tags, ['deleted'], 'backward')).toEqual(['gamma']);
  });
});
