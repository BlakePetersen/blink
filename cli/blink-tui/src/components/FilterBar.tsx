// ABOUTME: Filter bar with tag chips and search input
// ABOUTME: Full-width single-line bar; chips truncate to fit the terminal width

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useTheme } from '../lib/theme.js';
import { getBackgrounds } from '../lib/backgrounds.js';
import { chipLabel, fitChips } from '../lib/chips.js';

interface Props {
  tags: string[];
  selectedTags: string[];
  searchQuery: string;
  isSearching: boolean;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  width: number;
}

// Leading + trailing padding cells that frame the bar.
const EDGE_PADDING = 2;

export function FilterBar({
  tags,
  selectedTags,
  searchQuery,
  isSearching,
  onSearchChange,
  onSearchSubmit,
  width,
}: Props) {
  const { settings } = useTheme();
  const { colors } = settings;
  // Resolve the bar fill to the terminal's theme so it stays legible on light
  // terminals (a fixed dark fill made default-foreground text invisible there).
  const filterBarBg = useMemo(() => getBackgrounds().filterBar, []);

  // Reserve width for the search region so chips never push the bar to wrap.
  const searchReserve = isSearching
    ? 'search: '.length + searchQuery.length
    : '/ to search'.length;

  // Budget left for chips: total minus both edge paddings, the search region,
  // and one column of breathing room between chips and search.
  const chipBudget = Math.max(0, width - EDGE_PADDING * 2 - searchReserve - 1);

  const { visibleTags, overflow, chipsWidth } = useMemo(() => {
    const labels = tags.map(tag => chipLabel(tag, selectedTags.includes(tag)));
    const { visible, overflow } = fitChips(labels, chipBudget);
    const marker = overflow > 0 ? `+${overflow}` : '';
    const rendered = [...visible, ...(marker ? [marker] : [])].join(' ');
    return {
      visibleTags: tags.slice(0, visible.length),
      overflow,
      chipsWidth: rendered.length,
    };
  }, [tags, selectedTags, chipBudget]);

  const tagsContent = useMemo(() => {
    const parts: React.ReactNode[] = [];
    visibleTags.forEach((tag, idx) => {
      const isActive = selectedTags.includes(tag);
      if (idx > 0) {
        parts.push(<Text key={`sep-${idx}`} backgroundColor={filterBarBg}> </Text>);
      }
      parts.push(
        <Text
          key={tag}
          color={isActive ? 'black' : colors.accent3}
          backgroundColor={isActive ? colors.accent2 : filterBarBg}
          dimColor={!isActive}
        >
          {chipLabel(tag, isActive)}
        </Text>
      );
    });
    if (overflow > 0) {
      parts.push(<Text key="sep-more" backgroundColor={filterBarBg}> </Text>);
      parts.push(
        <Text key="more" dimColor backgroundColor={filterBarBg}>
          +{overflow}
        </Text>
      );
    }
    return parts;
  }, [visibleTags, selectedTags, overflow, colors.accent2, colors.accent3]);

  const searchContent = useMemo(() => {
    if (isSearching) {
      return (
        <>
          <Text backgroundColor={filterBarBg}>search: </Text>
          <TextInput
            value={searchQuery}
            onChange={onSearchChange}
            onSubmit={onSearchSubmit}
            showCursor
          />
        </>
      );
    }
    return (
      <Text dimColor backgroundColor={filterBarBg}>
        / to search
      </Text>
    );
  }, [isSearching, searchQuery, onSearchChange, onSearchSubmit]);

  // Fill the gap between chips and the search region so the background spans
  // the full width on a single line.
  const fillWidth = Math.max(
    0,
    width - EDGE_PADDING * 2 - chipsWidth - searchReserve
  );

  return (
    <Box width={width}>
      <Text backgroundColor={filterBarBg}>  </Text>
      {tagsContent}
      <Text backgroundColor={filterBarBg}>
        {' '.repeat(fillWidth)}
      </Text>
      {searchContent}
      <Text backgroundColor={filterBarBg}>  </Text>
    </Box>
  );
}
