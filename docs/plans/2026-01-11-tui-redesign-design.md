# TUI Redesign - Design Document

## Overview

Comprehensive visual overhaul of the Blink TUI addressing layout balance, information density, visual hierarchy, and overall aesthetic. Adds responsive behavior, mouse support, and a dramatic warez-style ASCII header.

## Goals

1. **Layout balance** - Better pane proportions, no wasted space
2. **Information density** - Show more content, less chrome
3. **Visual hierarchy** - Clear scan path, differentiated regions
4. **Responsive** - Adapt to window resize, stack vertically when narrow
5. **Mouse support** - Click to select, drag to resize panes
6. **Dramatic header** - Warez NFO-style ASCII art with fire and all-seeing eye

## Layout Structure

### Wide Mode (≥60 columns)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              [HEADER]                                        │
│                      Eye + Flames + BLINK ASCII                              │
├─────────────────────────────────────────────────────────────────────────────┤
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░ [tag1] [tag2] [tag3] [+N more]                        / to search       ░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├──────────────────────────────┬──────────────────────────────────────────────┤
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│▓▓ SESSION LIST ▓▓▓▓▓▓▓▓▓▓▓▓▓▓│░░ PREVIEW PANE ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├──────────────────────────────┴──────────────────────────────────────────────┤
│  ↑↓ navigate   enter load   t tags   d delete   q quit                 1/7  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Narrow Mode (<60 columns)

```
┌─────────────────────────────────┐
│      [HEADER - minimal]         │
│     ░▒▓░ BLINK ░▓▒░             │
├─────────────────────────────────┤
│░░ [tag1] [tag2]   / search ░░░░│
├─────────────────────────────────┤
│▓▓ SESSION LIST ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓ ◆ saved ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓   • Session One ▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓   • Session Two ▓▓▓▓▓▓▓▓▓▓▓▓▓│
├─────────────────────────────────┤
│░░ PREVIEW ░░░░░░░░░░░░░░░░░░░░░│
│░░ Session Title ░░░░░░░░░░░░░░░│
│░░ Content here... ░░░░░░░░░░░░░│
├─────────────────────────────────┤
│  ↑↓  ⏎  t  d  q            1/7 │
└─────────────────────────────────┘
```

## Header Design

### Full Size (≥100 columns)

Warez NFO-style Block ASCII with:
- All-seeing eye centered at top (2/3 closed, sleepy)
- Flames rising on both sides
- Large block letters "BLINK"
- Wide aspect ratio spanning full terminal width

```
░░    ░░    ░░    ░░                     ◢▀▀▀▀▀▀▀◠●◠▀▀▀▀▀▀▀◣                     ░░    ░░    ░░    ░░
░▒▒░  ░▒▒░  ░▒▒░  ░▒▒░                   ◥▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄◤                   ░▒▒░  ░▒▒░  ░▒▒░  ░▒▒░
 ░▒▓▒░ ░▒▓▒░ ░▒▓▒░ ░▒▓▒░                                                    ░▒▓▒░ ░▒▓▒░ ░▒▓▒░ ░▒▓▒░
  ░▒▓▓▒░▒▓▓▒░▒▓▓▒░▒▓▓▒░     ██████╗ ██╗     ██╗███╗   ██╗██╗  ██╗     ░▒▓▓▒░▒▓▓▒░▒▓▓▒░▒▓▓▒░
                            ██╔══██╗██║     ██║████╗  ██║██║ ██╔╝
                            ██████╔╝██║     ██║██╔██╗ ██║█████╔╝
                            ██╔══██╗██║     ██║██║╚██╗██║██╔═██╗
                            ██████╔╝███████╗██║██║ ╚████║██║  ██╗
                            ╚═════╝ ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
```

### Medium Size (60-99 columns)

Simplified flames, smaller font, no eye:

```
░░  ░░  ░░                                                      ░░  ░░  ░░
░▒▓▒░▒▓▒░▒▓▒░   ██████╗ ██╗    ██╗███╗  ██╗██╗ ██╗   ░▒▓▒░▒▓▒░▒▓▒░
                ██████╔╝██║    ██║██╔██╗██║████╔╝
                ██████╔╝██████╗██║██║╚████║██║╚██╗
```

### Minimal (<60 columns)

Single line, wide aspect:

```
░▒▓░░▒▓░  ▄▀ BLINK ▀▄  ░▓▒░░▓▒░
```

### Header Animation

| Effect | Behavior |
|--------|----------|
| Flames | Colors cycle upward: dark red → red → orange → yellow at tips |
| BLINK letters | Slow purple gradient sweep left-to-right |
| Eye blink | Every 8-10s, lid closes over ~1s, pauses, reopens |
| Eye pupil | Subtle drift left/right occasionally |

Animation interval: 100ms for smooth flame movement.

## Background Hierarchy

Differentiate UI regions with background shades:

