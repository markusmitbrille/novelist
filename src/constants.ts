export const APP_NAME = "Novelist";
export const DEFAULT_DOCUMENT_TITLE = "Untitled";
export const NOVELIST_SETTINGS_KEY = "novelist:settings:v1";
export const AUTOSAVE_DELAY_MS = 700;
export const MENU_ORDER = ["file", "edit", "view", "insert", "format", "help"];

export type FontOption = {
  label: string;
  value: string;
};

export type FontOptionGroup = {
  id: string;
  label: string;
  options: FontOption[];
};

export const FONT_OPTION_GROUPS: FontOptionGroup[] = [
  {
    id: "system",
    label: "System Fonts",
    options: [
      { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
      { label: "Arial", value: "Arial, Helvetica, sans-serif" },
      { label: "Courier New", value: "'Courier New', Courier, monospace" },
    ],
  },
  {
    id: "web",
    label: "Web Fonts",
    options: [
      { label: "Cormorant Garamond", value: "'Cormorant Garamond', Georgia, serif" },
      { label: "Libre Baskerville", value: "'Libre Baskerville', Georgia, serif" },
      { label: "Source Serif 4", value: "'Source Serif 4', Georgia, serif" },
      { label: "Lora", value: "Lora, Georgia, serif" },
      { label: "Merriweather", value: "Merriweather, Georgia, serif" },
      { label: "Source Sans 3", value: "'Source Sans 3', Arial, sans-serif" },
    ],
  },
];

export const FONT_OPTIONS = FONT_OPTION_GROUPS.flatMap((group) => group.options);

type ThemeMode = "dark" | "light";
type ThemeTokens = Record<string, string>;
export type ThemePreset = {
  id: string;
  label: string;
  mode: ThemeMode;
  swatchColor: string;
  tokens: ThemeTokens;
};

const SHARED_ERROR_TOKENS: ThemeTokens = {
  "--md-sys-color-error": "#ba1a1a",
  "--md-sys-color-on-error": "#ffffff",
  "--md-sys-color-error-container": "#ffdad6",
  "--md-sys-color-on-error-container": "#410002",
  "--md-sys-color-shadow": "#000000",
  "--md-sys-color-scrim": "#000000",
};

export const THEME_PRESETS: Record<string, ThemePreset> = {
  "ocean-dark": {
    id: "ocean-dark",
    label: "Ocean Dark",
    mode: "dark",
    swatchColor: "#9ecaff",
    tokens: {
      "--md-sys-color-primary": "#9ecaff",
      "--md-sys-color-on-primary": "#003257",
      "--md-sys-color-primary-container": "#00497b",
      "--md-sys-color-on-primary-container": "#d2e4ff",
      "--md-sys-color-secondary": "#b9c8d9",
      "--md-sys-color-on-secondary": "#233240",
      "--md-sys-color-secondary-container": "#394857",
      "--md-sys-color-on-secondary-container": "#d5e4f6",
      "--md-sys-color-tertiary": "#d2bfe6",
      "--md-sys-color-on-tertiary": "#382a49",
      "--md-sys-color-tertiary-container": "#4f4061",
      "--md-sys-color-on-tertiary-container": "#eedbff",
      "--md-sys-color-surface": "#101417",
      "--md-sys-color-surface-dim": "#101417",
      "--md-sys-color-surface-bright": "#36393d",
      "--md-sys-color-surface-container-lowest": "#0a0f12",
      "--md-sys-color-surface-container-low": "#181c20",
      "--md-sys-color-surface-container": "#1c2024",
      "--md-sys-color-surface-container-high": "#272a2f",
      "--md-sys-color-surface-container-highest": "#31353a",
      "--md-sys-color-on-surface": "#dfe3ea",
      "--md-sys-color-on-surface-variant": "#c1c7ce",
      "--md-sys-color-outline": "#8b9298",
      "--md-sys-color-outline-variant": "#41484d",
      "--md-sys-color-inverse-surface": "#dfe3ea",
      "--md-sys-color-inverse-on-surface": "#2d3135",
      "--md-sys-color-inverse-primary": "#1d5e97",
      "--md-sys-color-surface-tint": "#9ecaff",
      ...SHARED_ERROR_TOKENS,
    },
  },
  "ocean-light": {
    id: "ocean-light",
    label: "Ocean Light",
    mode: "light",
    swatchColor: "#1d5e97",
    tokens: {
      "--md-sys-color-primary": "#1d5e97",
      "--md-sys-color-on-primary": "#ffffff",
      "--md-sys-color-primary-container": "#d2e4ff",
      "--md-sys-color-on-primary-container": "#001c36",
      "--md-sys-color-secondary": "#51606f",
      "--md-sys-color-on-secondary": "#ffffff",
      "--md-sys-color-secondary-container": "#d5e4f6",
      "--md-sys-color-on-secondary-container": "#0d1d2a",
      "--md-sys-color-tertiary": "#67587a",
      "--md-sys-color-on-tertiary": "#ffffff",
      "--md-sys-color-tertiary-container": "#eedbff",
      "--md-sys-color-on-tertiary-container": "#221533",
      "--md-sys-color-surface": "#f7f9ff",
      "--md-sys-color-surface-dim": "#d8dae1",
      "--md-sys-color-surface-bright": "#f7f9ff",
      "--md-sys-color-surface-container-lowest": "#ffffff",
      "--md-sys-color-surface-container-low": "#f1f4fb",
      "--md-sys-color-surface-container": "#ebeff6",
      "--md-sys-color-surface-container-high": "#e5e9f0",
      "--md-sys-color-surface-container-highest": "#dfe3ea",
      "--md-sys-color-on-surface": "#181c20",
      "--md-sys-color-on-surface-variant": "#41484d",
      "--md-sys-color-outline": "#71787e",
      "--md-sys-color-outline-variant": "#c1c7ce",
      "--md-sys-color-inverse-surface": "#2d3135",
      "--md-sys-color-inverse-on-surface": "#eef1f5",
      "--md-sys-color-inverse-primary": "#9ecaff",
      "--md-sys-color-surface-tint": "#1d5e97",
      ...SHARED_ERROR_TOKENS,
    },
  },
};

export const DEFAULT_THEME_ID = "ocean-dark";
export const DEFAULT_SETTINGS = {
  theme: DEFAULT_THEME_ID,
  fontFamily: FONT_OPTIONS[0].value,
  fontSize: 19,
  backgroundImage: "",
  currentLineHighlight: false,
};

export function resolveThemePreset(themeId: string | undefined | null) {
  return themeId && THEME_PRESETS[themeId] ? THEME_PRESETS[themeId] : THEME_PRESETS[DEFAULT_THEME_ID];
}

export type ShortcutDefinition = {
  key?: string;
  code?: string;
  modifiers?: Array<"primary" | "alt" | "shift">;
  platform?: "default" | "mac";
};

export const MENU_ACTION_SHORTCUTS: Record<string, ShortcutDefinition[]> = {
  new: [{ key: "n", modifiers: ["primary"] }],
  open: [{ key: "o", modifiers: ["primary"] }],
  save: [{ key: "s", modifiers: ["primary"] }],
  "save-as": [{ key: "s", modifiers: ["primary", "shift"] }],
  undo: [{ key: "z", modifiers: ["primary"] }],
  redo: [
    { key: "y", modifiers: ["primary"] },
    { key: "z", modifiers: ["primary", "shift"] },
  ],
  find: [{ key: "f", modifiers: ["primary"] }],
  replace: [
    { key: "h", modifiers: ["primary"], platform: "default" },
    { key: "h", modifiers: ["primary", "shift"], platform: "mac" },
  ],
  settings: [{ code: "Comma", key: ",", modifiers: ["primary"] }],
  divider: [{ code: "Minus", key: "-", modifiers: ["primary", "shift"] }],
  link: [{ key: "k", modifiers: ["primary"] }],
  image: [{ key: "i", modifiers: ["primary", "shift"] }],
  "heading-1": [{ key: "1", modifiers: ["primary", "alt"] }],
  "heading-2": [{ key: "2", modifiers: ["primary", "alt"] }],
  "heading-3": [{ key: "3", modifiers: ["primary", "alt"] }],
  bold: [{ key: "b", modifiers: ["primary"] }],
  italic: [{ key: "i", modifiers: ["primary"] }],
  bullet: [{ code: "Digit8", key: "8", modifiers: ["primary", "shift"] }],
  quote: [{ code: "Period", key: ".", modifiers: ["primary", "shift"] }],
};

export function isMacPlatform() {
  if (typeof navigator === "undefined") {
    return false;
  }
  const platform = navigator.userAgentData?.platform || navigator.platform || "";
  return /mac/i.test(platform);
}

function formatShortcutPart(part: string, mac: boolean) {
  if (part === "primary") {
    return mac ? "Cmd" : "Ctrl";
  }
  if (part === "alt") {
    return mac ? "Option" : "Alt";
  }
  if (part === "shift") {
    return "Shift";
  }
  return part;
}

function formatShortcutKey(shortcut: ShortcutDefinition) {
  if (shortcut.key === "F1") {
    return "F1";
  }
  if (shortcut.code === "Backslash") {
    return "\\";
  }
  if (shortcut.code === "Comma") {
    return ",";
  }
  if (shortcut.code === "Minus") {
    return "-";
  }
  if (shortcut.code === "Period") {
    return ".";
  }
  if (shortcut.code === "Backspace") {
    return "Backspace";
  }
  return String(shortcut.key || "").toUpperCase();
}

export function formatShortcutLabel(shortcut: ShortcutDefinition, options: { mac?: boolean } = {}) {
  const mac = options.mac ?? isMacPlatform();
  const parts = (shortcut.modifiers || []).map((part) => formatShortcutPart(part, mac));
  parts.push(formatShortcutKey(shortcut));
  return parts.join("+");
}

export function getShortcutLabel(action: string, options: { mac?: boolean } = {}) {
  const mac = options.mac ?? isMacPlatform();
  const shortcuts = (MENU_ACTION_SHORTCUTS[action] || []).filter((shortcut) => {
    if (!shortcut.platform) {
      return true;
    }
    return shortcut.platform === "mac" ? mac : !mac;
  });
  return shortcuts.map((shortcut) => formatShortcutLabel(shortcut, options)).join(" / ");
}
