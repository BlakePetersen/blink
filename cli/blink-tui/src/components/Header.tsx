// ABOUTME: Header component with Blink logo and gradient effect
// ABOUTME: Uses Catppuccin Mocha colors for a smooth gradient

import React from 'react';
import { Box, Text } from 'ink';
import { mocha } from '../theme.js';

// Gradient colors from Catppuccin Mocha (mauve -> pink -> flamingo -> rosewater)
const gradientColors = [
  mocha.mauve,      // #cba6f7
  mocha.pink,       // #f5c2e7
  mocha.flamingo,   // #f2cdcd
  mocha.rosewater,  // #f5e0dc
  mocha.flamingo,   // #f2cdcd
  mocha.pink,       // #f5c2e7
  mocha.mauve,      // #cba6f7
];

// Interpolate between two hex colors
function interpolateColor(color1: string, color2: string, factor: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Get gradient color for a position (0 to 1)
function getGradientColor(position: number): string {
  const scaledPos = position * (gradientColors.length - 1);
  const index = Math.floor(scaledPos);
  const factor = scaledPos - index;

  if (index >= gradientColors.length - 1) {
    return gradientColors[gradientColors.length - 1];
  }

  return interpolateColor(gradientColors[index], gradientColors[index + 1], factor);
}

// Render text with gradient colors (memoized to avoid re-renders)
const GradientText = React.memo(function GradientText({
  children,
}: {
  children: string;
}) {
  const length = children.length || 1;
  const chars = React.useMemo(() => children.split(''), [children]);
  const colors = React.useMemo(
    () => Array.from({ length }, (_, i) => getGradientColor(i / (length - 1 || 1))),
    [length]
  );

  return (
    <>
      {chars.map((char, i) => (
        <Text key={i} color={colors[i]}>
          {char}
        </Text>
      ))}
    </>
  );
});

export function Header() {
  const logo = '░░░ ▒▒▒ ▓▓▓ ███ BLINK ███ ▓▓▓ ▒▒▒ ░░░';

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <GradientText>{logo}</GradientText>
      </Box>
    </Box>
  );
}
