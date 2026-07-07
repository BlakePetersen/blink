// ABOUTME: Resolves whether reduced-motion mode is active for the TUI
// ABOUTME: Honors NO_COLOR and BLINK_REDUCED_MOTION env vars plus the master toggle

import { Settings } from './settings.js';

export interface MotionEnv {
  NO_COLOR?: string;
  BLINK_REDUCED_MOTION?: string;
  [key: string]: string | undefined;
}

// An env flag counts as set when present and non-empty (NO_COLOR convention).
function isEnvFlagSet(value: string | undefined): boolean {
  return value !== undefined && value !== '';
}

export function isReducedMotion(
  settings: Settings,
  env: MotionEnv = process.env
): boolean {
  if (isEnvFlagSet(env.NO_COLOR)) return true;
  if (isEnvFlagSet(env.BLINK_REDUCED_MOTION)) return true;
  return settings.animation.reducedMotion === true;
}
