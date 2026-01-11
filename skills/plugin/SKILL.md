---
name: plugin
description: "Configure Blink settings for themes and animations"
allowed-tools: ["Bash(cat:*)", "Bash(jq:*)", "Bash(pnpm:*)", "Bash(mkdir:*)", "Read", "Write"]
---

# Blink Plugin Settings

Configure themes and animation effects for Blink's visual display.

## Interactive Mode

When the user runs `/plugin` with no arguments, launch the settings TUI:

```bash
cd ~/.claude/plugins/local/blink/cli/blink-tui && pnpm settings
```

Tell the user:

```
Launching Blink settings TUI...

Use arrow keys to navigate, Enter to select options.
Press q or Escape to exit.
```

The TUI provides:
- Theme selection (goth-whimsy, minimal, cyberpunk, ember)
- Animation toggles (cycling, wave, shimmer, breathing)
- Speed adjustment

## Inline Commands

For quick changes without launching the TUI:

### Set Theme

```
/plugin theme <name>
```

Available themes: `goth-whimsy`, `minimal`, `cyberpunk`, `ember`

To apply a theme:

1. Load current settings:
```bash
cat ~/.claude/plugins/blink/settings.json 2>/dev/null || echo '{}'
```

2. Get the preset colors and animation settings for the theme, then write the complete settings:

**goth-whimsy** (default):
```json
{
  "theme": "goth-whimsy",
  "colors": {
    "base": ["#5a189a", "#7b2cbf", "#c77dff"],
    "accent1": "#00ffff",
    "accent2": "#ff69b4",
    "accent3": "#ffd700"
  },
  "animation": {
    "speed": 250,
    "cycling": true,
    "wave": true,
    "shimmer": true,
    "breathing": true
  }
}
```

**minimal**:
```json
{
  "theme": "minimal",
  "colors": {
    "base": ["#374151", "#6b7280", "#9ca3af"],
    "accent1": "#3b82f6",
    "accent2": "#3b82f6",
    "accent3": "#3b82f6"
  },
  "animation": {
    "speed": 500,
    "cycling": true,
    "wave": false,
    "shimmer": false,
    "breathing": true
  }
}
```

**cyberpunk**:
```json
{
  "theme": "cyberpunk",
  "colors": {
    "base": ["#0f172a", "#312e81", "#06b6d4"],
    "accent1": "#00ffff",
    "accent2": "#ff00ff",
    "accent3": "#ff00ff"
  },
  "animation": {
    "speed": 150,
    "cycling": true,
    "wave": true,
    "shimmer": true,
    "breathing": true
  }
}
```

**ember**:
```json
{
  "theme": "ember",
  "colors": {
    "base": ["#7c2d12", "#c2410c", "#fb923c"],
    "accent1": "#fbbf24",
    "accent2": "#f97316",
    "accent3": "#fbbf24"
  },
  "animation": {
    "speed": 300,
    "cycling": true,
    "wave": true,
    "shimmer": false,
    "breathing": true
  }
}
```

3. Ensure directory exists and write:
```bash
mkdir -p ~/.claude/plugins/blink
```

4. Write the settings file using the Write tool to `~/.claude/plugins/blink/settings.json`

5. Confirm: `Theme set to [name]`

### Toggle Animation

```
/plugin animation.<effect> on|off
```

Available effects: `cycling`, `wave`, `shimmer`, `breathing`

To toggle an animation:

1. Load current settings:
```bash
cat ~/.claude/plugins/blink/settings.json 2>/dev/null || echo '{}'
```

2. Parse the current settings and update only the specified animation property

3. Write the updated settings

4. Confirm: `Animation [effect] turned [on/off]`

### Adjust Speed

```
/plugin speed <ms>
```

Speed is in milliseconds (lower = faster). Reasonable range: 100-1000ms.

1. Load current settings
2. Update `animation.speed` value
3. Write updated settings
4. Confirm: `Animation speed set to [ms]ms`

### Reset to Defaults

```
/plugin reset
```

1. Write the default goth-whimsy preset to settings.json
2. Confirm: `Settings reset to defaults (goth-whimsy theme)`

## Settings File Location

Settings are stored at: `~/.claude/plugins/blink/settings.json`

## Notes

- Changes take effect on the next Blink animation render
- The TUI provides live preview of changes
- Invalid theme names should fall back to goth-whimsy with a warning
