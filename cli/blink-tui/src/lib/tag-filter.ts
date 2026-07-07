// ABOUTME: Pure helper for cycling the active tag filter
// ABOUTME: Forward/backward single-tag cycling with a "none" step (issue #52)

export type CycleDirection = 'forward' | 'backward';

// Cycle the single-tag selection through `allTags` plus a trailing "none" slot.
// Forward: none → tag[0] → … → tag[n-1] → none. Backward reverses that order.
// A stale selection (a tag no longer present) is treated as "none".
export function cycleTag(
  allTags: string[],
  current: string[],
  direction: CycleDirection
): string[] {
  if (allTags.length === 0) return [];

  const noneIndex = allTags.length;
  const positions = allTags.length + 1;

  const currentIndex = current.length === 0 ? noneIndex : allTags.indexOf(current[0]);
  const from = currentIndex === -1 ? noneIndex : currentIndex;

  const step = direction === 'forward' ? 1 : -1;
  const next = (from + step + positions) % positions;

  return next === noneIndex ? [] : [allTags[next]];
}
