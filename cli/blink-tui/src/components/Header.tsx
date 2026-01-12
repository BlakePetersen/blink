// ABOUTME: Animated ASCII art header with responsive sizing
// ABOUTME: Brutalist style with animated color gradient

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../lib/theme.js';
import { getHeaderLines, HeaderSize } from '../lib/ascii-art.js';
import { getHeaderSize } from '../lib/layout.js';
import { interpolateColor } from '../lib/animation.js';

interface Props {
  width: number;
}

export function Header({ width }: Props) {
  const { settings, animationState } = useTheme();
  const { colors, animation } = settings;
  const { cyclePosition } = animationState;

  const headerSize: HeaderSize = getHeaderSize(width);
  const lines = useMemo(() => getHeaderLines(headerSize), [headerSize]);

  const renderedLines = useMemo(() => {
    return lines.map((line, lineIdx) => {
      const chars = line.split('').map((char, charIdx) => {
        if (char === ' ') return <Text key={charIdx}> </Text>;

        // All characters get the animated gradient
        const pos = animation.cycling
          ? (cyclePosition + charIdx * 0.015 + lineIdx * 0.05) % 1
          : 0.5;
        const color = interpolateColor(colors.base, pos);

        return <Text key={charIdx} color={color}>{char}</Text>;
      });

      return (
        <Box key={lineIdx} justifyContent="center">
          {chars}
        </Box>
      );
    });
  }, [lines, colors, animation, cyclePosition]);

  return (
    <Box flexDirection="column" marginBottom={1}>
      {renderedLines}
    </Box>
  );
}
