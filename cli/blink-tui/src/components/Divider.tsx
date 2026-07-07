// ABOUTME: Visual divider between session list and preview panes
// ABOUTME: Renders a static vertical rule spanning the content height

import React from 'react';
import { Box, Text } from 'ink';
import { getBackgrounds } from '../lib/backgrounds.js';

interface Props {
  height: number;
}

export function Divider({ height }: Props) {
  const lines = Array(height).fill(null);
  const dividerBg = getBackgrounds().divider;

  return (
    <Box flexDirection="column" width={3}>
      {lines.map((_, i) => (
        <Text key={i} color="gray" backgroundColor={dividerBg}>
          {' │ '}
        </Text>
      ))}
    </Box>
  );
}
