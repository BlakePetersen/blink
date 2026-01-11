// ABOUTME: Interactive settings interface for theme customization
// ABOUTME: Allows users to configure themes, animation toggles, and speed

import React, { useState, useMemo } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Settings, THEME_PRESETS, DEFAULT_SETTINGS } from '../lib/settings.js';

interface Props {
  initialSettings: Settings;
  onSave: (settings: Settings) => void;
  onCancel: () => void;
}

type SpeedOption = 'slow' | 'balanced' | 'fast';

const SPEED_VALUES: Record<SpeedOption, number> = {
  slow: 500,
  balanced: 250,
  fast: 150,
};

const SPEED_FROM_VALUE = (value: number): SpeedOption => {
  if (value >= 400) return 'slow';
  if (value <= 200) return 'fast';
  return 'balanced';
};

const THEME_NAMES = Object.keys(THEME_PRESETS);

interface MenuItem {
  type: 'dropdown' | 'toggle' | 'button';
  id: string;
  label: string;
}

const MENU_ITEMS: MenuItem[] = [
  { type: 'dropdown', id: 'theme', label: 'Theme' },
  { type: 'dropdown', id: 'speed', label: 'Speed' },
  { type: 'toggle', id: 'cycling', label: 'Color cycling' },
  { type: 'toggle', id: 'wave', label: 'Wave' },
  { type: 'toggle', id: 'shimmer', label: 'Shimmer' },
  { type: 'toggle', id: 'breathing', label: 'Breathing' },
  { type: 'button', id: 'save', label: 'Save' },
  { type: 'button', id: 'reset', label: 'Reset to defaults' },
  { type: 'button', id: 'cancel', label: 'Cancel' },
];

export function SettingsTUI({ initialSettings, onSave, onCancel }: Props) {
  const { exit } = useApp();
  const [settings, setSettings] = useState<Settings>(() => ({ ...initialSettings }));
  const [focusIndex, setFocusIndex] = useState(0);

  const currentSpeed = useMemo(() => SPEED_FROM_VALUE(settings.animation.speed), [settings.animation.speed]);
  const speedOptions: SpeedOption[] = ['slow', 'balanced', 'fast'];

  const updateAnimation = (key: keyof Settings['animation'], value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      animation: { ...prev.animation, [key]: value },
    }));
  };

  const cycleTheme = (direction: 1 | -1) => {
    const currentIndex = THEME_NAMES.indexOf(settings.theme);
    const nextIndex = (currentIndex + direction + THEME_NAMES.length) % THEME_NAMES.length;
    const newTheme = THEME_NAMES[nextIndex];
    const preset = THEME_PRESETS[newTheme];
    setSettings({ ...preset });
  };

  const cycleSpeed = (direction: 1 | -1) => {
    const currentIndex = speedOptions.indexOf(currentSpeed);
    const nextIndex = (currentIndex + direction + speedOptions.length) % speedOptions.length;
    const newSpeed = speedOptions[nextIndex];
    updateAnimation('speed', SPEED_VALUES[newSpeed]);
  };

  useInput((input, key) => {
    const item = MENU_ITEMS[focusIndex];

    if (key.upArrow) {
      setFocusIndex(i => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setFocusIndex(i => Math.min(MENU_ITEMS.length - 1, i + 1));
    } else if (key.leftArrow) {
      if (item.type === 'dropdown') {
        if (item.id === 'theme') cycleTheme(-1);
        if (item.id === 'speed') cycleSpeed(-1);
      }
    } else if (key.rightArrow) {
      if (item.type === 'dropdown') {
        if (item.id === 'theme') cycleTheme(1);
        if (item.id === 'speed') cycleSpeed(1);
      }
    } else if (input === ' ') {
      if (item.type === 'toggle') {
        const animationKey = item.id as 'cycling' | 'wave' | 'shimmer' | 'breathing';
        updateAnimation(animationKey, !settings.animation[animationKey]);
      }
    } else if (key.return) {
      if (item.id === 'save') {
        onSave(settings);
        exit();
      } else if (item.id === 'reset') {
        setSettings({ ...DEFAULT_SETTINGS });
      } else if (item.id === 'cancel') {
        onCancel();
        exit();
      } else if (item.type === 'toggle') {
        const animationKey = item.id as 'cycling' | 'wave' | 'shimmer' | 'breathing';
        updateAnimation(animationKey, !settings.animation[animationKey]);
      }
    } else if (key.escape || input === 'q') {
      onCancel();
      exit();
    }
  });

  const renderDropdown = (id: string, label: string, value: string, focused: boolean) => (
    <Box>
      <Text color={focused ? 'cyan' : undefined}>
        {focused ? '> ' : '  '}
        {label}: [{value}]
        {focused ? ' <-/->' : ''}
      </Text>
    </Box>
  );

  const renderToggle = (id: string, label: string, checked: boolean, focused: boolean) => (
    <Box>
      <Text color={focused ? 'cyan' : undefined}>
        {focused ? '> ' : '  '}
        [{checked ? 'x' : ' '}] {label}
      </Text>
    </Box>
  );

  const renderButton = (id: string, label: string, focused: boolean) => {
    let color: string | undefined = undefined;
    if (focused) color = 'cyan';
    if (id === 'save' && focused) color = 'green';
    if (id === 'cancel' && focused) color = 'red';

    return (
      <Box>
        <Text color={color} bold={focused}>
          {focused ? '> ' : '  '}[{label}]
        </Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="round" flexDirection="column" padding={1} paddingX={2}>
        <Box marginBottom={1}>
          <Text bold color="magenta">Blink Settings</Text>
        </Box>

        {/* Theme dropdown */}
        {renderDropdown('theme', 'Theme', settings.theme, focusIndex === 0)}

        <Box marginTop={1} marginBottom={1}>
          <Text dimColor>--- Animation ---</Text>
        </Box>

        {/* Speed dropdown */}
        {renderDropdown('speed', 'Speed', currentSpeed, focusIndex === 1)}

        {/* Animation toggles */}
        {renderToggle('cycling', 'Color cycling', settings.animation.cycling, focusIndex === 2)}
        {renderToggle('wave', 'Wave', settings.animation.wave, focusIndex === 3)}
        {renderToggle('shimmer', 'Shimmer', settings.animation.shimmer, focusIndex === 4)}
        {renderToggle('breathing', 'Breathing', settings.animation.breathing, focusIndex === 5)}

        <Box marginTop={1} flexDirection="row" gap={2}>
          {renderButton('save', 'Save', focusIndex === 6)}
          {renderButton('reset', 'Reset to defaults', focusIndex === 7)}
          {renderButton('cancel', 'Cancel', focusIndex === 8)}
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          Up/Down: navigate | Left/Right: change | Space/Enter: toggle | q/Esc: cancel
        </Text>
      </Box>
    </Box>
  );
}
