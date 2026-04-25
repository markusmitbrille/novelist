import { useEffect, useState } from "react";

import { DEFAULT_SETTINGS, NOVELIST_SETTINGS_KEY } from "../constants";
import { applyThemeToShell } from "../react/theme";
import type { NovelistSettings } from "../react/types";
import { normalizeSettings } from "../text";

function loadStoredSettings(): NovelistSettings {
  try {
    const storedSettings = JSON.parse(localStorage.getItem(NOVELIST_SETTINGS_KEY) || "null");
    const normalizedSettings = normalizeSettings(storedSettings);
    if (JSON.stringify(storedSettings) !== JSON.stringify(normalizedSettings)) {
      storeSettings(normalizedSettings);
    }
    return normalizedSettings;
  } catch {
    const defaultSettings = { ...DEFAULT_SETTINGS };
    storeSettings(defaultSettings);
    return defaultSettings;
  }
}

function storeSettings(settings: NovelistSettings) {
  localStorage.setItem(NOVELIST_SETTINGS_KEY, JSON.stringify(settings));
}

export function useSettings() {
  const [settings, setSettings] = useState<NovelistSettings>(() => loadStoredSettings());

  function updateSettings(updater: (draft: NovelistSettings) => NovelistSettings) {
    setSettings((current) => {
      const next = normalizeSettings(updater({ ...current }));
      storeSettings(next);
      applyThemeToShell({ settings: next });
      return next;
    });
  }

  useEffect(() => {
    applyThemeToShell({ settings });
  }, [settings]);

  return {
    settings,
    updateSettings,
  };
}
