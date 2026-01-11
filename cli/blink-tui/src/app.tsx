// ABOUTME: Main App component for Blink TUI
// ABOUTME: Manages state, keyboard input, and overall layout

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { Header } from './components/Header.js';
import { SessionList, getTotalSessions, getSessionAtIndex } from './components/SessionList.js';
import { Preview } from './components/Preview.js';
import { FilterBar } from './components/FilterBar.js';
import { Keybindings } from './components/Keybindings.js';
import { loadAllSessions, filterSessions, getAllTags, deleteSession } from './lib/sessions.js';
import { SessionGroup, Session } from './lib/types.js';

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
  
  // State
  const [allGroups, setAllGroups] = useState<SessionGroup[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Session | null>(null);
  
  // Load sessions on mount
  useEffect(() => {
    const groups = loadAllSessions(cwd);
    setAllGroups(groups);
  }, [cwd]);
  
  // Derived state
  const filteredGroups = filterSessions(allGroups, searchQuery, selectedTags);
  const allTags = getAllTags(allGroups);
  const totalSessions = getTotalSessions(filteredGroups);
  const selectedSession = getSessionAtIndex(filteredGroups, selectedIndex);
  
  // Layout calculations
  const listWidth = Math.floor(width * 0.4);
  const previewWidth = width - listWidth - 3; // 3 for border
  
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
    );
  }
  
  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* Header */}
      <Header />
      
      {/* Main content */}
      <Box flexGrow={1}>
        {/* Left pane - session list */}
        <Box flexDirection="column" width={listWidth} borderStyle="single" borderRight>
          <SessionList
            groups={filteredGroups}
            selectedIndex={selectedIndex}
            width={listWidth - 2}
          />
          
          {/* Filter bar at bottom of left pane */}
          <Box marginTop="auto">
            <FilterBar
              tags={allTags}
              selectedTags={selectedTags}
              searchQuery={searchQuery}
              isSearching={isSearching}
              onSearchChange={setSearchQuery}
              onSearchSubmit={handleSearchSubmit}
            />
          </Box>
        </Box>
        
        {/* Right pane - preview */}
        <Preview session={selectedSession} width={previewWidth} />
      </Box>
      
      {/* Footer */}
      <Keybindings isSearching={isSearching} />
    </Box>
  );
}
