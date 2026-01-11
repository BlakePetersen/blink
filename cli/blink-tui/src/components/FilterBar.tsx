// ABOUTME: Filter bar component with tag chips and search input
// ABOUTME: Allows filtering sessions by tags and search text

import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { Badge } from '@inkjs/ui';
import { mocha, colors } from '../theme.js';

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
    <Box flexDirection="column" paddingTop={0}>
      {/* Tags row */}
      {tags.length > 0 && (
        <Box gap={1} marginBottom={1}>
          {tags.slice(0, 6).map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <Badge
                key={tag}
                color={isSelected ? mocha.mauve : mocha.surface2}
              >
                {isSelected ? `● ${tag}` : tag}
              </Badge>
            );
          })}
          {selectedTags.length > 0 && (
            <Text color={mocha.overlay0}> ×</Text>
          )}
        </Box>
      )}

      {/* Search row */}
      <Box>
        <Text color={isSearching ? colors.primary : mocha.overlay0}>⌕ </Text>
        {isSearching ? (
          <TextInput
            value={searchQuery}
            onChange={onSearchChange}
            onSubmit={onSearchSubmit}
            placeholder="type to search..."
          />
        ) : (
          <Text color={mocha.overlay0}>
            {searchQuery || 'press / to search'}
          </Text>
        )}
      </Box>
    </Box>
  );
}
