// ABOUTME: Right pane component showing selected session details
// ABOUTME: Displays title, status, next steps, and files

import React, { useMemo, useCallback } from 'react';
import { Box, Text } from 'ink';
import { formatDistanceToNow } from 'date-fns';
import { Session, ParseError } from '../lib/types.js';
import { useTheme } from '../lib/theme.js';
import { interpolateColor, shouldShimmer, brightenColor } from '../lib/animation.js';
import { truncateToWidth } from '../lib/width.js';
import { formatTag, PLAIN_TITLE_MARKER } from '../lib/plain-mode.js';

interface Props {
  session: Session | null;
  parseError?: ParseError | null;
  width: number;
  height?: number;
}

export function Preview({ session, parseError, width, height }: Props) {
  const { settings, animationState, reducedMotion, plainMode } = useTheme();
  const { colors, animation } = settings;
  const { cyclePosition, elapsed } = animationState;

  // Slow cycling color for title (75% slower than header)
  const titleColor = useMemo(() => {
    if (!animation.cycling) {
      return colors.accent2;
    }
    // Slow the cycle by using a fraction of the position
    const slowPosition = cyclePosition * 0.25;
    return interpolateColor(colors.base, slowPosition);
  }, [colors.base, colors.accent2, animation.cycling, cyclePosition]);

  // Tag color with shimmer effect
  const getTagColor = useCallback((tagIndex: number): string => {
    const baseColor = colors.accent3;
    if (!reducedMotion && animation.shimmer && shouldShimmer(tagIndex + 100, elapsed, 0.015, animation.speed)) {
      return brightenColor(baseColor, 0.6);
    }
    return baseColor;
  }, [colors.accent3, animation.shimmer, animation.speed, elapsed, reducedMotion]);

  if (parseError) {
    const name = parseError.file.split('/').pop() ?? parseError.file;
    return (
      <Box flexDirection="column" width={width} height={height} paddingX={2} paddingY={1}>
        <Text color="red" bold>
          {plainMode ? '!' : '⚠'} Could not read file
        </Text>
        <Box marginTop={1}>
          <Text>{name}</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>{parseError.file}</Text>
        </Box>
        <Box flexDirection="column" marginTop={1}>
          <Text color="gray">reason</Text>
          <Text color="red">{parseError.reason}</Text>
        </Box>
      </Box>
    );
  }

  if (!session) {
    return (
      <Box flexDirection="column" width={width} height={height} paddingX={2} paddingY={1}>
        <Text dimColor>Select a session to preview</Text>
      </Box>
    );
  }

  const timeAgo = formatDistanceToNow(session.created, { addSuffix: true });

  return (
    <Box flexDirection="column" width={width} height={height} paddingX={2} paddingY={1}>
      {/* Title */}
      <Text color={titleColor} bold>
        {plainMode ? PLAIN_TITLE_MARKER : '✦'} {session.title}
      </Text>

      {/* Metadata */}
      <Box marginTop={1}>
        <Text dimColor>
          {session.type} · {timeAgo}
        </Text>
      </Box>

      {/* Tags */}
      {session.tags.length > 0 && (
        <Box marginTop={1}>
          {session.tags.map((tag, i) => (
            <Text key={tag} color={getTagColor(i)} dimColor>
              {i > 0 ? ' ' : ''}{formatTag(tag, plainMode)}
            </Text>
          ))}
        </Box>
      )}

      {/* Working On */}
      {session.workingOn && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="gray">working on</Text>
          <Text>{truncate(session.workingOn, width - 4)}</Text>
        </Box>
      )}

      {/* Status */}
      {session.status && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="gray">status</Text>
          <Text>{truncate(session.status, width - 4)}</Text>
        </Box>
      )}

      {/* Next Steps */}
      {session.nextSteps && session.nextSteps.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="gray">next steps</Text>
          {session.nextSteps.slice(0, 5).map((step, i) => (
            <Text key={i}>  · {truncate(step, width - 6)}</Text>
          ))}
        </Box>
      )}

      {/* Files */}
      {session.files && session.files.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="gray">files</Text>
          {session.files.slice(0, 5).map((file, i) => (
            <Text key={i} dimColor>  · {truncate(file, width - 6)}</Text>
          ))}
        </Box>
      )}
    </Box>
  );
}

function truncate(str: string, maxWidth: number): string {
  // Handle multiline - just take first line, then truncate by display width so
  // emoji/CJK are measured correctly and never split mid-character.
  const firstLine = str.split('\n')[0];
  return truncateToWidth(firstLine, maxWidth);
}
