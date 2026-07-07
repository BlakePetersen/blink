// ABOUTME: Pure helpers for multi-project awareness in the session browser
// ABOUTME: Project labelling and view-mode filtering by originating project (#58)

import { SessionGroup, ViewMode } from './types.js';

// Short, human-readable label for a project path: its final path segment.
// Tolerates a trailing slash and paths without a separator; empty in → empty out.
export function projectLabel(projectPath: string): string {
  if (!projectPath) return '';
  const trimmed = projectPath.replace(/\/+$/, '');
  const segment = trimmed.split('/').pop() ?? '';
  return segment || trimmed;
}

// Cycle order for the view-mode toggle: all → project → global → all.
const VIEW_MODE_ORDER: ViewMode[] = ['all', 'project', 'global'];

export function cycleViewMode(mode: ViewMode): ViewMode {
  const next = (VIEW_MODE_ORDER.indexOf(mode) + 1) % VIEW_MODE_ORDER.length;
  return VIEW_MODE_ORDER[next];
}

// Restrict groups to the sessions that belong in the given view mode, keyed on
// each session's originating `project` frontmatter. Groups left empty are
// dropped, mirroring filterSessions so the list never renders a bare header.
export function filterByViewMode(
  groups: SessionGroup[],
  mode: ViewMode,
  currentProject: string
): SessionGroup[] {
  if (mode === 'all') return groups;

  return groups
    .map(group => ({
      ...group,
      sessions: group.sessions.filter(session => {
        const isCurrent = session.project === currentProject;
        return mode === 'project' ? isCurrent : !isCurrent;
      }),
    }))
    .filter(group => group.sessions.length > 0);
}
