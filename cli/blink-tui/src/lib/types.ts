// ABOUTME: Type definitions for Blink TUI
// ABOUTME: Defines Session, Tag, and related interfaces

export interface Session {
  path: string;
  title: string;
  tags: string[];
  created: Date;
  project: string;
  type: 'restart' | 'saved';
  workingOn?: string;
  status?: string;
  nextSteps?: string[];
  files?: string[];
  context?: string;
}

export interface SessionGroup {
  label: string;
  icon: string;
  sessions: Session[];
  isGlobal: boolean;
}

export type ViewMode = 'project' | 'global' | 'all';

export interface AppState {
  groups: SessionGroup[];
  selectedIndex: number;
  viewMode: ViewMode;
  searchQuery: string;
  selectedTags: string[];
  isSearching: boolean;
}
