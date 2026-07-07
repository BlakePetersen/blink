// ABOUTME: Interactive settings interface for theme customization
// ABOUTME: Allows users to configure themes, animation toggles, and speed

import React, { useState, useMemo } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import {
  Settings,
  SessionScope,
  THEME_PRESETS,
  DEFAULT_SETTINGS,
  applyThemeToSettings,
  snapSpeedToBucket,
} from '../lib/settings.js';

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

const SCOPE_OPTIONS: SessionScope[] = ['project', 'global'];
const RETENTION_OPTIONS = [5, 10, 20, 50];

const ANIMATION_TOGGLE_IDS = ['reducedMotion', 'cycling', 'shimmer', 'breathing'] as const;
type AnimationToggleId = (typeof ANIMATION_TOGGLE_IDS)[number];

interface MenuItem {
  type: 'dropdown' | 'toggle' | 'button';
  id: string;
  label: string;
}

const MENU_ITEMS: MenuItem[] = [
  { type: 'dropdown', id: 'theme', label: 'Theme' },
  { type: 'dropdown', id: 'speed', label: 'Speed' },
  { type: 'toggle', id: 'reducedMotion', label: 'Reduced motion (master off)' },
  { type: 'toggle', id: 'cycling', label: 'Color cycling' },
  { type: 'toggle', id: 'shimmer', label: 'Shimmer' },
  { type: 'toggle', id: 'breathing', label: 'Breathing' },
  { type: 'toggle', id: 'resumePrompt', label: 'Resume prompt on startup' },
  { type: 'dropdown', id: 'defaultScope', label: 'Default scope' },
  { type: 'dropdown', id: 'retentionCount', label: 'Retention (keep N)' },
  { type: 'button', id: 'save', label: 'Save' },
  { type: 'button', id: 'reset', label: 'Reset to defaults' },
  { type: 'button', id: 'cancel', label: 'Cancel' },
];

export function SettingsTUI({ initialSettings, onSave, onCancel }: Props) {
  const { exit } = useApp();
  const [settings, setSettings] = useState<Settings>(() => ({
    ...initialSettings,
    animation: {
      ...initialSettings.animation,
      speed: snapSpeedToBucket(initialSettings.animation.speed),
    },
  }));
  const [focusIndex, setFocusIndex] = useState(0);

  const currentSpeed = useMemo(() => SPEED_FROM_VALUE(settings.animation.speed), [settings.animation.speed]);
  const speedOptions: SpeedOption[] = ['slow', 'balanced', 'fast'];

  const updateAnimation = (key: keyof Settings['animation'], value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      animation: { ...prev.animation, [key]: value },
    }));
  };

  const updateBehavior = (key: keyof Settings['behavior'], value: boolean | number | SessionScope) => {
    setSettings(prev => ({
      ...prev,
      behavior: { ...prev.behavior, [key]: value },
    }));
  };

  const cycleScope = (direction: 1 | -1) => {
    const currentIndex = SCOPE_OPTIONS.indexOf(settings.behavior.defaultScope);
    const nextIndex = (currentIndex + direction + SCOPE_OPTIONS.length) % SCOPE_OPTIONS.length;
    updateBehavior('defaultScope', SCOPE_OPTIONS[nextIndex]);
  };

  const cycleRetention = (direction: 1 | -1) => {
    const currentIndex = RETENTION_OPTIONS.indexOf(settings.behavior.retentionCount);
    // An out-of-list value (currentIndex === -1) steps into the list predictably.
    const base = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (base + direction + RETENTION_OPTIONS.length) % RETENTION_OPTIONS.length;
    updateBehavior('retentionCount', RETENTION_OPTIONS[nextIndex]);
  };

  const cycleTheme = (direction: 1 | -1) => {
    const currentIndex = THEME_NAMES.indexOf(settings.theme);
    const nextIndex = (currentIndex + direction + THEME_NAMES.length) % THEME_NAMES.length;
    const newTheme = THEME_NAMES[nextIndex];
    const preset = THEME_PRESETS[newTheme];
    setSettings(prev => applyThemeToSettings(prev, preset));
  };

  const cycleSpeed = (direction: 1 | -1) => {
    const currentIndex = speedOptions.indexOf(currentSpeed);
    const nextIndex = (currentIndex + direction + speedOptions.length) % speedOptions.length;
    const newSpeed = speedOptions[nextIndex];
    updateAnimation('speed', SPEED_VALUES[newSpeed]);
  };

  const toggleItem = (id: string) => {
    if (id === 'resumePrompt') {
      updateBehavior('resumePrompt', !settings.behavior.resumePrompt);
      return;
    }
    const animationKey = id as AnimationToggleId;
    updateAnimation(animationKey, !settings.animation[animationKey]);
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
        if (item.id === 'defaultScope') cycleScope(-1);
        if (item.id === 'retentionCount') cycleRetention(-1);
      }
    } else if (key.rightArrow) {
      if (item.type === 'dropdown') {
        if (item.id === 'theme') cycleTheme(1);
        if (item.id === 'speed') cycleSpeed(1);
        if (item.id === 'defaultScope') cycleScope(1);
        if (item.id === 'retentionCount') cycleRetention(1);
      }
    } else if (input === ' ') {
      if (item.type === 'toggle') {
        toggleItem(item.id);
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
        toggleItem(item.id);
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

        {/* Master reduced-motion switch */}
        {renderToggle('reducedMotion', 'Reduced motion (master off)', settings.animation.reducedMotion, focusIndex === 2)}

        {/* Animation toggles */}
        {renderToggle('cycling', 'Color cycling', settings.animation.cycling, focusIndex === 3)}
        {renderToggle('shimmer', 'Shimmer', settings.animation.shimmer, focusIndex === 4)}
        {renderToggle('breathing', 'Breathing', settings.animation.breathing, focusIndex === 5)}

        <Box marginTop={1} marginBottom={1}>
          <Text dimColor>--- Behavior ---</Text>
        </Box>

        {/* Behavioral settings */}
        {renderToggle('resumePrompt', 'Resume prompt on startup', settings.behavior.resumePrompt, focusIndex === 6)}
        {renderDropdown('defaultScope', 'Default scope', settings.behavior.defaultScope, focusIndex === 7)}
        {renderDropdown('retentionCount', 'Retention (keep N)', String(settings.behavior.retentionCount), focusIndex === 8)}

        <Box marginTop={1} flexDirection="row" gap={2}>
          {renderButton('save', 'Save', focusIndex === 9)}
          {renderButton('reset', 'Reset to defaults', focusIndex === 10)}
          {renderButton('cancel', 'Cancel', focusIndex === 11)}
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
