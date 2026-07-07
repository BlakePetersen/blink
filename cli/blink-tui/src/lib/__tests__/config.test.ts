// ABOUTME: Tests for configuration path helpers
// ABOUTME: Verifies project-local session paths resolve against a given cwd

import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { getProjectPaths, config } from '../config.js';

describe('getProjectPaths', () => {
  it('resolves saved and restart paths under the given cwd', () => {
    const cwd = '/home/dev/project';

    expect(getProjectPaths(cwd)).toEqual({
      saved: join(cwd, config.projectPaths.saved),
      restarts: join(cwd, config.projectPaths.restarts),
    });
  });

  it('produces distinct saved and restart directories', () => {
    const { saved, restarts } = getProjectPaths('/tmp/proj');
    expect(saved).not.toBe(restarts);
    expect(saved.endsWith('saved')).toBe(true);
    expect(restarts.endsWith('restarts')).toBe(true);
  });
});
