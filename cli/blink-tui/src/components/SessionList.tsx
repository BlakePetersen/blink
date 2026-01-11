// ABOUTME: Left pane component showing session groups and items
// ABOUTME: Handles selection state and keyboard navigation

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { formatDistanceToNow } from 'date-fns';
import { SessionGroup, Session } from '../lib/types.js';
import { useTheme } from '../lib/theme.js';
import { adjustBrightness, interpolateColor } from '../lib/animation.js';

interface Props {
  groups: SessionGroup[];
  selectedIndex: number;
  width: number;
}

export function SessionList({ groups, selectedIndex, width }: Props) {
  const { settings, animationState } = useTheme();
  const { colors, animation } = settings;
  const { breathPhase } = animationState;

  // Calculate themed colors with subtle breathing on selected item
  const groupHeaderColor = useMemo(() => {
    return interpolateColor(colors.base, 0.5);
  }, [colors.base]);

  const selectedBgColor = useMemo(() => {
    const baseColor = colors.accent1;
    // Subtle breathing effect - 50% slower than header
    return animation.breathing
      ? adjustBrightness(baseColor, 0.7 + (breathPhase - 0.85) * 0.5)
      : baseColor;
  }, [colors.accent1, animation.breathing, breathPhase]);

  // Flatten sessions with group context for index calculation
  let currentIndex = 0;

  return (
    <Box flexDirection="column" width={width}>
      {groups.map((group, groupIdx) => (
        <Box key={groupIdx} flexDirection="column" marginBottom={1}>
          {/* Group header */}
          <Text color={groupHeaderColor} dimColor>
            {group.icon} {group.label}
          </Text>

          {/* Sessions in group */}
          {group.sessions.map((session, sessionIdx) => {
            const isSelected = currentIndex === selectedIndex;
            const itemIndex = currentIndex;
            currentIndex++;

            const timeAgo = formatDistanceToNow(session.created, { addSuffix: false });
            const title = session.title.length > width - 8
              ? session.title.slice(0, width - 11) + '...'
              : session.title;

            return (
              <Box key={session.path} paddingLeft={2}>
                <Text
                  color={isSelected ? 'white' : undefined}
                  backgroundColor={isSelected ? selectedBgColor : undefined}
                  bold={isSelected}
                >
                  {isSelected ? '● ' : '  '}
                  {title}
                </Text>
              </Box>
            );
          })}
        </Box>
      ))}

      {groups.length === 0 && (
        <Box paddingLeft={2}>
          <Text dimColor>No sessions found</Text>
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
