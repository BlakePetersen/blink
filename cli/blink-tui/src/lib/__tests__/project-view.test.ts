// ABOUTME: Tests for project labelling and view-mode group filtering
// ABOUTME: Covers projectLabel display and filterByViewMode project/global/all

import { describe, it, expect } from 'vitest';
import { projectLabel, filterByViewMode, cycleViewMode } from '../project-view.js';
import { Session, SessionGroup, ViewMode } from '../types.js';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    path: '/tmp/x.md',
    title: 'Untitled',
    tags: [],
    created: new Date('2026-01-01'),
    project: '',
    type: 'saved',
    ...overrides,
  };
}

function makeGroup(sessions: Session[], overrides: Partial<SessionGroup> = {}): SessionGroup {
  return { label: 'saved', icon: '☽', sessions, isGlobal: false, ...overrides };
}

describe('projectLabel', () => {
  it('returns the basename of an absolute project path', () => {
    expect(projectLabel('/Users/dev/webapp')).toBe('webapp');
  });

  it('ignores a trailing slash', () => {
    expect(projectLabel('/Users/dev/webapp/')).toBe('webapp');
  });

  it('returns an empty string for an empty path', () => {
    expect(projectLabel('')).toBe('');
  });

  it('returns the path itself when it has no separator', () => {
    expect(projectLabel('webapp')).toBe('webapp');
  });
});

describe('filterByViewMode', () => {
  const here = '/Users/dev/webapp';
  const other = '/Users/dev/other';

  const groups: SessionGroup[] = [
    makeGroup([
      makeSession({ path: '/a.md', project: here }),
      makeSession({ path: '/b.md', project: other }),
    ]),
    makeGroup(
      [
        makeSession({ path: '/c.md', project: other }),
        makeSession({ path: '/d.md', project: here }),
      ],
      { label: 'saved (global)', isGlobal: true }
    ),
  ];

  it('project mode keeps only sessions originating from the current project', () => {
    const result = filterByViewMode(groups, 'project', here);
    const paths = result.flatMap(g => g.sessions.map(s => s.path));
    expect(paths.sort()).toEqual(['/a.md', '/d.md']);
  });

  it('global mode keeps only sessions from other projects', () => {
    const result = filterByViewMode(groups, 'global', here);
    const paths = result.flatMap(g => g.sessions.map(s => s.path));
    expect(paths.sort()).toEqual(['/b.md', '/c.md']);
  });

  it('all mode keeps every session', () => {
    const result = filterByViewMode(groups, 'all', here);
    const paths = result.flatMap(g => g.sessions.map(s => s.path));
    expect(paths.sort()).toEqual(['/a.md', '/b.md', '/c.md', '/d.md']);
  });

  it('drops groups left empty by the filter', () => {
    const localOnly: SessionGroup[] = [
      makeGroup([makeSession({ path: '/a.md', project: here })]),
    ];
    expect(filterByViewMode(localOnly, 'global', here)).toEqual([]);
  });

  it('treats a session with no project as global (not the current project)', () => {
    const g = [makeGroup([makeSession({ path: '/a.md', project: '' })])];
    expect(filterByViewMode(g, 'project', here)).toEqual([]);
    expect(filterByViewMode(g, 'global', here).flatMap(x => x.sessions)).toHaveLength(1);
  });
});

describe('cycleViewMode', () => {
  it('cycles all -> project -> global -> all', () => {
    let mode: ViewMode = 'all';
    const seen: ViewMode[] = [];
    for (let i = 0; i < 4; i++) {
      seen.push(mode);
      mode = cycleViewMode(mode);
    }
    expect(seen).toEqual(['all', 'project', 'global', 'all']);
  });
});
