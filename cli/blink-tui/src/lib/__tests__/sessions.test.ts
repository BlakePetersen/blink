// ABOUTME: Tests for session loading and parsing logic
// ABOUTME: Validates frontmatter parsing, filtering, and edge cases

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, utimesSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  loadFixtureSessions,
  loadSessionsFromDir,
  parseSession,
  filterSessions,
  getAllTags,
} from '../sessions.js';
import { Session, SessionGroup } from '../types.js';
import { FIXTURES_DIR } from '../__fixtures__/index.js';

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

declare global {
  // eslint-disable-next-line no-var
  var __blink_rce_probe: boolean | undefined;
}

describe('parseSession frontmatter security', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'blink-rce-'));
    globalThis.__blink_rce_probe = false;
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    delete globalThis.__blink_rce_probe;
  });

  it('does not execute JavaScript frontmatter payloads', () => {
    // A snapshot file whose fence selects gray-matter's `javascript` engine.
    // If that engine runs, the body is eval'd and the probe flips to true.
    const malicious = [
      '---js',
      'globalThis.__blink_rce_probe = true;',
      "module.exports = { title: 'pwned' };",
      '---',
      '# Body',
    ].join('\n');
    const file = join(dir, 'malicious.md');
    writeFileSync(file, malicious, 'utf-8');

    // Must not throw uncaught; parseSession swallows the error into a failed
    // ParseResult rather than executing the payload.
    const result = parseSession(file);

    expect(globalThis.__blink_rce_probe).toBe(false);
    expect(result.ok).toBe(false);
  });

  it('still parses normal YAML frontmatter', () => {
    const yaml = [
      '---',
      'title: Real Session',
      'tags:',
      '  - alpha',
      '  - beta',
      'created: 2026-01-01',
      '---',
      '# Body',
    ].join('\n');
    const file = join(dir, 'valid.md');
    writeFileSync(file, yaml, 'utf-8');

    const result = parseSession(file);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.title).toBe('Real Session');
      expect(result.session.tags).toEqual(['alpha', 'beta']);
    }
  });
});

describe('loadFixtureSessions', () => {
  it('loads all fixture sessions', () => {
    const sessions = loadFixtureSessions(FIXTURES_DIR);
    expect(sessions.length).toBeGreaterThanOrEqual(7);
  });

  it('parses session titles correctly', () => {
    const sessions = loadFixtureSessions(FIXTURES_DIR);
    const titles = sessions.map(s => s.title);
    expect(titles).toContain('Quick fix');
    expect(titles).toContain('Authentication System Overhaul - OAuth2 + PKCE Implementation');
  });

  it('parses session tags correctly', () => {
    const sessions = loadFixtureSessions(FIXTURES_DIR);
    const authSession = sessions.find(s => s.title.includes('OAuth2'));
    expect(authSession?.tags).toContain('auth');
    expect(authSession?.tags).toContain('security');
  });

  it('handles sessions with special characters in title', () => {
    const sessions = loadFixtureSessions(FIXTURES_DIR);
    const specialSession = sessions.find(s => s.title.includes('quotes'));
    expect(specialSession).toBeDefined();
    expect(specialSession?.title).toContain('"quotes"');
  });
});

describe('loadSessionsFromDir parse errors', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'blink-sessions-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('loads valid sessions while collecting parse errors for malformed files', () => {
    writeFileSync(
      join(dir, 'good.md'),
      '---\ntitle: Good Session\ncreated: 2026-01-01\n---\n## Working On\nStuff\n'
    );
    writeFileSync(
      join(dir, 'bad.md'),
      '---\ntitle: "unterminated\ncreated: 2026-01-01\n---\nbody\n'
    );

    const { sessions, parseErrors } = loadSessionsFromDir(dir, 'saved');

    expect(sessions.map(s => s.title)).toContain('Good Session');
    expect(sessions).toHaveLength(1);
    expect(parseErrors).toHaveLength(1);
    expect(parseErrors[0].file).toContain('bad.md');
    expect(parseErrors[0].reason).toBeTruthy();
  });

  it('returns empty results for a directory that does not exist', () => {
    const { sessions, parseErrors } = loadSessionsFromDir(
      join(dir, 'nope'),
      'saved'
    );
    expect(sessions).toEqual([]);
    expect(parseErrors).toEqual([]);
  });

  it('reports no parse errors when all files are valid', () => {
    writeFileSync(
      join(dir, 'a.md'),
      '---\ntitle: A\ncreated: 2026-01-02\n---\n## Status\nok\n'
    );
    writeFileSync(
      join(dir, 'b.md'),
      '---\ntitle: B\ncreated: 2026-01-03\n---\n## Status\nok\n'
    );

    const { sessions, parseErrors } = loadSessionsFromDir(dir, 'saved');
    expect(sessions).toHaveLength(2);
    expect(parseErrors).toEqual([]);
  });
});

