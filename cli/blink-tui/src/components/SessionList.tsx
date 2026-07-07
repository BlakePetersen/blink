// ABOUTME: Left pane component showing session groups and items
// ABOUTME: Handles selection state, viewport scrolling, and parse-error entries

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { SessionGroup, Session, ParseError } from '../lib/types.js';
import { useTheme } from '../lib/theme.js';
import { adjustBrightness, interpolateColor } from '../lib/animation.js';
import { computeVisibleWindow } from '../lib/viewport.js';

interface Props {
  groups: SessionGroup[];
  parseErrors?: ParseError[];
  selectedIndex: number;
  width: number;
  height?: number;
}

// A single navigable row in the flat list: either a session or an unreadable file.
export type ListItem =
  | { kind: 'session'; session: Session; groupLabel: string; groupIcon: string }
  | { kind: 'error'; error: ParseError; groupLabel: string; groupIcon: string };

const ERROR_ICON = '⚠';

function errorGroupLabel(count: number): string {
  return `${count} file${count === 1 ? '' : 's'} could not be read`;
}

// Flatten groups (and any parse errors) into a single navigable list. Parse
// errors trail the real sessions in their own group so they are always visible.
export function buildListItems(
  groups: SessionGroup[],
  parseErrors: ParseError[] = []
): ListItem[] {
  const items: ListItem[] = [];

  for (const group of groups) {
    for (const session of group.sessions) {
      items.push({
        kind: 'session',
        session,
        groupLabel: group.label,
        groupIcon: group.icon,
      });
    }
  }

  if (parseErrors.length > 0) {
    const label = errorGroupLabel(parseErrors.length);
    for (const error of parseErrors) {
      items.push({ kind: 'error', error, groupLabel: label, groupIcon: ERROR_ICON });
    }
  }

  return items;
}

export function getTotalItems(
  groups: SessionGroup[],
  parseErrors: ParseError[] = []
): number {
  return buildListItems(groups, parseErrors).length;
}

export function getItemAtIndex(
  groups: SessionGroup[],
  parseErrors: ParseError[],
  index: number
): ListItem | null {
  return buildListItems(groups, parseErrors)[index] ?? null;
}

export function SessionList({
  groups,
  parseErrors = [],
  selectedIndex,
  width,
  height,
}: Props) {
  const { settings, animationState } = useTheme();
  const { colors, animation } = settings;
  const { breathPhase } = animationState;

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

  const items = buildListItems(groups, parseErrors);
  const total = items.length;

  // Reserve rows for every group header plus the two edge markers so the
  // rendered block can never exceed the available height (Ink 4 does not clip).
  const groupCount = new Set(items.map(i => i.groupLabel)).size;
  const viewportRows =
    height && height > 0 ? Math.max(1, height - groupCount - 2) : total;

  const { startIndex, endIndex, moreAbove, moreBelow } = computeVisibleWindow(
    total,
    selectedIndex,
    viewportRows
  );

  const visible = items.slice(startIndex, endIndex);

  if (total === 0) {
    return (
      <Box flexDirection="column" width={width} height={height} paddingX={1}>
        <Box paddingLeft={2}>
          <Text dimColor>No sessions found</Text>
        </Box>
      </Box>
    );
  }

  let lastGroupLabel: string | null = null;

  return (
    <Box flexDirection="column" width={width} height={height} paddingX={1}>
      {moreAbove > 0 && (
        <Text color={groupHeaderColor} dimColor>
          ↑ {moreAbove} more
        </Text>
      )}

      {visible.map((item, localIdx) => {
        const absoluteIndex = startIndex + localIdx;
        const isSelected = absoluteIndex === selectedIndex;
        const showHeader = item.groupLabel !== lastGroupLabel;
        lastGroupLabel = item.groupLabel;

        return (
          <React.Fragment key={absoluteIndex}>
            {showHeader && (
              <Text color={groupHeaderColor} dimColor>
                {item.groupIcon} {item.groupLabel}
              </Text>
            )}
            <Box paddingLeft={2}>
              {item.kind === 'session'
                ? renderSessionRow(item.session, isSelected, selectedBgColor, width)
                : renderErrorRow(item.error, isSelected, selectedBgColor, width)}
            </Box>
          </React.Fragment>
        );
      })}

      {moreBelow > 0 && (
        <Text color={groupHeaderColor} dimColor>
          ↓ {moreBelow} more
        </Text>
      )}
    </Box>
  );
}

function truncateTitle(title: string, width: number): string {
  return title.length > width - 8 ? title.slice(0, width - 11) + '...' : title;
}

function renderSessionRow(
  session: Session,
  isSelected: boolean,
  selectedBgColor: string,
  width: number
) {
  return (
    <Text
      color={isSelected ? 'white' : undefined}
      backgroundColor={isSelected ? selectedBgColor : undefined}
      bold={isSelected}
    >
      {isSelected ? '● ' : '  '}
      {truncateTitle(session.title, width)}
    </Text>
  );
}

function renderErrorRow(
  error: ParseError,
  isSelected: boolean,
  selectedBgColor: string,
  width: number
) {
  const name = error.file.split('/').pop() ?? error.file;
  return (
    <Text
      color={isSelected ? 'white' : 'red'}
      backgroundColor={isSelected ? selectedBgColor : undefined}
      bold={isSelected}
    >
      {isSelected ? '● ' : '  '}
      {truncateTitle(name, width)}
    </Text>
  );
}
