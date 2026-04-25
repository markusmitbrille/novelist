import type { EditorManager } from "./react/types";

export function createEditorManager(options: {
  parent: HTMLElement;
  onDocChange: (text: string) => void;
  onSelectionChange?: () => void;
}): EditorManager;

export function expandRangeToWord(state: unknown, range: unknown): unknown;