describe('parseSession field parsing', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'blink-parse-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns a failed ParseResult for malformed frontmatter', () => {
    const file = join(dir, 'bad.md');
    writeFileSync(file, '---\ntitle: "unterminated\ncreated: 2026-01-01\n---\nbody\n');

    const result = parseSession(file);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBeTruthy();
    }
  });

  it('falls back to defaults for missing fields', () => {
    const file = join(dir, 'sparse.md');
    writeFileSync(file, '---\n---\n# Body only\n');

    const result = parseSession(file);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.title).toBe('sparse');
      expect(result.session.tags).toEqual([]);
      expect(result.session.project).toBe('');
      expect(result.session.type).toBe('saved');
    }
  });

  it('coerces a scalar tags value to an empty array (never per-character)', () => {
    // frontmatter `tags: foo` parses as a string; iterating it as characters
    // would leak per-letter tags into getAllTags (issue #38).
    const file = join(dir, 'scalar-tags.md');
    writeFileSync(file, '---\ntitle: Scalar\ntags: foo\ncreated: 2026-01-01\n---\nbody\n');

    const result = parseSession(file);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.isArray(result.session.tags)).toBe(true);
      expect(result.session.tags).toEqual([]);
    }
  });

  it('produces a valid Date when created is not a parseable date', () => {
    // `new Date('not-a-date')` is Invalid Date; getTime() is NaN, which poisons
    // sort comparators and date formatting (issue #38).
    const file = join(dir, 'bad-date.md');
    writeFileSync(file, '---\ntitle: BadDate\ncreated: not-a-date\n---\nbody\n');

    const result = parseSession(file);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Number.isNaN(result.session.created.getTime())).toBe(false);
    }
  });
});

describe('loadSessionsFromDir sorting with invalid dates', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'blink-sort-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('sorts deterministically when a created date is invalid', () => {
    const good = join(dir, 'good.md');
    const bad = join(dir, 'bad.md');
    writeFileSync(good, '---\ntitle: Good\ncreated: 2020-06-01\n---\nbody\n');
    writeFileSync(bad, '---\ntitle: Bad\ncreated: not-a-date\n---\nbody\n');
    // Bad falls back to file mtime; pin it after Good's created date so the
    // ordering is stable rather than driven by NaN comparisons.
    utimesSync(bad, new Date('2021-01-01'), new Date('2021-01-01'));

    const { sessions } = loadSessionsFromDir(dir, 'saved');

    expect(sessions.map(s => s.title)).toEqual(['Bad', 'Good']);
    for (const session of sessions) {
      expect(Number.isNaN(session.created.getTime())).toBe(false);
    }
  });
});

describe('getAllTags', () => {
  it('returns a deduplicated, sorted list across groups', () => {
    const groups = [
      makeGroup([
        makeSession({ tags: ['beta', 'alpha'] }),
        makeSession({ tags: ['alpha', 'gamma'] }),
      ]),
      makeGroup([makeSession({ tags: ['beta'] })], { label: 'restarts' }),
    ];

    expect(getAllTags(groups)).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('returns an empty array when no sessions have tags', () => {
    const groups = [makeGroup([makeSession(), makeSession()])];
    expect(getAllTags(groups)).toEqual([]);
  });
});

describe('filterSessions', () => {
  const groups = [
    makeGroup([
      makeSession({ title: 'OAuth login flow', tags: ['auth'], workingOn: 'PKCE' }),
      makeSession({ title: 'Fix parser', tags: ['bug'], status: 'reviewing tests' }),
    ]),
    makeGroup([makeSession({ title: 'Deploy pipeline', tags: ['ci', 'auth'] })], {
      label: 'restarts',
    }),
  ];

  it('returns all groups unchanged for an empty query and no tags', () => {
    const result = filterSessions(groups, '', []);
    expect(result).toHaveLength(2);
    expect(result[0].sessions).toHaveLength(2);
    expect(result[1].sessions).toHaveLength(1);
  });

  it('matches a substring across title, workingOn, status, and tags', () => {
    expect(filterSessions(groups, 'oauth', []).flatMap(g => g.sessions.map(s => s.title))).toEqual([
      'OAuth login flow',
    ]);
    expect(filterSessions(groups, 'pkce', []).flatMap(g => g.sessions.map(s => s.title))).toEqual([
      'OAuth login flow',
    ]);
    expect(
      filterSessions(groups, 'reviewing', []).flatMap(g => g.sessions.map(s => s.title))
    ).toEqual(['Fix parser']);
    expect(filterSessions(groups, 'bug', []).flatMap(g => g.sessions.map(s => s.title))).toEqual([
      'Fix parser',
    ]);
  });

  it('filters by a single selected tag and drops emptied groups', () => {
    const result = filterSessions(groups, '', ['auth']);
    expect(result.flatMap(g => g.sessions.map(s => s.title))).toEqual([
      'OAuth login flow',
      'Deploy pipeline',
    ]);
  });

  it('treats multiple selected tags as a union (OR)', () => {
    const result = filterSessions(groups, '', ['bug', 'ci']);
    expect(result.flatMap(g => g.sessions.map(s => s.title))).toEqual([
      'Fix parser',
      'Deploy pipeline',
    ]);
  });

  it('combines tag and query filters', () => {
    const result = filterSessions(groups, 'deploy', ['auth']);
    expect(result.flatMap(g => g.sessions.map(s => s.title))).toEqual(['Deploy pipeline']);
  });

  it('returns no groups when nothing matches', () => {
    expect(filterSessions(groups, 'nonexistent', [])).toEqual([]);
  });
});
