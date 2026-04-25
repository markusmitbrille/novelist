import React from "react";

import { FONT_OPTION_GROUPS, MENU_ACTION_SHORTCUTS, getShortcutLabel } from "../constants.js";

export function normalizeShortcutKey(value) {
  if (!value) {
    return "";
  }
  return value.length === 1 ? value.toLowerCase() : value;
}

export function matchesShortcut(event, shortcut) {
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

export function getShortcutAction(event) {
  for (const [action, shortcuts] of Object.entries(MENU_ACTION_SHORTCUTS)) {
    if (shortcuts.some((shortcut) => matchesShortcut(event, shortcut))) {
      return action;
    }
  }
  return null;
}

export function renderFontOptions(selectedValue) {
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

export function renderSelectOptions(options, selectedValue) {
  return (options || []).map((option) => (
    <md-select-option key={option.value} value={option.value} display-text={option.label} selected={option.value === selectedValue ? true : undefined}>
      {option.label}
    </md-select-option>
  ));
}

export function saveBlob(options) {
  const blob = options.blob instanceof Blob
    ? options.blob
    : new Blob([options.content ?? ""], { type: options.mimeType || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = options.suggestedName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function formatTooltipLabel(label, action) {
  const shortcut = action ? getShortcutLabel(action) : "";
  return shortcut ? `${label} (${shortcut})` : label;
}
