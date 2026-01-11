// ABOUTME: Exports mock session fixture paths and utilities
// ABOUTME: Used for development mode and testing

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const FIXTURES_DIR = join(__dirname, 'sessions');

export const FIXTURE_FILES = [
  'minimal-restart.md',
  'full-featured-saved.md',
  'special-chars.md',
  'old-session.md',
  'long-content.md',
  'unicode-tags.md',
  'no-next-steps.md',
] as const;

export function getFixturePath(filename: string): string {
  return join(FIXTURES_DIR, filename);
}
