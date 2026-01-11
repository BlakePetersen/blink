// ABOUTME: Footer component showing available keyboard shortcuts
// ABOUTME: Contextual hints based on current state

import React from 'react';
import { Box, Text } from 'ink';
import { isDevMode } from '../lib/dev-mode.js';
import { mocha } from '../theme.js';

interface Props {
  isSearching: boolean;
}

// Key hint component for consistent styling
function KeyHint({ keys, action }: { keys: string; action: string }) {
  return (
    <Box marginRight={2}>
      <Text color={mocha.mauve}>{keys}</Text>
      <Text color={mocha.overlay0}> {action}</Text>
    </Box>
  );
}

// Container with consistent border styling
function KeybindingsContainer({ children }: { children: React.ReactNode }) {
  return (
    <Box
      borderStyle="round"
      borderColor={mocha.surface1}
      borderTop
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      paddingTop={0}
    >
      {children}
    </Box>
  );
}

export function Keybindings({ isSearching }: Props) {
  if (isSearching) {
    return (
      <KeybindingsContainer>
        <KeyHint keys="enter" action="confirm" />
        <KeyHint keys="esc" action="cancel" />
      </KeybindingsContainer>
    );
  }

  return (
    <KeybindingsContainer>
      <KeyHint keys="↑↓" action="navigate" />
      <KeyHint keys="⏎" action="load" />
      <KeyHint keys="/" action="search" />
      <KeyHint keys="t" action="tags" />
      <KeyHint keys="d" action="delete" />
      <KeyHint keys="q" action="quit" />
      {isDevMode() && <KeyHint keys="r" action="fixtures" />}
    </KeybindingsContainer>
  );
}
