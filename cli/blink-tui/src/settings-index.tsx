#!/usr/bin/env node
// ABOUTME: CLI entry point for Blink settings interface
// ABOUTME: Renders the SettingsApp to configure themes and animations

import React from 'react';
import { render } from 'ink';
import { SettingsApp } from './settings-app.js';

const { waitUntilExit } = render(<SettingsApp />);

waitUntilExit();
