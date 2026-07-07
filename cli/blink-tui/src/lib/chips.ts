// ABOUTME: Pure helpers for rendering tag-filter chips
// ABOUTME: Color-independent active glyph and width-aware truncation

// Label a tag chip. Active chips carry a check glyph so the state survives
// under NO_COLOR / monochrome terminals where color cues are stripped.
export function chipLabel(tag: string, isActive: boolean): string {
  return isActive ? `[${tag} ✓]` : `[${tag}]`;
}

export interface FittedChips {
  visible: string[];
  overflow: number;
}

// Fit as many chip labels as possible into `maxWidth` columns (single-space
// separators), reserving room for a trailing "+N" overflow marker.
export function fitChips(labels: string[], maxWidth: number): FittedChips {
  if (maxWidth <= 0 || labels.length === 0) {
    return { visible: [], overflow: labels.length };
  }

  const visible: string[] = [];
  let used = 0;
  for (const label of labels) {
    const sep = visible.length > 0 ? 1 : 0;
    if (used + sep + label.length <= maxWidth) {
      visible.push(label);
      used += sep + label.length;
    } else {
      break;
    }
  }

  let overflow = labels.length - visible.length;

  // Drop trailing chips until the "+N" marker also fits.
  while (overflow > 0 && visible.length > 0) {
    const marker = `+${overflow}`;
    if (used + 1 + marker.length <= maxWidth) break;
    const dropped = visible.pop() as string;
    used -= dropped.length + (visible.length > 0 ? 1 : 0);
    overflow += 1;
  }

  return { visible, overflow };
}
