// ABOUTME: Left pane component showing session groups and items
// ABOUTME: Handles selection state and keyboard navigation

import React from 'react';
import { Box, Text } from 'ink';
import { SessionGroup, Session } from '../lib/types.js';
import { mocha, colors } from '../theme.js';

interface Props {
  groups: SessionGroup[];
  selectedIndex: number;
  width: number;
}

export function SessionList({ groups, selectedIndex, width }: Props) {
  let currentIndex = 0;

  return (
    <Box flexDirection="column" width={width}>
      {groups.map((group, groupIdx) => (
        <Box key={groupIdx} flexDirection="column" marginBottom={1}>
          {/* Group header with subtle accent */}
          <Box>
            <Text color={mocha.overlay1}>
              {group.icon}{' '}
            </Text>
            <Text color={mocha.subtext0} bold>
              {group.label.toUpperCase()}
            </Text>
          </Box>

          {/* Sessions in group */}
          {group.sessions.map((session) => {
            const isSelected = currentIndex === selectedIndex;
            currentIndex++;

            const title =
              session.title.length > width - 6
                ? session.title.slice(0, width - 9) + '...'
                : session.title;

            return (
              <Box key={session.path} paddingLeft={1}>
                {isSelected ? (
                  <Box>
                    <Text color={colors.primary}>❯ </Text>
                    <Text color={mocha.text} bold>
                      {title}
                    </Text>
                  </Box>
                ) : (
                  <Box>
                    <Text color={mocha.surface2}>  </Text>
                    <Text color={mocha.subtext0}>{title}</Text>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      ))}

      {groups.length === 0 && (
        <Box paddingLeft={2}>
          <Text color={mocha.overlay0}>No sessions found</Text>
        </Box>
      )}
    </Box>
  );
}

export function getTotalSessions(groups: SessionGroup[]): number {
  return groups.reduce((sum, g) => sum + g.sessions.length, 0);
}

export function getSessionAtIndex(groups: SessionGroup[], index: number): Session | null {
  let currentIndex = 0;
  for (const group of groups) {
    for (const session of group.sessions) {
      if (currentIndex === index) return session;
      currentIndex++;
    }
  }
  return null;
}
