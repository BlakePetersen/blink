// ABOUTME: Draggable divider between session list and preview
// ABOUTME: Supports mouse drag to resize panes

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
          {isDragging && i === Math.floor(height / 2) && splitPercent
            ? `${splitPercent}%`
            : isDragging
            ? ' ┃ '
            : ' │ '}
        </Text>
      ))}
    </Box>
  );
}
