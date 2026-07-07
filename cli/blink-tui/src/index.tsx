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

// The UI renders to stderr, so drive the alternate screen buffer there too.
// Entering it keeps the full-height TUI off the user's scrollback and restores
// their prior terminal contents on exit.
const ui = process.stderr;
let altScreenActive = false;

function enterAltScreen() {
  if (altScreenActive) return;
  ui.write('\x1b[?1049h');
  altScreenActive = true;
}

function leaveAltScreen() {
  if (!altScreenActive) return;
  ui.write('\x1b[?1049l');
  altScreenActive = false;
}

enterAltScreen();
// Guarantee the primary buffer is restored even on an abrupt exit.
process.on('exit', leaveAltScreen);

// Render the interactive UI to stderr so stdout stays clean for the selection.
const { waitUntilExit } = render(
  <App cwd={cwd} onSelect={handleSelect} />,
  { stdout: ui as unknown as NodeJS.WriteStream }
);

waitUntilExit().finally(leaveAltScreen);
