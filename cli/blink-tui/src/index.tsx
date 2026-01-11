#!/usr/bin/env node
// ABOUTME: Entry point for Blink TUI session browser
// ABOUTME: Renders the Ink app and handles CLI arguments

import React from 'react';
import { render } from 'ink';
import { App } from './app.js';
import { Session } from './lib/types.js';

// Get current working directory from args or use process.cwd()
const cwd = process.argv[2] || process.cwd();

// Handle session selection - output path to stdout for calling process
function handleSelect(session: Session) {
  // Output the selected session path so calling script can use it
  console.log(`BLINK_SELECTED:${session.path}`);
}

// Render the app
const { waitUntilExit } = render(
  <App cwd={cwd} onSelect={handleSelect} />
);

waitUntilExit();
