// ABOUTME: Catppuccin Mocha theme configuration for Blink TUI
// ABOUTME: Provides consistent color palette and ink-ui theme customization

import { extendTheme, defaultTheme } from '@inkjs/ui';

// Catppuccin Mocha palette
// https://github.com/catppuccin/catppuccin
export const mocha = {
  // Base colors
  base: '#1e1e2e',
  mantle: '#181825',
  crust: '#11111b',

  // Surface colors
  surface0: '#313244',
  surface1: '#45475a',
  surface2: '#585b70',

  // Overlay colors
  overlay0: '#6c7086',
  overlay1: '#7f849c',
  overlay2: '#9399b2',

  // Text colors
  text: '#cdd6f4',
  subtext0: '#a6adc8',
  subtext1: '#bac2de',

  // Accent colors
  rosewater: '#f5e0dc',
  flamingo: '#f2cdcd',
  pink: '#f5c2e7',
  mauve: '#cba6f7',
  red: '#f38ba8',
  maroon: '#eba0ac',
  peach: '#fab387',
  yellow: '#f9e2af',
  green: '#a6e3a1',
  teal: '#94e2d5',
  sky: '#89dceb',
  sapphire: '#74c7ec',
  blue: '#89b4fa',
  lavender: '#b4befe',
} as const;

// Semantic color mappings for the TUI
export const colors = {
  // Primary accent (used for selection, highlights)
  primary: mocha.mauve,
  primaryDim: mocha.overlay1,

  // Secondary accent (used for tags, badges)
  secondary: mocha.pink,

  // Status colors
  success: mocha.green,
  warning: mocha.yellow,
  error: mocha.red,
  info: mocha.blue,

  // Text hierarchy
  text: mocha.text,
  textMuted: mocha.subtext0,
  textDim: mocha.overlay1,

  // Backgrounds
  bg: mocha.base,
  bgAlt: mocha.surface0,
  bgHighlight: mocha.surface1,

  // Borders
  border: mocha.surface1,
  borderFocus: mocha.mauve,
} as const;

// Extended ink-ui theme with Catppuccin colors
export const theme = extendTheme(defaultTheme, {
  components: {
    Spinner: {
      styles: {
        frame: () => ({
          color: mocha.mauve,
        }),
      },
    },
    Select: {
      styles: {
        focusIndicator: () => ({
          color: mocha.mauve,
        }),
        label: ({ isFocused }: { isFocused: boolean }) => ({
          color: isFocused ? mocha.text : mocha.subtext0,
          bold: isFocused,
        }),
        highlightedLabel: () => ({
          color: mocha.mauve,
          bold: true,
        }),
      },
    },
    TextInput: {
      styles: {
        value: () => ({
          color: mocha.text,
        }),
        placeholder: () => ({
          color: mocha.overlay1,
        }),
        cursor: () => ({
          color: mocha.mauve,
        }),
      },
    },
    Badge: {
      styles: {
        container: ({ color }: { color?: string }) => ({
          color: color || mocha.mauve,
        }),
      },
    },
    StatusMessage: {
      config: () => ({
        colorByVariant: {
          success: mocha.green,
          error: mocha.red,
          warning: mocha.yellow,
          info: mocha.blue,
        },
      }),
    },
    Alert: {
      config: () => ({
        colorByVariant: {
          success: mocha.green,
          error: mocha.red,
          warning: mocha.yellow,
          info: mocha.blue,
        },
      }),
    },
  },
});

export type Theme = typeof theme;
