// ABOUTME: Main App component for Blink TUI
// ABOUTME: Manages state, keyboard input, and responsive layout

import React, { useState } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { Header } from './components/Header.js';
import { ThemeProvider } from './lib/theme.js';
import { SessionList, getTotalSessions, getSessionAtIndex } from './components/SessionList.js';
import { Preview } from './components/Preview.js';
import { FilterBar } from './components/FilterBar.js';
import { Keybindings } from './components/Keybindings.js';
import { Divider } from './components/Divider.js';
import { loadAllSessions, filterSessions, getAllTags, deleteSession, loadFixtureSessions } from './lib/sessions.js';
import { SessionGroup, Session } from './lib/types.js';
import { isDevMode } from './lib/dev-mode.js';
import { FIXTURES_DIR } from './lib/__fixtures__/index.js';
import { getLayoutMode, calculatePaneWidths, getHeaderSize } from './lib/layout.js';
import { HEADER_HEIGHTS } from './lib/ascii-art.js';

interface Props {
  cwd: string;
  onSelect?: (session: Session) => void;
}

export function App({ cwd, onSelect }: Props) {
  const { exit } = useApp();
  const { stdout } = useStdout();

  // Get terminal dimensions
  const width = stdout?.columns || 80;
  const height = stdout?.rows || 24;

  // Load sessions synchronously on first render to avoid race with crash
  const initialGroups = React.useMemo(() => loadAllSessions(cwd), [cwd]);

  // State
  const [allGroups, setAllGroups] = useState<SessionGroup[]>(initialGroups);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Session | null>(null);
  const [splitRatio, setSplitRatio] = useState(0.4);
  const [isDragging, setIsDragging] = useState(false);

  // Derived state
  const filteredGroups = filterSessions(allGroups, searchQuery, selectedTags);
  const allTags = getAllTags(allGroups);
  const totalSessions = getTotalSessions(filteredGroups);
  const selectedSession = getSessionAtIndex(filteredGroups, selectedIndex);

  // Layout calculations
  const layoutMode = getLayoutMode(width);
  const paneWidths = calculatePaneWidths(width, layoutMode, splitRatio);
  const isStacked = layoutMode === 'stacked';

  // Calculate content height (total - header - filter bar - keybindings)
  const headerSize = getHeaderSize(width);
  const headerHeight = HEADER_HEIGHTS[headerSize] + 1; // +1 for margin
  const filterBarHeight = 1;
  const keybindingsHeight = 1;
  const contentHeight = Math.max(1, height - headerHeight - filterBarHeight - keybindingsHeight - 1);

  // In stacked mode, split content height between list and preview
  const listHeight = isStacked ? Math.floor(contentHeight * 0.5) : contentHeight;
  const previewHeight = isStacked ? contentHeight - listHeight : contentHeight;

  // Keyboard handling
  useInput((input, key) => {
    // Handle delete confirmation
    if (confirmDelete) {
      if (input === 'y' || input === 'Y') {
        deleteSession(confirmDelete);
        setAllGroups(loadAllSessions(cwd));
        setConfirmDelete(null);
        if (selectedIndex >= totalSessions - 1) {
          setSelectedIndex(Math.max(0, selectedIndex - 1));
        }
      } else {
        setConfirmDelete(null);
      }
      return;
    }

    // Handle search mode
    if (isSearching) {
      if (key.escape) {
        setIsSearching(false);
        setSearchQuery('');
      }
      return; // TextInput handles other keys
    }

    // Normal mode
    if (key.upArrow || input === 'k') {
      setSelectedIndex(i => Math.max(0, i - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex(i => Math.min(totalSessions - 1, i + 1));
    } else if (key.return) {
      if (selectedSession && onSelect) {
        onSelect(selectedSession);
        exit();
      }
    } else if (input === '/') {
      setIsSearching(true);
    } else if (input === 't') {
      // Cycle through tags
      if (allTags.length > 0) {
        if (selectedTags.length === 0) {
          setSelectedTags([allTags[0]]);
        } else {
          const currentIdx = allTags.indexOf(selectedTags[0]);
          const nextIdx = (currentIdx + 1) % (allTags.length + 1);
          if (nextIdx === allTags.length) {
            setSelectedTags([]);
          } else {
            setSelectedTags([allTags[nextIdx]]);
          }
        }
        setSelectedIndex(0);
      }
    } else if (input === 'd') {
      if (selectedSession) {
        setConfirmDelete(selectedSession);
      }
    } else if (input === 'r' && isDevMode()) {
      const fixtures = loadFixtureSessions(FIXTURES_DIR);
      const fixtureGroup: SessionGroup = {
        label: 'Dev Fixtures',
        icon: '🧪',
        sessions: fixtures,
        isGlobal: false,
      };
      setAllGroups([fixtureGroup]);
      setSelectedIndex(0);
    } else if (input === 'q' || key.escape) {
      exit();
    }
  });

  // Handle search submit
  const handleSearchSubmit = () => {
    setIsSearching(false);
    setSelectedIndex(0);
  };

  // Delete confirmation overlay
  if (confirmDelete) {
    return (
      <ThemeProvider>
        <Box flexDirection="column" padding={1}>
          <Text color="red" bold>Delete session?</Text>
          <Text>{confirmDelete.title}</Text>
          <Text dimColor>{confirmDelete.path}</Text>
          <Box marginTop={1}>
            <Text>Press </Text>
            <Text color="red" bold>y</Text>
            <Text> to confirm, any other key to cancel</Text>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Box flexDirection="column" width={width} height={height}>
        {/* Header */}
        <Header width={width} />

        {/* Filter bar - full width below header */}
        <FilterBar
          tags={allTags}
          selectedTags={selectedTags}
          searchQuery={searchQuery}
          isSearching={isSearching}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          width={width}
        />

        {/* Main content */}
        <Box flexDirection={isStacked ? 'column' : 'row'} flexGrow={1}>
          {/* Session list */}
          <SessionList
            groups={filteredGroups}
            selectedIndex={selectedIndex}
            width={paneWidths.list}
            height={listHeight}
          />

          {/* Divider (side-by-side only) */}
          {!isStacked && (
            <Divider
              height={contentHeight}
              isDragging={isDragging}
              splitPercent={Math.round(splitRatio * 100)}
            />
          )}

          {/* Preview */}
          <Preview
            session={selectedSession}
            width={paneWidths.preview}
            height={previewHeight}
          />
        </Box>

        {/* Footer */}
        <Keybindings
          isSearching={isSearching}
          isDeleting={!!confirmDelete}
          currentIndex={selectedIndex}
          totalCount={totalSessions}
          width={width}
        />
      </Box>
    </ThemeProvider>
  );
}
