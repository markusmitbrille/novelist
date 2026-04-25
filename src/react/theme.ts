import { DEFAULT_THEME_ID, FONT_OPTIONS, resolveThemePreset } from "../constants.js";

export function getCurrentThemePreset(documentState) {
  const themeId = documentState?.settings?.theme;
  return resolveThemePreset(themeId);
}

export function syncResolvedThemeId(documentState) {
  if (!documentState?.settings) {
    return DEFAULT_THEME_ID;
  }
  return getCurrentThemePreset(documentState).id;
}

export function applyThemeToShell(documentState) {
  if (!documentState?.settings) {
    return;
  }
  const settings = documentState.settings;
  const currentLineHighlight = settings.currentLineHighlight === true;
  const fontFamily = FONT_OPTIONS.some((option) => option.value === settings.fontFamily)
    ? settings.fontFamily
    : FONT_OPTIONS[0].value;
  const preset = getCurrentThemePreset(documentState);
  const fontSize = Number.isFinite(settings.fontSize) ? settings.fontSize : 19;
  const backgroundImage = String(settings.backgroundImage || "");

  for (const [key, value] of Object.entries(preset.tokens)) {
    document.documentElement.style.setProperty(key, String(value));
  }
  document.documentElement.style.colorScheme = preset.mode;
  document.documentElement.dataset.theme = preset.id;
  document.documentElement.dataset.themeMode = preset.mode;
  document.documentElement.style.setProperty("--editor-font-family", fontFamily);
  document.documentElement.style.setProperty("--editor-font-size", `${fontSize}px`);
  document.documentElement.style.setProperty(
    "--cm-active-line",
    currentLineHighlight
      ? "color-mix(in srgb, var(--md-sys-color-on-surface) 5%, transparent)"
      : "transparent"
  );
  document.documentElement.style.setProperty(
    "--cm-active-gutter-bg",
    currentLineHighlight
      ? "color-mix(in srgb, var(--md-sys-color-on-surface) 3%, transparent)"
      : "transparent"
  );
  document.documentElement.style.setProperty(
    "--cm-active-gutter-text",
    currentLineHighlight
      ? "color-mix(in srgb, var(--md-sys-color-primary) 44%, var(--md-sys-color-on-surface-variant))"
      : "var(--cm-gutter)"
  );
  document.documentElement.style.setProperty("--editor-background-image", backgroundImage ? `url("${backgroundImage}")` : "none");
}
