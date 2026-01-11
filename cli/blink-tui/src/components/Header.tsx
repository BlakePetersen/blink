// ABOUTME: Header component with animated Blink logo
// ABOUTME: Applies cycling, wave, shimmer, and breathing effects

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../lib/theme.js';
import { interpolateColor, shouldShimmer, brightenColor, adjustBrightness } from '../lib/animation.js';

const LOGO = '░░░ ▒▒▒ ▓▓▓ ███ BLINK ███ ▓▓▓ ▒▒▒ ░░░';

export function Header() {
  const { settings, animationState } = useTheme();
  const { colors, animation } = settings;
  const { cyclePosition, wavePosition, breathPhase, elapsed } = animationState;

  const renderedChars = useMemo(() => {
    return LOGO.split('').map((char, i) => {
      if (char === ' ') return <Text key={i}> </Text>;

      const charPosition = i / LOGO.length;

      // Base color from cycling gradient
      let colorPosition = animation.cycling
        ? (cyclePosition + charPosition * 0.3) % 1
        : charPosition;
      let color = interpolateColor(colors.base, colorPosition);

      // Wave brightening
      if (animation.wave) {
        const waveDistance = Math.abs(charPosition - wavePosition);
        if (waveDistance < 0.15) {
          const waveIntensity = 1 - (waveDistance / 0.15);
          color = brightenColor(color, waveIntensity * 0.3);
        }
      }

      // Shimmer sparkle
      if (animation.shimmer && shouldShimmer(i, elapsed, 0.03)) {
        color = '#ffffff';
      }

      // Breathing brightness
      const finalColor = animation.breathing
        ? adjustBrightness(color, breathPhase)
        : color;

      return <Text key={i} color={finalColor}>{char}</Text>;
    });
  }, [colors, animation, cyclePosition, wavePosition, breathPhase, elapsed]);

  return (
    <Box flexDirection="row" justifyContent="center" marginBottom={1}>
      {renderedChars}
    </Box>
  );
}
