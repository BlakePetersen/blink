// ABOUTME: Configuration and path utilities for Blink TUI
// ABOUTME: Defines session directory paths and defaults

import { homedir } from 'os';
import { join } from 'path';

export const config = {
  // Project-local paths (relative to cwd)
  projectPaths: {
    saved: '.claude/sessions/saved',
    restarts: '.claude/sessions/restarts',
  },
  
  // Global paths
  globalPaths: {
    saved: join(homedir(), '.claude/sessions/saved'),
    restarts: join(homedir(), '.claude/sessions/restarts'),
  },
  
  // UI settings
  ui: {
    maxSessionsPerGroup: 50,
    previewWidth: 40, // percentage
  },
};

export function getProjectPaths(cwd: string) {
  return {
    saved: join(cwd, config.projectPaths.saved),
    restarts: join(cwd, config.projectPaths.restarts),
  };
}
