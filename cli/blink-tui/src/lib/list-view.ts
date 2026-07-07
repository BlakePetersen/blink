// ABOUTME: Pure helpers for the flat session list view
// ABOUTME: Index clamping, empty-state messaging, and the position indicator

// Clamp a selection index into the valid range for a list of `total` items.
// An empty list always resolves to 0.
export function clampIndex(total: number, index: number): number {
  if (total <= 0) return 0;
  if (index < 0) return 0;
  return Math.min(index, total - 1);
}

// Distinguish a genuinely empty project from one whose filter hides everything.
export function emptyStateMessage(hasAnySessions: boolean, query: string): string {
  if (!hasAnySessions) return 'No sessions yet';
  if (query) return `No sessions match '${query}' — esc to clear`;
  return 'No sessions match the active filter — esc to clear';
}

// Render the "current/total" indicator, showing 0/0 when the list is empty.
export function positionLabel(currentIndex: number, total: number): string {
  if (total <= 0) return '0/0';
  return `${currentIndex + 1}/${total}`;
}

// Label the items hidden when a list of `total` is capped at `cap`, or null
// when nothing is hidden. Drives the Preview "+N more" indicators (issue #69).
export function moreLabel(total: number, cap: number): string | null {
  const hidden = total - cap;
  if (hidden <= 0) return null;
  return `+${hidden} more`;
}
