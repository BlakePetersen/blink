// ABOUTME: Tests for TUI action helpers (editor and clipboard resolution)
// ABOUTME: Pure command-resolution logic for the o/y keybindings (issue #65)

import { describe, it, expect } from 'vitest';
import { resolveEditorCommand, resolveClipboardCommand } from '../actions.js';

describe('resolveEditorCommand', () => {
  it('prefers VISUAL over EDITOR', () => {
    expect(resolveEditorCommand({ VISUAL: 'code -w', EDITOR: 'vim' })).toBe('code -w');
  });

  it('falls back to EDITOR when VISUAL is unset', () => {
    expect(resolveEditorCommand({ EDITOR: 'nano' })).toBe('nano');
  });

  it('returns null when neither is set', () => {
    expect(resolveEditorCommand({})).toBeNull();
  });

  it('ignores empty-string values', () => {
    expect(resolveEditorCommand({ VISUAL: '', EDITOR: 'vim' })).toBe('vim');
  });
});

describe('resolveClipboardCommand', () => {
  it('uses pbcopy on macOS', () => {
    expect(resolveClipboardCommand('darwin')).toEqual(['pbcopy']);
  });

  it('uses clip on Windows', () => {
    expect(resolveClipboardCommand('win32')).toEqual(['clip']);
  });

  it('uses xclip on Linux', () => {
    expect(resolveClipboardCommand('linux')).toEqual(['xclip', '-selection', 'clipboard']);
  });
});
