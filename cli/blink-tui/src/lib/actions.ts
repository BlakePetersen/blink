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

export interface EditorInvocation {
  cmd: string;
  args: string[];
}

// Split a resolved editor command ("code -w") into an argv-safe invocation and
// append the snapshot path as its own literal element. The path is NEVER
// concatenated into a shell string: filenames are attacker-influenceable (a
// cloned repo can ship a snapshot named `$(...).md`), so the caller must spawn
// without a shell to avoid command injection (RCE).
export function buildEditorInvocation(editor: string, path: string): EditorInvocation {
  const [cmd, ...args] = editor.split(' ').filter(Boolean);
  return { cmd, args: [...args, path] };
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
