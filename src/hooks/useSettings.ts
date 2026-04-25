import { useEffect, useState } from "react";

import { DEFAULT_SETTINGS, NOVELIST_SETTINGS_KEY } from "../constants";
import { applyThemeToShell } from "../react/theme";
import type { NovelistSettings } from "../react/types";
import { normalizeSettings } from "../text";

function loadStoredSettings(): NovelistSettings {
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem(NOVELIST_SETTINGS_KEY) || "null"));
  } catch {
    return { ...DEFAULT_SETTINGS };
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
