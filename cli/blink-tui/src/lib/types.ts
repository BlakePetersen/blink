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

// Which sessions the browser shows, by originating project (issue #58).
// 'project' = this project only, 'global' = other projects only, 'all' = both.
export type ViewMode = 'project' | 'global' | 'all';

export interface ParseError {
  file: string;
  reason: string;
}

export type ParseResult =
  | { ok: true; session: Session }
  | { ok: false; reason: string };
