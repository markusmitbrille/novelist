import React from "react";

import { FONT_OPTION_GROUPS, MENU_ACTION_SHORTCUTS, getShortcutLabel } from "../constants";

type Shortcut = {
  key?: string;
  code?: string;
  modifiers?: Array<"primary" | "alt" | "shift">;
  platform?: "default" | "mac";
};

export function normalizeShortcutKey(value: string | undefined) {
  if (!value) {
    return "";
  }
  return value.length === 1 ? value.toLowerCase() : value;
}

export function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut) {
  const isMac = /mac/i.test(navigator.userAgentData?.platform || navigator.platform || "");
  if (shortcut.platform === "mac" && !isMac) {
    return false;
  }
  if (shortcut.platform === "default" && isMac) {
    return false;
  }
  const expectedModifiers = new Set(shortcut.modifiers || []);
  const primaryPressed = event.ctrlKey || event.metaKey;
  return primaryPressed === expectedModifiers.has("primary")
    && event.altKey === expectedModifiers.has("alt")
    && event.shiftKey === expectedModifiers.has("shift")
    && (!shortcut.code || event.code === shortcut.code)
    && (!shortcut.key || normalizeShortcutKey(event.key) === normalizeShortcutKey(shortcut.key));
}

export function getShortcutAction(event: KeyboardEvent) {
  for (const [action, shortcuts] of Object.entries(MENU_ACTION_SHORTCUTS)) {
    if (shortcuts.some((shortcut) => matchesShortcut(event, shortcut))) {
      return action;
    }
  }
  return null;
}

export function renderFontOptions(selectedValue: string) {
  return FONT_OPTION_GROUPS.flatMap((group, groupIndex) => {
    const items = [];
    if (groupIndex > 0) {
      items.push(<md-divider key={`${group.id}-divider`} role="separator"></md-divider>);
    }
    for (const option of group.options) {
      items.push(
        <md-select-option key={option.value} value={option.value} display-text={option.label} selected={option.value === selectedValue ? true : undefined}>
          {option.label}
        </md-select-option>
      );
    }
    return items;
  });
}

export function formatTooltipLabel(label: string, action?: string) {
  const shortcut = action ? getShortcutLabel(action) : "";
  return shortcut ? `${label} (${shortcut})` : label;
}
