// ABOUTME: Footer component showing available keyboard shortcuts
// ABOUTME: Contextual hints based on current state

import React from 'react';
import { Box, Text } from 'ink';
import { isDevMode } from '../lib/dev-mode.js';

interface Props {
  isSearching: boolean;
}

export function Keybindings({ isSearching }: Props) {
  if (isSearching) {
    return (
      <Box>
        <Text dimColor>
          enter confirm  esc cancel
        </Text>
      </Box>
    );
  }

  const devHint = isDevMode() ? '  r fixtures' : '';

  return (
    <Box>
      <Text dimColor>
        ↑↓ navigate  enter load  / search  t tags  d delete  q quit{devHint}
      </Text>
      <Text dimColor>  ˚  ·</Text>
    </Box>
  );
}
