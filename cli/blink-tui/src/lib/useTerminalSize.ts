// ABOUTME: Tracks terminal dimensions and reflows layout on stdout resize
// ABOUTME: Keeps the UI responsive independent of animation re-renders

import { useState, useEffect } from 'react';

export interface TerminalSize {
  width: number;
  height: number;
}

// The subset of NodeJS.WriteStream we rely on for sizing and resize events.
interface ResizableStream {
  columns?: number;
  rows?: number;
  on(event: 'resize', listener: () => void): void;
  off(event: 'resize', listener: () => void): void;
}

export function getTerminalSize(stdout?: ResizableStream): TerminalSize {
  return {
    width: stdout?.columns || 80,
    height: stdout?.rows || 24,
  };
}

export function subscribeToResize(
  stdout: ResizableStream | undefined,
  onResize: () => void
): () => void {
  if (!stdout) return () => {};
  stdout.on('resize', onResize);
  return () => stdout.off('resize', onResize);
}

export function useTerminalSize(stdout?: ResizableStream): TerminalSize {
  const [size, setSize] = useState<TerminalSize>(() => getTerminalSize(stdout));

  useEffect(() => {
    const update = () => setSize(getTerminalSize(stdout));
    // Sync once in case the terminal resized before this effect ran.
    update();
    return subscribeToResize(stdout, update);
  }, [stdout]);

  return size;
}
