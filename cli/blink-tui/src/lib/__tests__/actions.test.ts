// ABOUTME: Tests for TUI action helpers (editor and clipboard resolution)
// ABOUTME: Pure command-resolution logic for the o/y keybindings (issue #65)

import { describe, it, expect } from 'vitest';
import { resolveEditorCommand, resolveClipboardCommand, buildEditorInvocation } from '../actions.js';

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

describe('buildEditorInvocation', () => {
  it('separates the editor command from its flags', () => {
    const { cmd, args } = buildEditorInvocation('code -w', '/tmp/session.md');
    expect(cmd).toBe('code');
    expect(args).toEqual(['-w', '/tmp/session.md']);
  });

  it('handles a bare editor with no flags', () => {
    const { cmd, args } = buildEditorInvocation('vim', '/tmp/session.md');
    expect(cmd).toBe('vim');
    expect(args).toEqual(['/tmp/session.md']);
  });

  it('keeps a malicious path as a single untouched argv element (no shell parsing)', () => {
    // A snapshot filename is attacker-influenceable; it must never be split or
    // interpreted. It stays the last, verbatim array element.
    const evil = '/tmp/$(rm -rf ~); touch pwned.md';
    const { cmd, args } = buildEditorInvocation('code -w', evil);
    expect(cmd).toBe('code');
    expect(args).toEqual(['-w', evil]);
    expect(args[args.length - 1]).toBe(evil);
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
