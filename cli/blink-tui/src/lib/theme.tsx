// ABOUTME: React context for theme colors and animation state
// ABOUTME: Provides settings and live animation state to all components

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Settings, loadSettings, persistSettings, mergeSettings, applyPreset } from './settings.js';
import { AnimationState, calculateAnimationState } from './animation.js';
import { isReducedMotion } from './motion.js';
import { isPlainMode } from './plain-mode.js';

interface ThemeContextValue {
  settings: Settings;
  animationState: AnimationState;
  reducedMotion: boolean;
  plainMode: boolean;
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

  const reducedMotion = useMemo(() => isReducedMotion(settings), [settings]);
  const plainMode = useMemo(() => isPlainMode(), []);

  // Keep a ref to the latest settings so update handlers can compute the next
  // value without relying on a possibly-stale closure, and persist it exactly
  // once outside the state updater (which must stay pure - StrictMode runs it
  // twice, and an unguarded fs write there would double-write or crash).
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    // Skip animation when reduced motion is active or all effects are disabled
    if (reducedMotion) {
      return;
    }
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
  }, [settings.animation, startTime, reducedMotion]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    const next = mergeSettings(settingsRef.current, updates);
    setSettings(next);
    // Persist outside the updater; failure is non-fatal (guarded internally).
    persistSettings(next);
  }, []);

  const setTheme = useCallback((themeName: string) => {
    const next = applyPreset(themeName);
    setSettings(next);
    persistSettings(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ settings, animationState, reducedMotion, plainMode, updateSettings, setTheme }}>
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
