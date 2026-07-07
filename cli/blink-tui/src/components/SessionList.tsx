// ABOUTME: Left pane component showing session groups and items
// ABOUTME: Handles selection state, viewport scrolling, and parse-error entries

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { SessionGroup, Session, ParseError } from '../lib/types.js';
import { useTheme } from '../lib/theme.js';
import { adjustBrightness, interpolateColor } from '../lib/animation.js';
import stringWidth from 'string-width';
import { computeVisibleWindow } from '../lib/viewport.js';
import { truncateToWidth } from '../lib/width.js';
import { plainGroupMarker } from '../lib/plain-mode.js';
import { emptyStateMessage } from '../lib/list-view.js';
import { projectLabel } from '../lib/project-view.js';

interface Props {
  groups: SessionGroup[];
  parseErrors?: ParseError[];
  selectedIndex: number;
  width: number;
  height?: number;
  hasAnySessions?: boolean;
  searchQuery?: string;
  currentProject?: string;
}

// Cap a project badge so a deeply-named origin can't crowd out the title.
const BADGE_MAX_WIDTH = 14;

// The origin badge shown for a session that came from a different project than
// the one being browsed. Empty for same-project (the default context) or
// project-less sessions, so the list only calls out cross-project origins (#58).
function projectBadge(session: Session, currentProject: string): string {
  if (!session.project || session.project === currentProject) return '';
  const label = projectLabel(session.project);
  if (!label) return '';
  return `↗${truncateToWidth(label, BADGE_MAX_WIDTH)}`;
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
  hasAnySessions = false,
  searchQuery = '',
  currentProject = '',
}: Props) {
  const { settings, animationState, plainMode } = useTheme();
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
          <Text dimColor>{emptyStateMessage(hasAnySessions, searchQuery)}</Text>
        </Box>
      </Box>
    );
  }

  let lastGroupLabel: string | null = null;

  return (
    <Box flexDirection="column" width={width} height={height} paddingX={1}>
      {moreAbove > 0 && (
        <Text color={groupHeaderColor} dimColor>
          {plainMode ? '^' : '↑'} {moreAbove} more
        </Text>
      )}

      {visible.map((item, localIdx) => {
        const absoluteIndex = startIndex + localIdx;
        const isSelected = absoluteIndex === selectedIndex;
        const showHeader = item.groupLabel !== lastGroupLabel;
        lastGroupLabel = item.groupLabel;
        const groupMarker = plainMode ? plainGroupMarker(item.groupIcon) : item.groupIcon;

        return (
          <React.Fragment key={absoluteIndex}>
            {showHeader && (
              <Text color={groupHeaderColor} dimColor>
                {groupMarker} {item.groupLabel}
              </Text>
            )}
            <Box paddingLeft={2}>
              {item.kind === 'session'
                ? renderSessionRow(item.session, isSelected, selectedBgColor, width, plainMode, currentProject)
                : renderErrorRow(item.error, isSelected, selectedBgColor, width, plainMode)}
            </Box>
          </React.Fragment>
        );
      })}

      {moreBelow > 0 && (
        <Text color={groupHeaderColor} dimColor>
          {plainMode ? 'v' : '↓'} {moreBelow} more
        </Text>
      )}
    </Box>
  );
}

// Reserve 8 columns for the selection marker and horizontal padding, then
// truncate by display width so wide (CJK/emoji) titles never overflow the pane.
// An optional trailing badge (e.g. a cross-project origin) claims its own width
// plus a separating space so title + badge together still fit the pane.
function truncateTitle(title: string, width: number, badgeWidth = 0): string {
  const reserved = badgeWidth > 0 ? badgeWidth + 1 : 0;
  return truncateToWidth(title, width - 8 - reserved);
}

function selectionMarker(isSelected: boolean, plainMode: boolean): string {
  if (!isSelected) return '  ';
  return plainMode ? '> ' : '● ';
}

function renderSessionRow(
  session: Session,
  isSelected: boolean,
  selectedBgColor: string,
  width: number,
  plainMode: boolean,
  currentProject: string
) {
  const badge = projectBadge(session, currentProject);
  const badgeWidth = stringWidth(badge);
  return (
    <Text
      color={isSelected ? 'white' : undefined}
      backgroundColor={isSelected ? selectedBgColor : undefined}
      bold={isSelected}
    >
      {selectionMarker(isSelected, plainMode)}
      {truncateTitle(session.title, width, badgeWidth)}
      {badge ? <Text dimColor={!isSelected}> {badge}</Text> : null}
    </Text>
  );
}

function renderErrorRow(
  error: ParseError,
  isSelected: boolean,
  selectedBgColor: string,
  width: number,
  plainMode: boolean
) {
  const name = error.file.split('/').pop() ?? error.file;
  return (
    <Text
      color={isSelected ? 'white' : 'red'}
      backgroundColor={isSelected ? selectedBgColor : undefined}
      bold={isSelected}
    >
      {selectionMarker(isSelected, plainMode)}
      {truncateTitle(name, width)}
    </Text>
  );
}
