// ABOUTME: Main App component for Blink TUI
// ABOUTME: Manages state, keyboard input, and responsive layout

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { Header } from './components/Header.js';
import { ThemeProvider } from './lib/theme.js';
import { SettingsTUI } from './components/SettingsTUI.js';
import { loadSettings, saveSettings } from './lib/settings.js';
import { SessionList, buildListItems } from './components/SessionList.js';
import { Preview } from './components/Preview.js';
import { FilterBar } from './components/FilterBar.js';
import { Keybindings } from './components/Keybindings.js';
import { Divider } from './components/Divider.js';
import { loadAllSessions, filterSessions, getAllTags, deleteSession, loadFixtureSessions } from './lib/sessions.js';
import { SessionGroup, Session, ParseError } from './lib/types.js';
import { isDevMode } from './lib/dev-mode.js';
import { FIXTURES_DIR } from './lib/__fixtures__/index.js';
import { getLayoutMode, calculatePaneWidths, getHeaderSize } from './lib/layout.js';
import { clampIndex } from './lib/list-view.js';
import { HEADER_HEIGHTS } from './lib/ascii-art.js';
import { useTerminalSize } from './lib/useTerminalSize.js';

interface Props {
  cwd: string;
  onSelect?: (session: Session) => void;
}

export function App({ cwd, onSelect }: Props) {
  const { exit } = useApp();
  const { stdout } = useStdout();

  // Track terminal dimensions and reflow on resize, independent of animation
  const { width, height } = useTerminalSize(stdout);

  // Load sessions synchronously on first render to avoid race with crash
  const initial = React.useMemo(() => loadAllSessions(cwd), [cwd]);

  // State
  const [allGroups, setAllGroups] = useState<SessionGroup[]>(initial.groups);
  const [parseErrors, setParseErrors] = useState<ParseError[]>(initial.parseErrors);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Session | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  // Fixed split ratio until drag-to-resize is implemented
  const splitRatio = 0.4;

  // Derived state
  const filteredGroups = filterSessions(allGroups, searchQuery, selectedTags);
  const allTags = getAllTags(allGroups);
  // Parse errors are always shown (not subject to search/tag filtering) so
  // unreadable files never silently disappear.
  const listItems = buildListItems(filteredGroups, parseErrors);
  const totalSessions = listItems.length;
  const selectedItem = listItems[selectedIndex] ?? null;
  const selectedSession = selectedItem?.kind === 'session' ? selectedItem.session : null;
  const selectedError = selectedItem?.kind === 'error' ? selectedItem.error : null;
  const hasAnySessions = allGroups.some(group => group.sessions.length > 0);
  const hasActiveFilter = searchQuery.length > 0 || selectedTags.length > 0;

  // Keep the selection in range when a live filter shrinks the list, otherwise
  // getSessionAtIndex returns null and the preview blanks out (issue #45).
  useEffect(() => {
    setSelectedIndex(i => clampIndex(totalSessions, i));
  }, [totalSessions]);

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
    // While the settings overlay is open it owns keyboard input.
    if (showSettings) {
      return;
    }

    // Handle delete confirmation
    if (confirmDelete) {
      if (input === 'y' || input === 'Y') {
        const deleted = deleteSession(confirmDelete);
        if (!deleted) {
          // Delete failed (e.g. unwritable file). Surface it and leave the
          // list and selection untouched (issue #47).
          setDeleteError(`Could not delete "${confirmDelete.title}"`);
          setConfirmDelete(null);
          return;
        }
        const reloaded = loadAllSessions(cwd);
        setAllGroups(reloaded.groups);
        setParseErrors(reloaded.parseErrors);
        setConfirmDelete(null);
        setDeleteError(null);
        if (selectedIndex >= totalSessions - 1) {
          setSelectedIndex(Math.max(0, selectedIndex - 1));
        }
      } else {
        setConfirmDelete(null);
      }
      return;
    }

    // Any keypress in normal mode dismisses a stale delete-error line.
    if (deleteError) {
      setDeleteError(null);
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
    } else if (input === 's') {
      setShowSettings(true);
    } else if (input === 'r' && isDevMode()) {
      const fixtures = loadFixtureSessions(FIXTURES_DIR);
      const fixtureGroup: SessionGroup = {
        label: 'Dev Fixtures',
        icon: '🧪',
        sessions: fixtures,
        isGlobal: false,
      };
      setAllGroups([fixtureGroup]);
      setParseErrors([]);
      setSelectedIndex(0);
    } else if (key.escape) {
      // esc clears any active filter first; only quits from a clean state so a
      // reflexive second esc after leaving search does not lose context (#46).
      if (hasActiveFilter) {
        setSearchQuery('');
        setSelectedTags([]);
        setSelectedIndex(0);
      } else {
        exit();
      }
    } else if (input === 'q') {
      exit();
    }
  });

  // Handle search submit
  const handleSearchSubmit = () => {
    setIsSearching(false);
    setSelectedIndex(0);
  };

  // Settings overlay (reachable via the `s` key from the browser)
  if (showSettings) {
    return (
      <ThemeProvider>
        <SettingsTUI
          initialSettings={loadSettings()}
          onSave={(next) => {
            saveSettings(next);
            setShowSettings(false);
          }}
          onCancel={() => setShowSettings(false)}
          standalone={false}
        />
      </ThemeProvider>
    );
  }

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
            parseErrors={parseErrors}
            selectedIndex={selectedIndex}
            width={paneWidths.list}
            height={listHeight}
            hasAnySessions={hasAnySessions}
            searchQuery={searchQuery}
          />

          {/* Divider (side-by-side only) */}
          {!isStacked && (
            <Divider height={contentHeight} />
          )}

          {/* Preview */}
          <Preview
            session={selectedSession}
            parseError={selectedError}
            width={paneWidths.preview}
            height={previewHeight}
          />
        </Box>

        {/* Transient delete-failure notice */}
        {deleteError && (
          <Text color="red">{deleteError}</Text>
        )}

        {/* Footer */}
        <Keybindings
          isSearching={isSearching}
          currentIndex={selectedIndex}
          totalCount={totalSessions}
          width={width}
        />
      </Box>
    </ThemeProvider>
  );
}
