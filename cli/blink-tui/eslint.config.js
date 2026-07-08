// ABOUTME: ESLint flat config for the Blink TUI.
// ABOUTME: Small, pragmatic ruleset aligned to the existing functional TS/React style.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // JSX runtime is react-jsx; React need not be in scope.
      'react/react-in-jsx-scope': 'off',
      // TS types cover prop validation; runtime propTypes are not used.
      'react/prop-types': 'off',
      // Missing hook deps are worth surfacing but not build-breaking for a small TUI.
      'react-hooks/exhaustive-deps': 'warn',
      // Allow intentionally-unused args/vars prefixed with underscore.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // This TUI intentionally matches terminal control characters (e.g. \x00,
      // ANSI escapes) in regexes, so flagging them is noise rather than signal.
      'no-control-regex': 'off',
    },
  },
);