| Region | Background | Hex |
|--------|------------|-----|
| Session list | Darkest | `#1a1a1a` |
| Preview pane | Medium | `#2a2a2a` |
| Filter bar | Lighter | `#3a3a3a` |
| Header/footer | Terminal default | transparent |

## Component Details

### Session List

```
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
▓▓ ◆ saved                   ▓▓
▓▓   Session Title One       ▓▓
▓▓ ● Session Title Two       ▓▓  ← selected
▓▓   Session With Long Na... ▓▓
▓▓                           ▓▓
▓▓ ◆ restarts                ▓▓
▓▓   Another Session         ▓▓
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
```

- Group headers: accent color, `◆` marker
- Unselected: dimmed white
- Selected: `●` bullet, bright text, lighter background
- Truncation: ellipsis `...`, never mid-word
- Mouse: click to select, double-click to load

### Preview Pane

```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░  Session Title Here                   ░░
░░  saved · 2 hours ago                  ░░
░░                                       ░░
░░  [oss]  [github]  [documentation]     ░░
░░                                       ░░
░░  ─────────────────────────────────    ░░
░░                                       ░░
░░  working on                           ░░
░░  Building the Blink session...        ░░
░░                                       ░░
░░  status                               ░░
░░  Phase 3 TUI is functional...         ░░
░░                                       ░░
░░  next steps                           ░░
░░  • Test TUI interactively             ░░
░░  • Proceed to Phase 4                 ░░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

- Title: accent color, slow cycling animation
- Metadata: dimmed
- Tags: pill-style, shimmer occasionally
- Section headers: dimmed, lowercase
- Body: normal brightness, proper word-wrap
- Scroll indicator on right edge when content overflows

### Filter Bar

```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░  [oss]  [github]  [docs]  [+3 more]                       / to search    ░░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

When searching:
```
░░  [oss]  [github]  [docs]                            search: query█       ░░
```

- Tags: left-aligned, `[+N more]` for overflow
- Search: right-aligned, `█` cursor pulses at 500ms
- Active tag: bright text, accent background
- Real-time filtering as you type

### Keybindings Footer

```
  ↑↓ navigate   enter load   t tags   d delete   q quit                    1/7
```

- Single line, no background
- Keys: accent color (`↑↓`, `enter`, `t`, `d`, `q`)
- Labels: dimmed
- Position indicator: right-aligned (`1/7`)
- Context-aware: changes for search mode, delete confirmation
- Responsive: abbreviate or show keys only when narrow

## Responsive Behavior

### Breakpoints

| Width | Layout | Header |
|-------|--------|--------|
| ≥100 | Side-by-side | Full (eye + flames + BLINK) |
| 60-99 | Side-by-side | Medium (flames + BLINK) |
| <60 | Stacked vertical | Minimal (single line) |

### Resize Handling

- Listen for `stdout` resize events
- Re-render immediately on dimension change
- Debounce at 16ms (60fps)
- Memoize ASCII art, recalculate only on breakpoint change

### Stacked Mode (<60 cols)

- List: top ~40% of height
- Preview: bottom ~60% of height
- Filter bar: full width at top
- Keybindings: full width at bottom

## Mouse Support

### Interactions

| Target | Click | Double-click | Drag |
|--------|-------|--------------|------|
| Session | Select | Load | - |
| Tag | Toggle filter | - | - |
| Divider | - | - | Resize panes |

### Divider

```
│   ← default (subtle)
┃   ← hover (accent color)
┃ 45%  ← dragging (shows percentage)
```

- Min pane width: 20 columns
- Shift+click: reset to default 40/60 split
- Persists until page reload

### Caveats

Mouse mode interferes with terminal text selection. Hold Shift to select text.

## Animation Timing

| Effect | Interval | Duration |
|--------|----------|----------|
| Flame cycle | 100ms | Continuous |
| BLINK gradient | 100ms | 4s full cycle |
| Eye blink | - | Every 8-10s, ~1s duration |
| Cursor pulse | 500ms | On/off toggle |
| Tag shimmer | 250ms | Random, low probability |

## Technical Notes

### New Dependencies

None required - uses existing Ink capabilities.

### Performance

- Single `setInterval` at 100ms for all animations
- Memoize expensive calculations (ASCII art, color interpolation)
- Debounce resize events

### Files to Modify

| File | Changes |
|------|---------|
| `src/app.tsx` | Layout restructure, resize listener, mouse mode |
| `src/components/Header.tsx` | Complete rewrite - ASCII art, responsive |
| `src/components/SessionList.tsx` | Background styling, mouse click |
| `src/components/Preview.tsx` | Background styling, scroll indicator |
| `src/components/FilterBar.tsx` | Move to top, pulsing cursor |
| `src/components/Keybindings.tsx` | Simplify to single line |

### New Files

| File | Purpose |
|------|---------|
| `src/lib/ascii-art.ts` | Header ASCII art strings for each breakpoint |
| `src/components/Divider.tsx` | Draggable pane divider |
