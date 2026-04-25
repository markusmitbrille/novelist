import { DEFAULT_DOCUMENT_TITLE } from "./constants";
import type { NovelistSettings } from "./react/types";
import { DEFAULT_SETTINGS, FONT_OPTIONS, THEME_PRESETS } from "./constants";

export function countWords(text: string) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

export function countDocumentStats(text: string) {
  const value = String(text || "");
  const wordCount = countWords(value);
  const characterCount = value.length;
  const characterCountNoSpaces = value.replace(/\s/g, "").length;
  const paragraphCount = value.trim() ? value.trim().split(/\n\s*\n/).filter((paragraph) => paragraph.trim()).length : 0;
  const lineCount = value ? value.split(/\r\n|\r|\n/).length : 0;
  const estimatedReadingMinutes = wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / 225));

  return {
    wordCount,
    characterCount,
    characterCountNoSpaces,
    paragraphCount,
    lineCount,
    estimatedReadingMinutes,
  };
}

export function normalizeDocumentTitle(value: string) {
  return String(value || "").trim() || DEFAULT_DOCUMENT_TITLE;
}

export function normalizeSettings(settings: Partial<NovelistSettings> | null | undefined): NovelistSettings {
  return {
    fontSize: Number.isFinite(settings?.fontSize)
      ? Math.max(12, Math.min(32, Number(settings?.fontSize)))
      : DEFAULT_SETTINGS.fontSize,
    fontFamily: FONT_OPTIONS.some((option) => option.value === settings?.fontFamily)
      ? String(settings?.fontFamily)
      : DEFAULT_SETTINGS.fontFamily,
    theme: settings?.theme && THEME_PRESETS[settings.theme] ? String(settings.theme) : DEFAULT_SETTINGS.theme,
    autosaveEnabled: settings?.autosaveEnabled !== false,
  };
}
