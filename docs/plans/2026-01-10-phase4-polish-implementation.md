# Phase 4: Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add animated header gradients, goth-whimsy theming, subtle UI effects, and customizable settings via /plugin command.

**Architecture:** Settings stored in ~/.claude/plugins/blink/settings.json, loaded at startup. ThemeContext provides colors to all components. Animation engine runs single interval calculating effect states from elapsed time. /plugin skill launches settings TUI or handles inline commands.

**Tech Stack:** React/Ink, chalk (hex colors), TypeScript, Vitest

---

## Task 1: Settings Types and Defaults

**Files:**
- Create: `cli/blink-tui/src/lib/settings.ts`
- Create: `cli/blink-tui/src/lib/__tests__/settings.test.ts`

**Step 1: Write failing test for settings types**

Create `cli/blink-tui/src/lib/__tests__/settings.test.ts`:
```typescript
// ABOUTME: Tests for settings loading, saving, and defaults
// ABOUTME: Validates theme presets and settings persistence

import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS, THEME_PRESETS } from '../settings.js';

describe('settings', () => {
  describe('DEFAULT_SETTINGS', () => {
    it('has goth-whimsy as default theme', () => {
      expect(DEFAULT_SETTINGS.theme).toBe('goth-whimsy');
    });

    it('has all animation options enabled by default', () => {
      expect(DEFAULT_SETTINGS.animation.cycling).toBe(true);
      expect(DEFAULT_SETTINGS.animation.wave).toBe(true);
      expect(DEFAULT_SETTINGS.animation.shimmer).toBe(true);
      expect(DEFAULT_SETTINGS.animation.breathing).toBe(true);
    });

    it('has balanced animation speed', () => {
      expect(DEFAULT_SETTINGS.animation.speed).toBe(250);
    });
  });

  describe('THEME_PRESETS', () => {
    it('includes all four preset themes', () => {
      expect(THEME_PRESETS).toHaveProperty('goth-whimsy');
      expect(THEME_PRESETS).toHaveProperty('minimal');
      expect(THEME_PRESETS).toHaveProperty('cyberpunk');
      expect(THEME_PRESETS).toHaveProperty('ember');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL - cannot find module

**Step 3: Implement settings types and defaults**

Create `cli/blink-tui/src/lib/settings.ts` with:
- AnimationSettings interface (speed, cycling, wave, shimmer, breathing)
- ColorSettings interface (base array, accent1/2/3)
- Settings interface combining theme name, colors, animation
- THEME_PRESETS object with goth-whimsy, minimal, cyberpunk, ember
- DEFAULT_SETTINGS using goth-whimsy preset
- loadSettings() - reads from settings file, returns defaults if missing
- saveSettings() - writes to settings file, creates directory if needed
- applyPreset() - returns settings for a preset name

**Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS

**Step 5: Commit**

Message: `feat: add settings system with theme presets`

---

## Task 2: Animation Engine

**Files:**
- Create: `cli/blink-tui/src/lib/animation.ts`
- Modify: `cli/blink-tui/src/lib/__tests__/settings.test.ts`

**Step 1: Write failing tests for animation calculations**

Add tests for:
- calculateCyclePosition(elapsed, duration) - returns 0-1 based on time
- calculateWavePosition(elapsed, duration, width) - returns 0-1 for wave
- calculateBreathPhase(elapsed, duration) - returns 0.7-1.0 brightness
- shouldShimmer(charIndex, elapsed, probability) - deterministic sparkle
- interpolateColor(colors[], position) - blend between gradient colors

**Step 2: Run test to verify it fails**

Expected: FAIL - cannot find module

**Step 3: Implement animation engine**

Create `cli/blink-tui/src/lib/animation.ts` with:
- Pure functions for each effect calculation
- hexToRgb and rgbToHex helpers for color math
- AnimationState interface combining all effect values
- calculateAnimationState() returning complete state from elapsed time

**Step 4: Run tests to verify they pass**

Expected: PASS

**Step 5: Commit**

Message: `feat: add animation engine with effect calculations`

---

## Task 3: Theme Context

**Files:**
- Create: `cli/blink-tui/src/lib/theme.tsx`

**Step 1: Create theme context**

Create `cli/blink-tui/src/lib/theme.tsx` with:
- ThemeContextValue interface (settings, animationState, updateSettings, setTheme)
- ThemeContext created with createContext
- ThemeProvider component:
  - Loads settings on mount
  - Runs animation interval at configured speed
  - Provides updateSettings and setTheme callbacks
  - Auto-saves on changes
- useTheme hook for consuming context

**Step 2: Run tests**

Expected: PASS (existing tests still work)

**Step 3: Commit**

Message: `feat: add ThemeContext for settings and animation state`

---

## Task 4: Animated Header Component

**Files:**
- Modify: `cli/blink-tui/src/components/Header.tsx`
- Modify: `cli/blink-tui/src/app.tsx`

**Step 1: Update Header with animation**

Modify Header.tsx to:
- Import useTheme and animation helpers
- Split LOGO into individual characters
- Apply effects per character:
  - Base color from cycling gradient position
  - Wave brightening when wave passes over character
  - Random shimmer to white
  - Breathing brightness adjustment
- Use useMemo for performance

**Step 2: Wrap App in ThemeProvider**

Modify app.tsx to:
- Import ThemeProvider
- Wrap entire return JSX in ThemeProvider

**Step 3: Build to verify**

Run: `pnpm build`
Expected: Success

**Step 4: Commit**

Message: `feat: add animated header with all four effects`

---

## Task 5: Apply Theme Colors to Components

**Files:**
- Modify: `cli/blink-tui/src/components/SessionList.tsx`
- Modify: `cli/blink-tui/src/components/Preview.tsx`
- Modify: `cli/blink-tui/src/components/FilterBar.tsx`
- Modify: `cli/blink-tui/src/components/Keybindings.tsx`

**Step 1: Update each component**

For each component:
- Import useTheme
- Replace hardcoded colors with theme colors
- Add subtle effects where appropriate:
  - SessionList: breathing on selected item
  - Preview: slow cycling on title, shimmer on tags
  - FilterBar: pulse on active filter
  - Keybindings: accent color on key letters

**Step 2: Build and test**

Run: `pnpm build`
Expected: Success

**Step 3: Commit**

Message: `feat: apply theme colors and subtle effects to all components`

---

## Task 6: Settings TUI Component

**Files:**
- Create: `cli/blink-tui/src/components/SettingsTUI.tsx`
- Create: `cli/blink-tui/src/settings-app.tsx`
- Create: `cli/blink-tui/src/settings-index.tsx`
- Modify: `cli/blink-tui/package.json`

**Step 1: Create Settings TUI component**

Create SettingsTUI.tsx with:
- Props: initialSettings, onSave, onCancel
- State: current settings, focus index
- Navigation: arrow keys move focus, space/enter activates
- UI sections: Theme dropdown, Colors, Animation toggles, Action buttons
- Actions: cycle theme, toggle animations, save, reset, cancel

**Step 2: Create settings app entry points**

Create settings-app.tsx wrapping SettingsTUI
Create settings-index.tsx as CLI entry point

**Step 3: Add settings script**

Add to package.json: `"settings": "tsx src/settings-index.tsx"`

**Step 4: Build and test**

Run: `pnpm build`
Expected: Success

**Step 5: Commit**

Message: `feat: add Settings TUI for theme customization`

---

## Task 7: /plugin Skill Definition

**Files:**
- Create: `skills/plugin/SKILL.md`
- Create: `commands/blink-plugin.md`

**Step 1: Create plugin skill**

Create SKILL.md documenting:
- Interactive mode (no args) launches settings TUI
- Inline commands: theme, animation toggles, reset
- Examples of each command type

**Step 2: Create command file**

Create blink-plugin.md linking to skill

**Step 3: Commit**

Message: `feat: add /plugin skill for settings management`

---

## Task 8: Final Integration and Testing

**Files:**
- Modify: `cli/blink-tui/package.json`

**Step 1: Add settings binary**

Add to bin section: `"blink-settings": "dist/settings-index.js"`

**Step 2: Build everything**

Run: `pnpm build`

**Step 3: Run all tests**

Run: `pnpm test`

**Step 4: Manual testing**

- Run TUI with animated header
- Load fixtures with R key
- Run settings TUI
- Change and persist theme

**Step 5: Final commit**

Message: `feat: complete Phase 4 polish implementation`

**Step 6: Push**

Run: `git push`

---

## Summary

8 tasks delivering:
1. Settings system with 4 theme presets
2. Animation engine with pure functions
3. ThemeContext for state management
4. Animated header with layered effects
5. Themed components with subtle animations
6. Settings TUI for customization
7. /plugin skill for CLI access
8. Full integration and testing
