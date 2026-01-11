// ABOUTME: Right pane component showing selected session details
// ABOUTME: Displays title, status, next steps, and files

import React from 'react';
import { Box, Text } from 'ink';
import { formatDistanceToNow } from 'date-fns';
import { Session } from '../lib/types.js';

interface Props {
  session: Session | null;
  width: number;
}

export function Preview({ session, width }: Props) {
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
      <Text color="magentaBright" bold>
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
            <Text key={tag} color="red" dimColor>
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
