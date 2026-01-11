// ABOUTME: Detects if TUI is running in development mode
// ABOUTME: Dev mode enables fixture loading and debug keybindings

export function isDevMode(): boolean {
  const devFlag = process.env.BLINK_DEV;
  return devFlag === '1' || devFlag === 'true';
}
