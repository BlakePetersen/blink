// ABOUTME: Main App component for Blink TUI
// ABOUTME: Manages state, keyboard input, and responsive layout

import React, { useState, useEffect } from 'react';
import { spawnSync } from 'child_process';
import { Box, Text, useInput, useApp, useStdout, useStdin } from 'ink';
import TextInput from 'ink-text-input';
import { Header } from './components/Header.js';
import { ThemeProvider } from './lib/theme.js';
import { SettingsTUI } from './components/SettingsTUI.js';
import { loadSettings, saveSettings } from './lib/settings.js';
import { SessionList, buildListItems } from './components/SessionList.js';
import { Preview } from './components/Preview.js';
import { FilterBar } from './components/FilterBar.js';
import { Keybindings } from './components/Keybindings.js';
import { Divider } from './components/Divider.js';
import {
  loadAllSessions,
  filterSessions,
  getAllTags,
  deleteSession,
  updateSession,
  archiveSession,
  loadFixtureSessions,
} from './lib/sessions.js';
import { cycleTag } from './lib/tag-filter.js';
import { resolveEditorCommand, resolveClipboardCommand, buildEditorInvocation } from './lib/actions.js';
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
  const { setRawMode } = useStdin();

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
  // Rename/retag text-input prompt (issue #60) and transient action feedback.
  const [promptMode, setPromptMode] = useState<'rename' | 'retag' | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  // Whether the list is currently showing dev fixtures instead of real data.
  const [showingFixtures, setShowingFixtures] = useState(false);
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

  // Reload real sessions from disk, leaving any fixture view behind.
  const reload = () => {
    const reloaded = loadAllSessions(cwd);
    setAllGroups(reloaded.groups);
    setParseErrors(reloaded.parseErrors);
    setShowingFixtures(false);
  };

  // Copy a snapshot path to the system clipboard, falling back to surfacing the
  // path in the footer so it can be selected manually (issue #65).
  const copyPath = (path: string) => {
    const [cmd, ...args] = resolveClipboardCommand(process.platform);
    const result = spawnSync(cmd, args, { input: path });
    if (!result.error && result.status === 0) {
      setActionMessage('Copied path to clipboard');
    } else {
      setActionMessage(path);
    }
  };

  // Open a snapshot in $EDITOR, suspending Ink's raw mode for the duration so
  // the child owns the terminal, then reload in case it was edited (issue #65).
  const openInEditor = (path: string) => {
    const editor = resolveEditorCommand(process.env);
    if (!editor) {
      setActionMessage('No $EDITOR set');
      return;
    }
    try {
      setRawMode?.(false);
      // Spawn without a shell and pass the path as a literal argv element so an
      // attacker-influenceable snapshot filename can never be shell-interpreted.
      const { cmd, args } = buildEditorInvocation(editor, path);
      const result = spawnSync(cmd, args, { stdio: 'inherit' });
      if (result.error) {
        setActionMessage('Could not open editor');
      }
    } catch {
      setActionMessage('Could not open editor');
    } finally {
      setRawMode?.(true);
      reload();
    }
  };

  // Persist the rename/retag prompt (issue #60).
  const handlePromptSubmit = () => {
    if (!selectedSession || !promptMode) {
      setPromptMode(null);
      setPromptValue('');
      return;
    }
    const updates =
      promptMode === 'rename'
        ? { title: promptValue.trim() }
        : { tags: promptValue.split(',').map(t => t.trim()).filter(Boolean) };
    if (updateSession(selectedSession.path, updates)) {
      reload();
    } else {
      setActionMessage(`Could not update "${selectedSession.title}"`);
    }
    setPromptMode(null);
    setPromptValue('');
  };

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

    // Handle rename/retag prompt: TextInput owns typing/submit; esc cancels.
    if (promptMode) {
      if (key.escape) {
        setPromptMode(null);
        setPromptValue('');
      }
      return;
    }

    // Any keypress in normal mode dismisses a stale transient notice.
    if (deleteError) {
      setDeleteError(null);
    }
    if (actionMessage) {
      setActionMessage(null);
    }

    // Handle search mode. esc leaves the input but keeps the applied filter so
    // a partial search isn't destroyed by exiting (issue #69).
    if (isSearching) {
      if (key.escape) {
        setIsSearching(false);
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
      // Cycle the active tag forward (none → first → … → last → none).
      if (allTags.length > 0) {
        setSelectedTags(prev => cycleTag(allTags, prev, 'forward'));
        setSelectedIndex(0);
      }
    } else if (input === 'T') {
      // Cycle the active tag backward (issue #52).
      if (allTags.length > 0) {
        setSelectedTags(prev => cycleTag(allTags, prev, 'backward'));
        setSelectedIndex(0);
      }
    } else if (input === 'd') {
      if (selectedSession) {
        setConfirmDelete(selectedSession);
      }
    } else if (input === 's') {
      setShowSettings(true);
    } else if (input === 'n') {
      if (selectedSession) {
        setPromptMode('rename');
        setPromptValue(selectedSession.title);
      }
    } else if (input === 'e') {
      if (selectedSession) {
        setPromptMode('retag');
        setPromptValue(selectedSession.tags.join(', '));
      }
    } else if (input === 'a') {
      if (selectedSession) {
        const result = archiveSession(selectedSession);
        if (result.ok) {
          reload();
          setSelectedIndex(i => Math.max(0, Math.min(i, totalSessions - 2)));
          setActionMessage(`Archived "${selectedSession.title}"`);
        } else {
          setActionMessage(`Could not archive "${selectedSession.title}"`);
        }
      }
    } else if (input === 'y') {
      if (selectedSession) {
        copyPath(selectedSession.path);
      }
    } else if (input === 'o') {
      if (selectedSession) {
        openInEditor(selectedSession.path);
      }
    } else if (input === 'r' && isDevMode()) {
      // Toggle between dev fixtures and real data (issue #69).
      if (showingFixtures) {
        reload();
        setSelectedIndex(0);
      } else {
        const fixtures = loadFixtureSessions(FIXTURES_DIR);
        const fixtureGroup: SessionGroup = {
          label: 'Dev Fixtures',
          icon: '🧪',
          sessions: fixtures,
          isGlobal: false,
        };
        setAllGroups([fixtureGroup]);
        setParseErrors([]);
        setShowingFixtures(true);
        setSelectedIndex(0);
      }
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

  // Rename/retag prompt overlay
  if (promptMode) {
    const isRename = promptMode === 'rename';
    return (
      <ThemeProvider>
        <Box flexDirection="column" padding={1}>
          <Text bold>{isRename ? 'Rename session' : 'Edit tags (comma-separated)'}</Text>
          {selectedSession && <Text dimColor>{selectedSession.path}</Text>}
          <Box marginTop={1}>
            <Text>{isRename ? 'title: ' : 'tags: '}</Text>
            <TextInput
              value={promptValue}
              onChange={setPromptValue}
              onSubmit={handlePromptSubmit}
              showCursor
            />
          </Box>
          <Box marginTop={1}>
            <Text dimColor>enter to save, esc to cancel</Text>
          </Box>
        </Box>
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

        {/* Transient action feedback (archive / copy / editor) */}
        {actionMessage && (
          <Text dimColor>{actionMessage}</Text>
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
