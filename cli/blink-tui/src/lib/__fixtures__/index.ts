// ABOUTME: Exports mock session fixture paths and utilities
// ABOUTME: Used for development mode and testing

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const FIXTURES_DIR = join(__dirname, 'sessions');
