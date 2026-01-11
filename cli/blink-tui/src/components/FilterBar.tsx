// ABOUTME: Filter bar component with tag chips and search input
// ABOUTME: Allows filtering sessions by tags and search text

import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

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
                color={isSelected ? 'white' : 'red'}
                backgroundColor={isSelected ? 'red' : undefined}
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
