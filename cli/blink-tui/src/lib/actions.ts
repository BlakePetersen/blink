// ABOUTME: Pure command-resolution helpers for TUI restore-adjacent actions
// ABOUTME: Resolves the editor (o) and clipboard (y) commands (issue #65)

// Resolve the user's preferred editor command, honoring VISUAL over EDITOR the
// way most Unix tooling does. Empty strings are ignored. Returns null when no
// editor is configured so the caller can fall back gracefully.
export function resolveEditorCommand(env: NodeJS.ProcessEnv): string | null {
  const visual = env.VISUAL?.trim();
  if (visual) return visual;
  const editor = env.EDITOR?.trim();
  if (editor) return editor;
  return null;
}

// Resolve the platform's clipboard command (argv form). The caller pipes the
// path to stdin. Linux assumes xclip; callers fall back to printing on failure.
export function resolveClipboardCommand(platform: NodeJS.Platform): string[] {
  switch (platform) {
    case 'darwin':
      return ['pbcopy'];
    case 'win32':
      return ['clip'];
    default:
      return ['xclip', '-selection', 'clipboard'];
  }
}
