// ABOUTME: Filter bar component with tag chips and search input
// ABOUTME: Allows filtering sessions by tags and search text

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useTheme } from '../lib/theme.js';
import { adjustBrightness } from '../lib/animation.js';

interface Props {
  tags: string[];
  selectedTags: string[];
  searchQuery: string;
  isSearching: boolean;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
}

export function FilterBar({
  tags,
  selectedTags,
  searchQuery,
  isSearching,
  onSearchChange,
  onSearchSubmit,
}: Props) {
  const { settings, animationState } = useTheme();
  const { colors, animation } = settings;
  const { breathPhase } = animationState;

  // Pulsing color for active filters (subtle pulse using breathing phase)
  const activeFilterBgColor = useMemo(() => {
    const baseColor = colors.accent2;
    if (!animation.breathing) {
      return baseColor;
    }
    // Subtle pulse - 50% intensity of header breathing
    return adjustBrightness(baseColor, 0.8 + (breathPhase - 0.85) * 0.3);
  }, [colors.accent2, animation.breathing, breathPhase]);

  const inactiveFilterColor = useMemo(() => {
    return colors.accent3;
  }, [colors.accent3]);

  return (
    <Box flexDirection="column" borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} paddingTop={0}>
      {/* Tags row */}
      {tags.length > 0 && (
        <Box>
          {tags.slice(0, 8).map(tag => {
            const isSelected = selectedTags.includes(tag);
            return (
              <Text
                key={tag}
                color={isSelected ? 'white' : inactiveFilterColor}
                backgroundColor={isSelected ? activeFilterBgColor : undefined}
                dimColor={!isSelected}
              >
                「{tag}」{' '}
              </Text>
            );
          })}
          {selectedTags.length > 0 && (
            <Text dimColor> [×]</Text>
          )}
        </Box>
      )}

      {/* Search row */}
      <Box>
        <Text color="gray">⌕ </Text>
        {isSearching ? (
          <TextInput
            value={searchQuery}
            onChange={onSearchChange}
            onSubmit={onSearchSubmit}
            placeholder="search..."
          />
        ) : (
          <Text dimColor>{searchQuery || 'press / to search'}</Text>
        )}
      </Box>
    </Box>
  );
}
