// ABOUTME: React context for theme colors and animation state
// ABOUTME: Provides settings and live animation state to all components

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Settings, loadSettings, saveSettings, applyPreset } from './settings.js';
import { AnimationState, calculateAnimationState } from './animation.js';

interface ThemeContextValue {
  settings: Settings;
  animationState: AnimationState;
  updateSettings: (updates: Partial<Settings>) => void;
  setTheme: (themeName: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [animationState, setAnimationState] = useState<AnimationState>(() =>
    calculateAnimationState(0)
  );
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    // Skip animation if all effects disabled
    if (!settings.animation.cycling &&
        !settings.animation.wave &&
        !settings.animation.shimmer &&
        !settings.animation.breathing) {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setAnimationState(calculateAnimationState(elapsed));
    }, settings.animation.speed);

    return () => clearInterval(interval);
  }, [settings.animation, startTime]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      saveSettings(next);
      return next;
    });
  }, []);

  const setTheme = useCallback((themeName: string) => {
    const newSettings = applyPreset(themeName);
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  return (
    <ThemeContext.Provider value={{ settings, animationState, updateSettings, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
