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
  seedColor?: string;
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
  "linen-light": {
    id: "linen-light",
    label: "Linen Light",
    mode: "light",
    seedColor: "#7a5a6f",
    swatchColor: "#7f4e75",
    tokens: {
      "--md-sys-color-primary": "#7f4e75",
      "--md-sys-color-on-primary": "#ffffff",
      "--md-sys-color-primary-container": "#ffd7f1",
      "--md-sys-color-on-primary-container": "#331129",
      "--md-sys-color-secondary": "#6d5867",
      "--md-sys-color-on-secondary": "#ffffff",
      "--md-sys-color-secondary-container": "#f7daee",
      "--md-sys-color-on-secondary-container": "#271624",
      "--md-sys-color-tertiary": "#84543e",
      "--md-sys-color-on-tertiary": "#ffffff",
      "--md-sys-color-tertiary-container": "#ffdbc8",
      "--md-sys-color-on-tertiary-container": "#331208",
      "--md-sys-color-surface": "#fff7f9",
      "--md-sys-color-surface-dim": "#e7d6dd",
      "--md-sys-color-surface-bright": "#fff7f9",
      "--md-sys-color-surface-container-lowest": "#ffffff",
      "--md-sys-color-surface-container-low": "#fff0f5",
      "--md-sys-color-surface-container": "#f9eaf0",
      "--md-sys-color-surface-container-high": "#f3e4ea",
      "--md-sys-color-surface-container-highest": "#eddee4",
      "--md-sys-color-on-surface": "#21191d",
      "--md-sys-color-on-surface-variant": "#514348",
      "--md-sys-color-outline": "#837379",
      "--md-sys-color-outline-variant": "#d5c1c9",
      "--md-sys-color-inverse-surface": "#372e32",
      "--md-sys-color-inverse-on-surface": "#fceef3",
      "--md-sys-color-inverse-primary": "#f2b5e0",
      "--md-sys-color-surface-tint": "#7f4e75",
      ...SHARED_ERROR_TOKENS,
    },
  },
  "linen-dark": {
    id: "linen-dark",
    label: "Linen Dark",
    mode: "dark",
    seedColor: "#7a5a6f",
    swatchColor: "#f2b5e0",
    tokens: {
      "--md-sys-color-primary": "#f2b5e0",
      "--md-sys-color-on-primary": "#4c203f",
      "--md-sys-color-primary-container": "#653654",
      "--md-sys-color-on-primary-container": "#ffd7f1",
      "--md-sys-color-secondary": "#d9bfd1",
      "--md-sys-color-on-secondary": "#3d2a38",
      "--md-sys-color-secondary-container": "#54404f",
      "--md-sys-color-on-secondary-container": "#f7daee",
      "--md-sys-color-tertiary": "#f5b899",
      "--md-sys-color-on-tertiary": "#4f2614",
      "--md-sys-color-tertiary-container": "#673c28",
      "--md-sys-color-on-tertiary-container": "#ffdbc8",
      "--md-sys-color-surface": "#181216",
      "--md-sys-color-surface-dim": "#181216",
      "--md-sys-color-surface-bright": "#40373b",
      "--md-sys-color-surface-container-lowest": "#120d10",
      "--md-sys-color-surface-container-low": "#21191d",
      "--md-sys-color-surface-container": "#251d21",
      "--md-sys-color-surface-container-high": "#30272b",
      "--md-sys-color-surface-container-highest": "#3b3136",
      "--md-sys-color-on-surface": "#eddee4",
      "--md-sys-color-on-surface-variant": "#d5c1c9",
      "--md-sys-color-outline": "#9e8d94",
      "--md-sys-color-outline-variant": "#514348",
      "--md-sys-color-inverse-surface": "#eddee4",
      "--md-sys-color-inverse-on-surface": "#372e32",
      "--md-sys-color-inverse-primary": "#7f4e75",
      "--md-sys-color-surface-tint": "#f2b5e0",
      ...SHARED_ERROR_TOKENS,
    },
  },
  "sage-light": {
    id: "sage-light",
    label: "Sage Light",
    mode: "light",
    seedColor: "#586c4d",
    swatchColor: "#52643f",
    tokens: {
      "--md-sys-color-primary": "#52643f",
      "--md-sys-color-on-primary": "#ffffff",
      "--md-sys-color-primary-container": "#d5ebbc",
      "--md-sys-color-on-primary-container": "#112004",
      "--md-sys-color-secondary": "#586249",
      "--md-sys-color-on-secondary": "#ffffff",
      "--md-sys-color-secondary-container": "#dde7c8",
      "--md-sys-color-on-secondary-container": "#161e0b",
      "--md-sys-color-tertiary": "#386665",
      "--md-sys-color-on-tertiary": "#ffffff",
      "--md-sys-color-tertiary-container": "#bceceb",
      "--md-sys-color-on-tertiary-container": "#002020",
      "--md-sys-color-surface": "#f8faf0",
      "--md-sys-color-surface-dim": "#d8dbd0",
      "--md-sys-color-surface-bright": "#f8faf0",
      "--md-sys-color-surface-container-lowest": "#ffffff",
      "--md-sys-color-surface-container-low": "#f2f4ea",
      "--md-sys-color-surface-container": "#eceee4",
      "--md-sys-color-surface-container-high": "#e6e9de",
      "--md-sys-color-surface-container-highest": "#e1e3d8",
      "--md-sys-color-on-surface": "#191d16",
      "--md-sys-color-on-surface-variant": "#44483d",
      "--md-sys-color-outline": "#74796c",
      "--md-sys-color-outline-variant": "#c4c8b8",
      "--md-sys-color-inverse-surface": "#2e312a",
      "--md-sys-color-inverse-on-surface": "#eff2e6",
      "--md-sys-color-inverse-primary": "#b9cfa2",
      "--md-sys-color-surface-tint": "#52643f",
      ...SHARED_ERROR_TOKENS,
    },
  },
  "sage-dark": {
    id: "sage-dark",
    label: "Sage Dark",
    mode: "dark",
    seedColor: "#586c4d",
    swatchColor: "#b9cfa2",
    tokens: {
      "--md-sys-color-primary": "#b9cfa2",
      "--md-sys-color-on-primary": "#253516",
      "--md-sys-color-primary-container": "#3b4c2a",
      "--md-sys-color-on-primary-container": "#d5ebbc",
      "--md-sys-color-secondary": "#c0cbad",
      "--md-sys-color-on-secondary": "#2a331f",
      "--md-sys-color-secondary-container": "#404a34",
      "--md-sys-color-on-secondary-container": "#dde7c8",
      "--md-sys-color-tertiary": "#a1cfce",
      "--md-sys-color-on-tertiary": "#003737",
      "--md-sys-color-tertiary-container": "#1f4e4d",
      "--md-sys-color-on-tertiary-container": "#bceceb",
      "--md-sys-color-surface": "#11140f",
      "--md-sys-color-surface-dim": "#11140f",
      "--md-sys-color-surface-bright": "#393c35",
      "--md-sys-color-surface-container-lowest": "#0c0f0a",
      "--md-sys-color-surface-container-low": "#191d16",
      "--md-sys-color-surface-container": "#1d211a",
      "--md-sys-color-surface-container-high": "#272b24",
      "--md-sys-color-surface-container-highest": "#32362f",
      "--md-sys-color-on-surface": "#e1e3d8",
      "--md-sys-color-on-surface-variant": "#c4c8b8",
      "--md-sys-color-outline": "#8e9283",
      "--md-sys-color-outline-variant": "#44483d",
      "--md-sys-color-inverse-surface": "#e1e3d8",
      "--md-sys-color-inverse-on-surface": "#2e312a",
      "--md-sys-color-inverse-primary": "#52643f",
      "--md-sys-color-surface-tint": "#b9cfa2",
      ...SHARED_ERROR_TOKENS,
    },
  },
  "ocean-dark": {
    id: "ocean-dark",
    label: "Ocean Dark",
    mode: "dark",
    seedColor: "#2d5f8f",
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
    seedColor: "#2d5f8f",
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
  "rosewood-light": {
    id: "rosewood-light",
    label: "Rosewood Light",
    mode: "light",
    seedColor: "#904a60",
    swatchColor: "#994061",
    tokens: {
      "--md-sys-color-primary": "#994061",
      "--md-sys-color-on-primary": "#ffffff",
      "--md-sys-color-primary-container": "#ffd9e2",
      "--md-sys-color-on-primary-container": "#3f001d",
      "--md-sys-color-secondary": "#75565f",
      "--md-sys-color-on-secondary": "#ffffff",
      "--md-sys-color-secondary-container": "#ffd9e2",
      "--md-sys-color-on-secondary-container": "#2b151c",
      "--md-sys-color-tertiary": "#7d5635",
      "--md-sys-color-on-tertiary": "#ffffff",
      "--md-sys-color-tertiary-container": "#ffdcc1",
      "--md-sys-color-on-tertiary-container": "#2f1500",
      "--md-sys-color-surface": "#fff8f8",
      "--md-sys-color-surface-dim": "#e9d6d8",
      "--md-sys-color-surface-bright": "#fff8f8",
      "--md-sys-color-surface-container-lowest": "#ffffff",
      "--md-sys-color-surface-container-low": "#fff0f2",
      "--md-sys-color-surface-container": "#fce9ec",
      "--md-sys-color-surface-container-high": "#f6e3e6",
      "--md-sys-color-surface-container-highest": "#f1dde0",
      "--md-sys-color-on-surface": "#22191b",
      "--md-sys-color-on-surface-variant": "#524346",
      "--md-sys-color-outline": "#847376",
      "--md-sys-color-outline-variant": "#d6c2c6",
      "--md-sys-color-inverse-surface": "#382e30",
      "--md-sys-color-inverse-on-surface": "#fdecee",
      "--md-sys-color-inverse-primary": "#ffb1c8",
      "--md-sys-color-surface-tint": "#994061",
      ...SHARED_ERROR_TOKENS,
    },
  },
  "rosewood-dark": {
    id: "rosewood-dark",
    label: "Rosewood Dark",
    mode: "dark",
    seedColor: "#904a60",
    swatchColor: "#ffb1c8",
    tokens: {
      "--md-sys-color-primary": "#ffb1c8",
      "--md-sys-color-on-primary": "#5e1133",
      "--md-sys-color-primary-container": "#7c2949",
      "--md-sys-color-on-primary-container": "#ffd9e2",
      "--md-sys-color-secondary": "#e4bdc7",
      "--md-sys-color-on-secondary": "#432930",
      "--md-sys-color-secondary-container": "#5b3f47",
      "--md-sys-color-on-secondary-container": "#ffd9e2",
      "--md-sys-color-tertiary": "#f1bc91",
      "--md-sys-color-on-tertiary": "#49290b",
      "--md-sys-color-tertiary-container": "#633f20",
      "--md-sys-color-on-tertiary-container": "#ffdcc1",
      "--md-sys-color-surface": "#191113",
      "--md-sys-color-surface-dim": "#191113",
      "--md-sys-color-surface-bright": "#413739",
      "--md-sys-color-surface-container-lowest": "#140c0e",
      "--md-sys-color-surface-container-low": "#22191b",
      "--md-sys-color-surface-container": "#261d1f",
      "--md-sys-color-surface-container-high": "#302729",
      "--md-sys-color-surface-container-highest": "#3b3134",
      "--md-sys-color-on-surface": "#f1dde0",
      "--md-sys-color-on-surface-variant": "#d6c2c6",
      "--md-sys-color-outline": "#9f8c90",
      "--md-sys-color-outline-variant": "#524346",
      "--md-sys-color-inverse-surface": "#f1dde0",
      "--md-sys-color-inverse-on-surface": "#382e30",
      "--md-sys-color-inverse-primary": "#994061",
      "--md-sys-color-surface-tint": "#ffb1c8",
      ...SHARED_ERROR_TOKENS,
    },
  },
};

export const DEFAULT_THEME_ID = "ocean-dark";
export const THEME_PICKER_ROWS = [
  ["ocean-dark", "linen-dark", "sage-dark", "rosewood-dark"],
  ["ocean-light", "linen-light", "sage-light", "rosewood-light"],
];
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
