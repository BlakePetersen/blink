# Phase 4: Polish - Design Document

## Overview

Add animated header gradients, a cohesive "goth-whimsy" color scheme, subtle effects throughout the TUI, and a customizable settings system via `/plugin` command.

## Animation System

Four layered effects combine into a cohesive whole:

### Layer 1: Color Cycling (Base)
The gradient shifts through a purple-dominant palette (deep purple → violet → magenta → back). This is the constant "heartbeat" cycling every ~3-4 seconds.

### Layer 2: Wave
A brightness wave moves left-to-right across elements, making characters glow slightly brighter as it passes. One wave every ~2 seconds, offset from color cycle for organic feel.

### Layer 3: Shimmer
Random characters occasionally sparkle brighter for a single frame. Sparse - 1-2 characters per update. Adds life without chaos.

### Layer 4: Breathing
Global subtle brightness pulse on a slow ~4 second cycle. Barely perceptible but adds depth.

### Implementation
Single `setInterval` at ~250ms calculates all effect states based on elapsed time. Each effect has its own timing so they layer naturally rather than feeling mechanical.

## Color Palette & Themes

### Default "Goth-Whimsy" Palette
- **Base gradient:** Deep purple (#5a189a) → violet (#7b2cbf) → magenta (#c77dff)
- **Accent 1:** Electric cyan - selection highlights
- **Accent 2:** Hot pink - active states
- **Accent 3:** Gold - special markers (icons, emphasis)
- **Neutral:** Dark grays for borders/muted text, soft white for primary text

### Preset Themes
| Theme | Description |
|-------|-------------|
| `goth-whimsy` | Default - deep purples with cyan/pink/gold pops |
| `minimal` | Grayscale with single accent, subtle/slow animations |
| `cyberpunk` | Cyan/magenta dominant, faster animations, high contrast |
| `ember` | Deep reds/oranges/golds, warm and moody |

### Settings Structure
```json
{
  "theme": "goth-whimsy",
  "colors": {
    "base": ["#5a189a", "#7b2cbf", "#c77dff"],
    "accent1": "cyan",
    "accent2": "magenta",
    "accent3": "gold"
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

Presets populate all values, which users can then customize.

## Settings System

### Storage
`~/.claude/plugins/blink/settings.json` - created with defaults on first run.

### /plugin Command

**Inline mode (quick changes):**
```
/plugin theme cyberpunk
/plugin animation.shimmer off
/plugin colors.accent1 "#00ffff"
/plugin reset
```

**TUI mode (`/plugin` with no args):**
```
┌─ Blink Settings ─────────────────────────┐
│                                          │
│  Theme: [goth-whimsy ▼]                  │
│                                          │
│  ─── Colors ───                          │
│  Accent 1: cyan                          │
│  Accent 2: magenta                       │
│  Accent 3: gold                          │
│                                          │
│  ─── Animation ───                       │
│  Speed: [balanced ▼]                     │
│  [✓] Color cycling                       │
│  [✓] Wave                                │
│  [✓] Shimmer                             │
│  [✓] Breathing                           │
│                                          │
│  [Save]  [Reset to defaults]  [Cancel]   │
└──────────────────────────────────────────┘
```

Arrow keys navigate, space toggles checkboxes, enter on dropdowns opens options.

## Effect Distribution

### Header (Full Animation)
All four layers active at full intensity. The header is the "star" of the show.

### Strategic Subtle Effects Elsewhere

| Element | Effect | Notes |
|---------|--------|-------|
| Selected session | Breathing glow | Gentle pulse on highlight |
| Preview title | Slow color cycling | ~6-8s cycle, much slower than header |
| Tags | Shimmer | Occasional random sparkle when idle |
| Group icons | Breathing | In sync with header |
| Active filter/search | Soft pulse | Steady when typing |
| Borders | Wave | Subtle ambient light traveling around frame |

### Hierarchy Principles
1. Header is most prominent - most active, most visible
2. Other elements are supporting cast - effects 50-75% slower/subtler
3. Interactive elements get more life than static ones
4. Nothing competes for attention - effects enhance, don't distract

All effects respect toggle settings globally.

## Implementation

### New Files
| File | Purpose |
|------|---------|
| `src/lib/theme.ts` | Theme context, color definitions, presets |
| `src/lib/animation.ts` | Animation engine (timing, effect calculations) |
| `src/lib/settings.ts` | Load/save settings from config file |
| `src/components/SettingsTUI.tsx` | Interactive settings interface |
| `skills/plugin/SKILL.md` | Skill definition for /plugin command |

### Modified Files
| File | Changes |
|------|---------|
| `src/app.tsx` | Wrap in ThemeProvider, add animation interval |
| `src/components/Header.tsx` | Apply animated gradient |
| `src/components/*.tsx` | Apply theme colors and subtle effects |

### Animation Engine
- Single `useEffect` with `setInterval` at configured speed
- Calculates all effect states based on `Date.now()`
- Pure functions make effects deterministic and testable

### Graceful Degradation
If terminal doesn't support 256 colors, fall back to basic ANSI colors. Animation still works with fewer color steps.

## Technical Notes

- Animation updates at ~250ms (configurable via speed setting)
- Use `chalk` for color output with hex color support
- React context (`ThemeContext`) provides colors/settings to all components
- Settings changes trigger re-render with new theme
