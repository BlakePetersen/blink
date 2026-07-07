#!/usr/bin/env node
// ABOUTME: Entry point for Blink TUI session browser
// ABOUTME: Renders the Ink app and handles CLI arguments

import React from 'react';
import { render } from 'ink';
import { App } from './app.js';
import { Session } from './lib/types.js';

// Get current working directory from args or use process.cwd()
const cwd = process.argv[2] || process.cwd();

// Handle session selection - emit the protocol line on stdout for the calling
// script (scripts/browse-sessions.sh). The interactive UI renders to stderr so
// stdout carries only this machine-readable selection.
function handleSelect(session: Session) {
  process.stdout.write(`BLINK_SELECTED:${session.path}\n`);
}

// Render the interactive UI to stderr so stdout stays clean for the selection.
const { waitUntilExit } = render(
  <App cwd={cwd} onSelect={handleSelect} />,
  { stdout: process.stderr as unknown as NodeJS.WriteStream }
);

waitUntilExit();
