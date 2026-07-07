// ABOUTME: Session loading and management for Blink TUI
// ABOUTME: Handles filesystem operations and frontmatter parsing

import {
  readFileSync,
  readdirSync,
  existsSync,
  unlinkSync,
  statSync,
  writeFileSync,
  mkdirSync,
  renameSync,
} from 'fs';
import { join, basename, dirname } from 'path';
import matter from 'gray-matter';
import { Session, SessionGroup, ParseError, ParseResult } from './types.js';
import { config, getProjectPaths } from './config.js';

// Resolve a session's created date, tolerating malformed frontmatter values.
// An unparseable `created:` yields an Invalid Date (getTime() === NaN), which
// poisons sort comparators and date formatting, so fall back to the file's
// mtime and finally the epoch. See issue #38.
function resolveCreatedDate(rawCreated: unknown, filePath: string): Date {
  if (rawCreated !== undefined && rawCreated !== null) {
    const parsed = new Date(rawCreated as string | number);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  try {
    return statSync(filePath).mtime;
  } catch {
    return new Date(0);
  }
}

// Force the YAML engine and disable eval-capable engines. A snapshot file's
// own fence token (e.g. `---js`) would otherwise select gray-matter's
// `javascript` engine and eval its frontmatter. See advisory GHSA-57fp-36cq-pwwp.
const SECURE_MATTER_OPTIONS: matter.GrayMatterOption<string, object> = {
  language: 'yaml',
  engines: {
    javascript: () => {
      throw new Error('JavaScript frontmatter is disabled');
    },
    js: () => {
      throw new Error('JavaScript frontmatter is disabled');
    },
  },
};

export function parseSession(filePath: string): ParseResult {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const { data, content: body } = matter(content, SECURE_MATTER_OPTIONS);

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
        tags: Array.isArray(data.tags) ? data.tags : [],
        created: resolveCreatedDate(data.created, filePath),
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

export interface SessionUpdate {
  title?: string;
  tags?: string[];
}

// Rewrite a snapshot's frontmatter in place, updating only the provided fields
// and preserving the body verbatim. Sessions are otherwise immutable after
// save; this backs the TUI rename/retag actions (issue #60).
export function updateSession(filePath: string, updates: SessionUpdate): boolean {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const { data, content: body } = matter(raw, SECURE_MATTER_OPTIONS);

    const nextData: Record<string, unknown> = { ...data };
    if (updates.title !== undefined) nextData.title = updates.title;
    if (updates.tags !== undefined) nextData.tags = updates.tags;

    writeFileSync(filePath, matter.stringify(body, nextData), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export type ArchiveResult =
  | { ok: true; dest: string }
  | { ok: false; reason: string };

// Move a snapshot into a sibling `archived/` directory, mirroring
// scripts/archive-snapshot.sh so the resume hook stops surfacing it while the
// file survives. Never clobbers an existing archived copy of the same name.
export function archiveSession(session: Session): ArchiveResult {
  try {
    const sourceDir = dirname(session.path);
    const name = basename(session.path);
    const archiveDir = join(sourceDir, 'archived');
    mkdirSync(archiveDir, { recursive: true });

    let dest = join(archiveDir, name);
    if (existsSync(dest)) {
      dest = join(archiveDir, `${name.replace(/\.md$/, '')}-${Date.now()}.md`);
    }

    renameSync(session.path, dest);
    return { ok: true, dest };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
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

        // Search filter — spans the full snapshot content (title, working-on,
        // status, tags, next steps, files, and context) so identifying text
        // anywhere in the body is reachable (issue #61).
        if (query) {
          const searchable = [
            session.title,
            session.workingOn,
            session.status,
            ...session.tags,
            ...(session.nextSteps ?? []),
            ...(session.files ?? []),
            session.context,
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
