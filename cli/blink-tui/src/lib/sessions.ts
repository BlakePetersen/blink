// ABOUTME: Session loading and management for Blink TUI
// ABOUTME: Handles filesystem operations and frontmatter parsing

import { readFileSync, readdirSync, existsSync, unlinkSync } from 'fs';
import { join, basename } from 'path';
import matter from 'gray-matter';
import { Session, SessionGroup, ParseError, ParseResult } from './types.js';
import { config, getProjectPaths } from './config.js';

export function parseSession(filePath: string): ParseResult {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const { data, content: body } = matter(content);

    // Extract sections from body
    const workingOnMatch = body.match(/## Working On\n([\s\S]*?)(?=\n##|$)/);
    const statusMatch = body.match(/## Status\n([\s\S]*?)(?=\n##|$)/);
    const nextStepsMatch = body.match(/## Next Steps\n([\s\S]*?)(?=\n##|$)/);
    const filesMatch = body.match(/## Files Involved\n([\s\S]*?)(?=\n##|$)/);
    const contextMatch = body.match(/## Context\n([\s\S]*?)(?=\n##|$)/);
    
    // Parse next steps as array
    const nextSteps = nextStepsMatch?.[1]
      ?.split('\n')
      .filter(line => line.match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim()) || [];
    
    // Parse files as array
    const files = filesMatch?.[1]
      ?.split('\n')
      .filter(line => line.match(/^[-*]/))
      .map(line => line.replace(/^[-*]\s*/, '').trim()) || [];
    
    return {
      ok: true,
      session: {
        path: filePath,
        title: data.title || basename(filePath, '.md'),
        tags: data.tags || [],
        created: new Date(data.created || 0),
        project: data.project || '',
        type: data.type || 'saved',
        workingOn: workingOnMatch?.[1]?.trim(),
        status: statusMatch?.[1]?.trim(),
        nextSteps,
        files,
        context: contextMatch?.[1]?.trim(),
      },
    };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

export interface DirLoadResult {
  sessions: Session[];
  parseErrors: ParseError[];
}

export function loadSessionsFromDir(
  dirPath: string,
  type: 'saved' | 'restart'
): DirLoadResult {
  if (!existsSync(dirPath)) return { sessions: [], parseErrors: [] };

  let files: string[];
  try {
    files = readdirSync(dirPath).filter(f => f.endsWith('.md'));
  } catch (err) {
    // The directory itself is unreadable; surface it as a single error.
    const reason = err instanceof Error ? err.message : String(err);
    return { sessions: [], parseErrors: [{ file: dirPath, reason }] };
  }

  const sessions: Session[] = [];
  const parseErrors: ParseError[] = [];

  for (const f of files) {
    const filePath = join(dirPath, f);
    const result = parseSession(filePath);
    if (result.ok) {
      sessions.push({ ...result.session, type });
    } else {
      parseErrors.push({ file: filePath, reason: result.reason });
    }
  }

  sessions.sort((a, b) => b.created.getTime() - a.created.getTime());
  return { sessions, parseErrors };
}

export interface LoadResult {
  groups: SessionGroup[];
  parseErrors: ParseError[];
}

export function loadAllSessions(cwd: string): LoadResult {
  const projectPaths = getProjectPaths(cwd);
  const groups: SessionGroup[] = [];
  const parseErrors: ParseError[] = [];

  const sources: Array<{
    dir: string;
    type: 'saved' | 'restart';
    label: string;
    icon: string;
    isGlobal: boolean;
  }> = [
    { dir: projectPaths.saved, type: 'saved', label: 'saved', icon: '☽', isGlobal: false },
    { dir: projectPaths.restarts, type: 'restart', label: 'restarts', icon: '↻', isGlobal: false },
    { dir: config.globalPaths.saved, type: 'saved', label: 'saved (global)', icon: '☽', isGlobal: true },
    { dir: config.globalPaths.restarts, type: 'restart', label: 'restarts (global)', icon: '↻', isGlobal: true },
  ];

  for (const source of sources) {
    const { sessions, parseErrors: errors } = loadSessionsFromDir(source.dir, source.type);
    parseErrors.push(...errors);
    if (sessions.length > 0) {
      groups.push({
        label: source.label,
        icon: source.icon,
        sessions,
        isGlobal: source.isGlobal,
      });
    }
  }

  return { groups, parseErrors };
}

export function deleteSession(session: Session): boolean {
  try {
    unlinkSync(session.path);
    return true;
  } catch {
    return false;
  }
}

export function getAllTags(groups: SessionGroup[]): string[] {
  const tags = new Set<string>();
  for (const group of groups) {
    for (const session of group.sessions) {
      for (const tag of session.tags) {
        tags.add(tag);
      }
    }
  }
  return Array.from(tags).sort();
}

export function filterSessions(
  groups: SessionGroup[],
  searchQuery: string,
  selectedTags: string[]
): SessionGroup[] {
  const query = searchQuery.toLowerCase();

  return groups
    .map(group => ({
      ...group,
      sessions: group.sessions.filter(session => {
        // Tag filter
        if (selectedTags.length > 0) {
          if (!selectedTags.some(tag => session.tags.includes(tag))) {
            return false;
          }
        }

        // Search filter
        if (query) {
          const searchable = [
            session.title,
            session.workingOn,
            session.status,
            ...session.tags,
          ].filter(Boolean).join(' ').toLowerCase();

          if (!searchable.includes(query)) {
            return false;
          }
        }

        return true;
      }),
    }))
    .filter(group => group.sessions.length > 0);
}

export function loadFixtureSessions(fixturesDir: string): Session[] {
  if (!existsSync(fixturesDir)) return [];

  try {
    const files = readdirSync(fixturesDir).filter(f => f.endsWith('.md'));
    return files
      .map(f => parseSession(join(fixturesDir, f)))
      .filter((r): r is Extract<ParseResult, { ok: true }> => r.ok)
      .map(r => r.session)
      .sort((a, b) => b.created.getTime() - a.created.getTime());
  } catch {
    return [];
  }
}
