import { getShortcutLabel } from "./constants";

export type MenuName = "file" | "edit" | "view" | "insert" | "format" | "help";

export type MenuItemDefinition = {
  action: string;
  label?: string;
  disabled?: boolean;
  divider?: boolean;
  shortcut?: string;
};

export const MENU_ITEMS: Record<MenuName, MenuItemDefinition[]> = {
  file: [
    { action: "new", label: "New" },
    { action: "open", label: "Open" },
    { action: "save", label: "Save" },
    { action: "save-as", label: "Save As" },
  ],
  edit: [
    { action: "undo", label: "Undo" },
    { action: "redo", label: "Redo" },
    { action: "edit-divider", divider: true },
    { action: "find", label: "Find" },
    { action: "replace", label: "Replace" },
  ],
  view: [
    { action: "word-count", label: "Word Count" },
    { action: "settings", label: "Editor Settings" },
  ],
  insert: [
    { action: "divider", label: "Rule" },
    { action: "link", label: "Link" },
    { action: "image", label: "Image", disabled: true },
  ],
  format: [
    { action: "heading-1", label: "Heading 1" },
    { action: "heading-2", label: "Heading 2" },
    { action: "heading-3", label: "Heading 3" },
    { action: "format-divider-1", divider: true },
    { action: "bold", label: "Bold" },
    { action: "italic", label: "Italic" },
    { action: "format-divider-2", divider: true },
    { action: "bullet", label: "Bullet List" },
    { action: "quote", label: "Blockquote" },
  ],
  help: [
    { action: "about", label: "About" },
  ],
};

export function getMenuItems(menuName: string): MenuItemDefinition[] {
  return (MENU_ITEMS as Record<string, MenuItemDefinition[]>)[menuName] || [];
}

export function getMenuShortcut(action: string) {
  return getShortcutLabel(action);
}
