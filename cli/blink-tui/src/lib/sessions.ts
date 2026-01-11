// ABOUTME: Session loading and management for Blink TUI
// ABOUTME: Handles filesystem operations and frontmatter parsing

import { readFileSync, readdirSync, existsSync, unlinkSync } from 'fs';
import { join, basename } from 'path';
import matter from 'gray-matter';
import { Session, SessionGroup } from './types.js';
import { config, getProjectPaths } from './config.js';

function parseSession(filePath: string): Session | null {
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
    };
  } catch {
    return null;
  }
}

function loadSessionsFromDir(dirPath: string, type: 'saved' | 'restart'): Session[] {
  if (!existsSync(dirPath)) return [];
  
  try {
    const files = readdirSync(dirPath).filter(f => f.endsWith('.md'));
    return files
      .map(f => parseSession(join(dirPath, f)))
      .filter((s): s is Session => s !== null)
      .map(s => ({ ...s, type }))
      .sort((a, b) => b.created.getTime() - a.created.getTime());
  } catch {
    return [];
  }
}

export function loadAllSessions(cwd: string): SessionGroup[] {
  const projectPaths = getProjectPaths(cwd);
  const groups: SessionGroup[] = [];
  
  // Project saved
  const projectSaved = loadSessionsFromDir(projectPaths.saved, 'saved');
  if (projectSaved.length > 0) {
    groups.push({
      label: 'saved',
      icon: '☽',
      sessions: projectSaved,
      isGlobal: false,
    });
  }
  
  // Project restarts
  const projectRestarts = loadSessionsFromDir(projectPaths.restarts, 'restart');
  if (projectRestarts.length > 0) {
    groups.push({
      label: 'restarts',
      icon: '↻',
      sessions: projectRestarts,
      isGlobal: false,
    });
  }
  
  // Global saved
  const globalSaved = loadSessionsFromDir(config.globalPaths.saved, 'saved');
  if (globalSaved.length > 0) {
    groups.push({
      label: 'saved (global)',
      icon: '☽',
      sessions: globalSaved,
      isGlobal: true,
    });
  }
  
  // Global restarts
  const globalRestarts = loadSessionsFromDir(config.globalPaths.restarts, 'restart');
  if (globalRestarts.length > 0) {
    groups.push({
      label: 'restarts (global)',
      icon: '↻',
      sessions: globalRestarts,
      isGlobal: true,
    });
  }
  
  return groups;
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
