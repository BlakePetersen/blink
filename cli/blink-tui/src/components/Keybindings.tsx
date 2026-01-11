// ABOUTME: Footer component showing available keyboard shortcuts
// ABOUTME: Contextual hints based on current state

import React from 'react';
import { Box, Text } from 'ink';

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
  
  return (
    <Box>
      <Text dimColor>
        ↑↓ navigate  enter load  / search  t tags  d delete  q quit
      </Text>
      <Text dimColor>  ˚  ·</Text>
    </Box>
  );
}
