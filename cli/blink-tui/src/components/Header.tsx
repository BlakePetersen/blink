// ABOUTME: Header component with Blink logo
// ABOUTME: Phase 4 will add animated gradients

import React from 'react';
import { Box, Text } from 'ink';

export function Header() {
  // Simple ASCII logo for now - Phase 4 adds animated gradients
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="magenta">
        ░░░ ▒▒▒ ▓▓▓ ███ BLINK ███ ▓▓▓ ▒▒▒ ░░░
      </Text>
    </Box>
  );
}
