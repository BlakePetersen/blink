// ABOUTME: Tests for terminal size helpers backing the resize subscription
// ABOUTME: Validates size reads, resize callbacks, and listener cleanup

import { describe, it, expect, vi } from 'vitest';
import { getTerminalSize, subscribeToResize } from '../useTerminalSize.js';

// Minimal EventEmitter-like stub matching the stdout surface we use.
function createFakeStdout(columns?: number, rows?: number) {
  const listeners: Array<() => void> = [];
  return {
    columns,
    rows,
    listenerCount: () => listeners.length,
    emitResize: () => listeners.slice().forEach(fn => fn()),
    on(_event: 'resize', fn: () => void) {
      listeners.push(fn);
    },
    off(_event: 'resize', fn: () => void) {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    },
  };
}

describe('getTerminalSize', () => {
  it('reads columns and rows from stdout', () => {
    const stdout = createFakeStdout(120, 40);
    expect(getTerminalSize(stdout)).toEqual({ width: 120, height: 40 });
  });

  it('falls back to 80x24 when stdout is undefined', () => {
    expect(getTerminalSize(undefined)).toEqual({ width: 80, height: 24 });
  });

  it('falls back to 80x24 when columns/rows are missing', () => {
    const stdout = createFakeStdout(undefined, undefined);
    expect(getTerminalSize(stdout)).toEqual({ width: 80, height: 24 });
  });
});

describe('subscribeToResize', () => {
  it('invokes the callback when a resize event fires', () => {
    const stdout = createFakeStdout(80, 24);
    const onResize = vi.fn();

    subscribeToResize(stdout, onResize);
    expect(onResize).not.toHaveBeenCalled();

    stdout.columns = 100;
    stdout.rows = 30;
    stdout.emitResize();

    expect(onResize).toHaveBeenCalledTimes(1);
  });

  it('removes the listener when the cleanup function runs', () => {
    const stdout = createFakeStdout(80, 24);
    const onResize = vi.fn();

    const cleanup = subscribeToResize(stdout, onResize);
    expect(stdout.listenerCount()).toBe(1);

    cleanup();
    expect(stdout.listenerCount()).toBe(0);

    stdout.emitResize();
    expect(onResize).not.toHaveBeenCalled();
  });

  it('returns a no-op cleanup when stdout is undefined', () => {
    const cleanup = subscribeToResize(undefined, vi.fn());
    expect(() => cleanup()).not.toThrow();
  });
});
