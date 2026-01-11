// ABOUTME: Settings app wrapper for the SettingsTUI component
// ABOUTME: Loads settings on mount, wraps with ThemeProvider, handles save/cancel

import React, { useState } from 'react';
import { SettingsTUI } from './components/SettingsTUI.js';
import { ThemeProvider } from './lib/theme.js';
import { Settings, loadSettings, saveSettings } from './lib/settings.js';

export function SettingsApp() {
  const [initialSettings] = useState<Settings>(() => loadSettings());

  const handleSave = (settings: Settings) => {
    saveSettings(settings);
  };

  const handleCancel = () => {
    // Exit without saving - no action needed
  };

  return (
    <ThemeProvider>
      <SettingsTUI
        initialSettings={initialSettings}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </ThemeProvider>
  );
}
