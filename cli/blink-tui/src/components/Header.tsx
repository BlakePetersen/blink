// ABOUTME: Animated ASCII art header with responsive sizing
// ABOUTME: Warez NFO-style with flames, eye, and color effects

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../lib/theme.js';
import { getHeaderLines, HeaderSize } from '../lib/ascii-art.js';
import { getHeaderSize } from '../lib/layout.js';
import { interpolateColor, shouldShimmer } from '../lib/animation.js';

interface Props {
  width: number;
}

export function Header({ width }: Props) {
  const { settings, animationState } = useTheme();
  const { colors, animation } = settings;
  const { cyclePosition, elapsed } = animationState;

  const headerSize: HeaderSize = getHeaderSize(width);
  const lines = useMemo(() => getHeaderLines(headerSize), [headerSize]);

  const renderedLines = useMemo(() => {
    return lines.map((line, lineIdx) => {
      const chars = line.split('').map((char, charIdx) => {
        if (char === ' ') return <Text key={charIdx}> </Text>;

        // Flame characters get fire colors
        const isFlame = '░▒▓'.includes(char);
        // Eye characters get special treatment
        const isEye = '●◠◢◣◥◤▀▄'.includes(char);
        // Block letters get gradient
        const isLetter = '█╗╔╝═╚║'.includes(char);

        let color: string;

        if (isFlame) {
          // Fire gradient: red -> orange -> yellow based on line position
          const fireColors = ['#8b0000', '#ff4500', '#ff8c00', '#ffd700'];
          const firePos = animation.cycling
            ? (lineIdx / Math.max(lines.length, 1) + cyclePosition) % 1
            : lineIdx / Math.max(lines.length, 1);
          color = interpolateColor(fireColors, firePos);
        } else if (isEye) {
          // Eye uses accent color with occasional shimmer
          color = colors.accent1;
          if (animation.shimmer && shouldShimmer(charIdx + lineIdx * 100, elapsed, 0.02)) {
            color = '#ffffff';
          }
        } else if (isLetter) {
          // Letters use cycling purple gradient
          const letterPos = animation.cycling
            ? (cyclePosition + charIdx * 0.01) % 1
            : 0.5;
          color = interpolateColor(colors.base, letterPos);
        } else {
          color = '#888888';
        }

        return <Text key={charIdx} color={color}>{char}</Text>;
      });

      return (
        <Box key={lineIdx} justifyContent="center">
          {chars}
        </Box>
      );
    });
  }, [lines, colors, animation, cyclePosition, elapsed]);

  return (
    <Box flexDirection="column" marginBottom={1}>
      {renderedLines}
    </Box>
  );
}
