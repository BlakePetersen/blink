// ABOUTME: Filter bar with tag chips and search input
// ABOUTME: Full-width bar with background, pulsing cursor when searching

import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useTheme } from '../lib/theme.js';
import { BACKGROUNDS } from '../lib/backgrounds.js';

interface Props {
  tags: string[];
  selectedTags: string[];
  searchQuery: string;
  isSearching: boolean;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  width: number;
  maxTags?: number;
}

export function FilterBar({
  tags,
  selectedTags,
  searchQuery,
  isSearching,
  onSearchChange,
  onSearchSubmit,
  width,
  maxTags = 5,
}: Props) {
  const { settings } = useTheme();
  const { colors } = settings;
  const [cursorVisible, setCursorVisible] = useState(true);

  // Pulsing cursor effect
  useEffect(() => {
    if (!isSearching) return;
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);
    return () => clearInterval(interval);
  }, [isSearching]);

  const visibleTags = tags.slice(0, maxTags);
  const hiddenCount = tags.length - maxTags;

  // Build the tags content
  const tagsContent = useMemo(() => {
    const parts: React.ReactNode[] = [];
    visibleTags.forEach((tag, idx) => {
      const isActive = selectedTags.includes(tag);
      if (idx > 0) parts.push(' ');
      parts.push(
        <Text
          key={tag}
          color={isActive ? 'black' : colors.accent3}
          backgroundColor={isActive ? colors.accent2 : BACKGROUNDS.filterBar}
          dimColor={!isActive}
        >
          [{tag}]
        </Text>
      );
    });
    if (hiddenCount > 0) {
      parts.push(' ');
      parts.push(
        <Text key="more" dimColor backgroundColor={BACKGROUNDS.filterBar}>
          [+{hiddenCount} more]
        </Text>
      );
    }
    return parts;
  }, [visibleTags, selectedTags, hiddenCount, colors.accent2, colors.accent3]);

  // Build the search content
  const searchContent = useMemo(() => {
    if (isSearching) {
      return (
        <>
          <Text backgroundColor={BACKGROUNDS.filterBar}>search: </Text>
          <TextInput
            value={searchQuery}
            onChange={onSearchChange}
            onSubmit={onSearchSubmit}
          />
          <Text color="cyan" backgroundColor={BACKGROUNDS.filterBar}>
            {cursorVisible ? '█' : ' '}
          </Text>
        </>
      );
    }
    return (
      <Text dimColor backgroundColor={BACKGROUNDS.filterBar}>
        / to search
      </Text>
    );
  }, [isSearching, searchQuery, onSearchChange, onSearchSubmit, cursorVisible]);

  // Calculate padding needed to fill the width
  const tagsText = visibleTags.map(t => `[${t}]`).join(' ');
  const moreText = hiddenCount > 0 ? ` [+${hiddenCount} more]` : '';
  const searchText = isSearching ? `search: ${searchQuery}█` : '/ to search';
  const contentWidth = tagsText.length + moreText.length + searchText.length + 4; // 4 for padding
  const fillWidth = Math.max(0, width - contentWidth);

  return (
    <Box width={width}>
      <Text backgroundColor={BACKGROUNDS.filterBar}>  </Text>
      {tagsContent}
      <Text backgroundColor={BACKGROUNDS.filterBar}>
        {' '.repeat(fillWidth)}
      </Text>
      {searchContent}
      <Text backgroundColor={BACKGROUNDS.filterBar}>  </Text>
    </Box>
  );
}
