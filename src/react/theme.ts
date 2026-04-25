import { DEFAULT_THEME_ID, FONT_OPTIONS, resolveThemePreset } from "../constants";
import type { NovelistSettings } from "./types";

type ThemeDocumentState = {
  settings?: NovelistSettings | null;
};

export function getCurrentThemePreset(documentState: ThemeDocumentState) {
  const themeId = documentState?.settings?.theme;
  return resolveThemePreset(themeId);
}

export function syncResolvedThemeId(documentState: ThemeDocumentState) {
  if (!documentState?.settings) {
    return DEFAULT_THEME_ID;
  }
  return getCurrentThemePreset(documentState).id;
}

export function applyThemeToShell(documentState: ThemeDocumentState) {
  if (!documentState?.settings) {
    return;
  }
  const settings = documentState.settings;
  const fontFamily = FONT_OPTIONS.some((option) => option.value === settings.fontFamily)
    ? settings.fontFamily
    : FONT_OPTIONS[0].value;
  const preset = getCurrentThemePreset(documentState);
  const fontSize = Number.isFinite(settings.fontSize) ? settings.fontSize : 19;

  for (const [key, value] of Object.entries(preset.tokens)) {
    document.documentElement.style.setProperty(key, String(value));
  }
  document.documentElement.style.colorScheme = preset.mode;
  document.documentElement.dataset.theme = preset.id;
  document.documentElement.dataset.themeMode = preset.mode;
  document.documentElement.style.setProperty("--editor-font-family", fontFamily);
  document.documentElement.style.setProperty("--editor-font-size", `${fontSize}px`);
}
