// ABOUTME: Visual divider between session list and preview panes
// ABOUTME: Displays drag state visually (actual drag handling is in parent)

import React from 'react';
import { Box, Text } from 'ink';
import { BACKGROUNDS } from '../lib/backgrounds.js';

interface Props {
  height: number;
  isDragging: boolean;
  splitPercent?: number;
}

export function Divider({ height, isDragging, splitPercent }: Props) {
  const lines = Array(height).fill(null);

  return (
    <Box flexDirection="column" width={3}>
      {lines.map((_, i) => (
        <Text
          key={i}
          color={isDragging ? 'cyan' : 'gray'}
          backgroundColor={BACKGROUNDS.divider}
        >
          {isDragging && i === Math.floor(height / 2) && splitPercent !== undefined
            ? `${String(splitPercent).padStart(2, ' ')}%`.slice(-3)
            : isDragging
            ? ' ┃ '
            : ' │ '}
        </Text>
      ))}
    </Box>
  );
}
