// ABOUTME: Footer component showing available keyboard shortcuts
// ABOUTME: Displays key letters with accent color from theme

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { isDevMode } from '../lib/dev-mode.js';
import { useTheme } from '../lib/theme.js';

interface Props {
  isSearching: boolean;
}

interface KeyBinding {
  key: string;
  label: string;
}

function KeyBindingDisplay({ bindings, accentColor }: { bindings: KeyBinding[], accentColor: string }) {
  return (
    <>
      {bindings.map((binding, i) => (
        <React.Fragment key={binding.key}>
          {i > 0 && <Text dimColor>  </Text>}
          <Text color={accentColor}>{binding.key}</Text>
          <Text dimColor> {binding.label}</Text>
        </React.Fragment>
      ))}
    </>
  );
}

export function Keybindings({ isSearching }: Props) {
  const { settings } = useTheme();
  const { colors } = settings;

  const searchBindings: KeyBinding[] = useMemo(() => [
    { key: 'enter', label: 'confirm' },
    { key: 'esc', label: 'cancel' },
  ], []);

  const normalBindings: KeyBinding[] = useMemo(() => {
    const bindings: KeyBinding[] = [
      { key: '↑↓', label: 'navigate' },
      { key: 'enter', label: 'load' },
      { key: '/', label: 'search' },
      { key: 't', label: 'tags' },
      { key: 'd', label: 'delete' },
      { key: 'q', label: 'quit' },
    ];
    if (isDevMode()) {
      bindings.push({ key: 'r', label: 'fixtures' });
    }
    return bindings;
  }, []);

  if (isSearching) {
    return (
      <Box>
        <KeyBindingDisplay bindings={searchBindings} accentColor={colors.accent1} />
      </Box>
    );
  }

  return (
    <Box>
      <KeyBindingDisplay bindings={normalBindings} accentColor={colors.accent1} />
      <Text dimColor>  ˚  ·</Text>
    </Box>
  );
}
