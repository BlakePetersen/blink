// ABOUTME: Right pane component showing selected session details
// ABOUTME: Displays title, status, next steps, and files

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { formatDistanceToNow } from 'date-fns';
import { Session } from '../lib/types.js';
import { useTheme } from '../lib/theme.js';
import { interpolateColor, shouldShimmer, brightenColor } from '../lib/animation.js';

interface Props {
  session: Session | null;
  width: number;
}

export function Preview({ session, width }: Props) {
  const { settings, animationState } = useTheme();
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
  const getTagColor = (tagIndex: number): string => {
    const baseColor = colors.accent3;
    if (animation.shimmer && shouldShimmer(tagIndex + 100, elapsed, 0.015)) {
      return brightenColor(baseColor, 0.6);
    }
    return baseColor;
  };

  if (!session) {
    return (
      <Box flexDirection="column" width={width} paddingLeft={2}>
        <Text dimColor>Select a session to preview</Text>
      </Box>
    );
  }

  const timeAgo = formatDistanceToNow(session.created, { addSuffix: true });

  return (
    <Box flexDirection="column" width={width} paddingLeft={2}>
      {/* Title */}
      <Text color={titleColor} bold>
        ✦ {session.title}
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
              {i > 0 ? ' ' : ''}「{tag}」
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

function truncate(str: string, maxLen: number): string {
  // Handle multiline - just take first line
  const firstLine = str.split('\n')[0];
  if (firstLine.length <= maxLen) return firstLine;
  return firstLine.slice(0, maxLen - 3) + '...';
}
