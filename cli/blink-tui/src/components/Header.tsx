// ABOUTME: Header component with animated Blink logo
// ABOUTME: Applies cycling, wave, shimmer, and breathing effects

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../lib/theme.js';
import { interpolateColor, shouldShimmer } from '../lib/animation.js';

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

function brightenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.min(255, Math.round(r + (255 - r) * amount));
  const newG = Math.min(255, Math.round(g + (255 - g) * amount));
  const newB = Math.min(255, Math.round(b + (255 - b) * amount));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

function adjustBrightness(hex: string, multiplier: number): string {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * multiplier);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * multiplier);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * multiplier);

  return `#${Math.min(255, r).toString(16).padStart(2, '0')}${Math.min(255, g).toString(16).padStart(2, '0')}${Math.min(255, b).toString(16).padStart(2, '0')}`;
}
