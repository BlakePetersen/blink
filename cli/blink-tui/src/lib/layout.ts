// ABOUTME: Responsive layout calculations for TUI
// ABOUTME: Handles breakpoints and pane width distribution

export const BREAKPOINTS = {
  stacked: 60,
  fullHeader: 100,
} as const;

export type LayoutMode = 'stacked' | 'side-by-side';

export function getLayoutMode(width: number): LayoutMode {
  return width < BREAKPOINTS.stacked ? 'stacked' : 'side-by-side';
}

export function getHeaderSize(width: number): 'full' | 'medium' | 'minimal' {
  if (width >= BREAKPOINTS.fullHeader) return 'full';
  if (width >= BREAKPOINTS.stacked) return 'medium';
  return 'minimal';
}

export interface PaneWidths {
  list: number;
  preview: number;
  divider: number;
}

const MIN_PANE_WIDTH = 20;
const DIVIDER_WIDTH = 3;

export function calculatePaneWidths(
  totalWidth: number,
  mode: LayoutMode,
  splitRatio: number
): PaneWidths {
  if (mode === 'stacked') {
    return { list: totalWidth, preview: totalWidth, divider: 0 };
  }

  let listWidth = Math.floor(totalWidth * splitRatio);
  listWidth = Math.max(MIN_PANE_WIDTH, listWidth);
  listWidth = Math.min(totalWidth - MIN_PANE_WIDTH - DIVIDER_WIDTH, listWidth);

  const previewWidth = totalWidth - listWidth - DIVIDER_WIDTH;

  return {
    list: listWidth,
    preview: previewWidth,
    divider: DIVIDER_WIDTH,
  };
}
