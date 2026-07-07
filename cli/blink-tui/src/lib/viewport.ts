// ABOUTME: Pure windowing helper for scrolling a flat list around a selection
// ABOUTME: Keeps the selected index visible and reports off-screen counts

export interface VisibleWindow {
  startIndex: number;
  endIndex: number; // exclusive
  moreAbove: number;
  moreBelow: number;
}

/**
 * Compute the slice of a flat list that should be visible so the selected
 * index stays on screen, along with the counts of items scrolled off each edge.
 */
export function computeVisibleWindow(
  total: number,
  selectedIndex: number,
  viewportRows: number
): VisibleWindow {
  if (total <= 0 || viewportRows <= 0) {
    return { startIndex: 0, endIndex: 0, moreAbove: 0, moreBelow: 0 };
  }

  if (total <= viewportRows) {
    return { startIndex: 0, endIndex: total, moreAbove: 0, moreBelow: 0 };
  }

  const clampedSelection = Math.max(0, Math.min(selectedIndex, total - 1));

  // Center the selection, then clamp so the window stays within bounds.
  let start = clampedSelection - Math.floor(viewportRows / 2);
  start = Math.max(0, Math.min(start, total - viewportRows));
  const end = start + viewportRows;

  return {
    startIndex: start,
    endIndex: end,
    moreAbove: start,
    moreBelow: total - end,
  };
}
