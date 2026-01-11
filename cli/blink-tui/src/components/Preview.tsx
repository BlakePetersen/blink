// ABOUTME: Right pane component showing selected session details
// ABOUTME: Displays title, status, next steps, and files

import React from 'react';
import { Box, Text } from 'ink';
import { Badge } from '@inkjs/ui';
import { formatDistanceToNow } from 'date-fns';
import { Session } from '../lib/types.js';
import { mocha, colors } from '../theme.js';

interface Props {
  session: Session | null;
  width: number;
}

// Section header component for consistent styling
function SectionHeader({ children }: { children: string }) {
  return (
    <Text color={mocha.overlay1} bold>
      {children.toUpperCase()}
    </Text>
  );
}

export function Preview({ session, width }: Props) {
  if (!session) {
    return (
      <Box flexDirection="column" width={width} paddingLeft={2}>
        <Text color={mocha.overlay0}>Select a session to preview</Text>
      </Box>
    );
  }

  const timeAgo = formatDistanceToNow(session.created, { addSuffix: true });

  return (
    <Box flexDirection="column" width={width} paddingLeft={2}>
      {/* Title with accent */}
      <Box>
        <Text color={colors.primary}>✦ </Text>
        <Text color={mocha.text} bold>
          {session.title}
        </Text>
      </Box>

      {/* Metadata line */}
      <Box marginTop={1}>
        <Text color={mocha.subtext0}>
          {session.type}
        </Text>
        <Text color={mocha.surface2}> · </Text>
        <Text color={mocha.overlay0}>{timeAgo}</Text>
      </Box>

      {/* Tags as badges */}
      {session.tags.length > 0 && (
        <Box marginTop={1} gap={1}>
          {session.tags.map((tag) => (
            <Badge key={tag} color={mocha.pink}>
              {tag}
            </Badge>
          ))}
        </Box>
      )}

      {/* Working On */}
      {session.workingOn && (
        <Box flexDirection="column" marginTop={1}>
          <SectionHeader>working on</SectionHeader>
          <Text color={mocha.text}>{truncate(session.workingOn, width - 4)}</Text>
        </Box>
      )}

      {/* Status */}
      {session.status && (
        <Box flexDirection="column" marginTop={1}>
          <SectionHeader>status</SectionHeader>
          <Text color={mocha.text}>{truncate(session.status, width - 4)}</Text>
        </Box>
      )}

      {/* Next Steps */}
      {session.nextSteps && session.nextSteps.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <SectionHeader>next steps</SectionHeader>
          {session.nextSteps.slice(0, 5).map((step, i) => (
            <Box key={i}>
              <Text color={mocha.green}>  ○ </Text>
              <Text color={mocha.subtext1}>{truncate(step, width - 6)}</Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Files */}
      {session.files && session.files.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <SectionHeader>files</SectionHeader>
          {session.files.slice(0, 5).map((file, i) => (
            <Box key={i}>
              <Text color={mocha.blue}>  ◇ </Text>
              <Text color={mocha.overlay1}>{truncate(file, width - 6)}</Text>
            </Box>
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
