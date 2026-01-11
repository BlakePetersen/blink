// ABOUTME: Single-line keybindings footer
// ABOUTME: Context-aware shortcuts with position indicator

import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../lib/theme.js';
import { isDevMode } from '../lib/dev-mode.js';

interface Props {
  isSearching: boolean;
  isDeleting?: boolean;
  currentIndex: number;
  totalCount: number;
  width: number;
}

export function Keybindings({
  isSearching,
  isDeleting,
  currentIndex,
  totalCount,
  width,
}: Props) {
  const { settings } = useTheme();
  const { colors } = settings;

  const isNarrow = width < 80;

  if (isDeleting) {
    return (
      <Box justifyContent="space-between" width={width}>
        <Box gap={2}>
          <Text>
            <Text color={colors.accent1}>y</Text>
            <Text dimColor> confirm</Text>
          </Text>
          <Text dimColor>any key cancel</Text>
        </Box>
      </Box>
    );
  }

  if (isSearching) {
    return (
      <Box justifyContent="space-between" width={width}>
        <Box gap={2}>
          <Text>
            <Text color={colors.accent1}>enter</Text>
            <Text dimColor> confirm</Text>
          </Text>
          <Text>
            <Text color={colors.accent1}>esc</Text>
            <Text dimColor> cancel</Text>
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box justifyContent="space-between" width={width}>
      <Box gap={2}>
        <Text>
          <Text color={colors.accent1}>↑↓</Text>
          <Text dimColor>{isNarrow ? '' : ' navigate'}</Text>
        </Text>
        <Text>
          <Text color={colors.accent1}>{isNarrow ? '⏎' : 'enter'}</Text>
          <Text dimColor>{isNarrow ? '' : ' load'}</Text>
        </Text>
        <Text>
          <Text color={colors.accent1}>t</Text>
          <Text dimColor>{isNarrow ? '' : ' tags'}</Text>
        </Text>
        <Text>
          <Text color={colors.accent1}>d</Text>
          <Text dimColor>{isNarrow ? '' : ' delete'}</Text>
        </Text>
        <Text>
          <Text color={colors.accent1}>q</Text>
          <Text dimColor>{isNarrow ? '' : ' quit'}</Text>
        </Text>
        {isDevMode() && (
          <Text>
            <Text color={colors.accent1}>r</Text>
            <Text dimColor>{isNarrow ? '' : ' fixtures'}</Text>
          </Text>
        )}
      </Box>
      <Text dimColor>
        {currentIndex + 1}/{totalCount}
      </Text>
    </Box>
  );
}
