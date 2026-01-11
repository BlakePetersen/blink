// ABOUTME: Background color definitions for UI regions
// ABOUTME: Creates visual depth hierarchy between panes

export const BACKGROUNDS = {
  sessionList: '#1a1a1a',
  preview: '#2a2a2a',
  filterBar: '#3a3a3a',
  divider: '#333333',
} as const;

export type BackgroundRegion = keyof typeof BACKGROUNDS;

export function getBackground(region: BackgroundRegion): string {
  return BACKGROUNDS[region];
}
