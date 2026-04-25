import { DEFAULT_DOCUMENT_TITLE } from "./constants";
import type { NovelistSettings } from "./react/types";
import { DEFAULT_SETTINGS, FONT_OPTIONS } from "./constants";

export function countWords(text: string) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

export function normalizeDocumentTitle(value: string) {
  return String(value || "").trim() || DEFAULT_DOCUMENT_TITLE;
}

export function normalizeSettings(settings: Partial<NovelistSettings> | null | undefined): NovelistSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(settings || {}),
    fontSize: Number.isFinite(settings?.fontSize)
      ? Math.max(12, Math.min(32, Number(settings?.fontSize)))
      : DEFAULT_SETTINGS.fontSize,
    currentLineHighlight: settings?.currentLineHighlight === true,
    backgroundImage: String(settings?.backgroundImage || ""),
    fontFamily: FONT_OPTIONS.some((option) => option.value === settings?.fontFamily)
      ? String(settings?.fontFamily)
      : DEFAULT_SETTINGS.fontFamily,
    theme: String(settings?.theme || DEFAULT_SETTINGS.theme),
  };
}
