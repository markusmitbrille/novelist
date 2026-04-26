export type NovelistSettings = {
  theme: string;
  fontFamily: string;
  fontSize: number;
  autosaveEnabled: boolean;
  typewriterMode: boolean;
};

export type EditorActiveFormats = Record<string, boolean>;

export type EditorCaretInfo = {
  offset: number;
  line: number;
  column: number;
};

export type SearchState = {
  isOpen: boolean;
  mode: "find" | "replace";
  query: string;
  replacement: string;
  matchCase: boolean;
  matches: Array<{ from: number; to: number }>;
  currentIndex: number;
  scope: { from: number; to: number } | null;
};

export type DocumentStats = {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  paragraphCount: number;
  lineCount: number;
  estimatedReadingMinutes: number;
};

export type EditorManager = {
  setDocument: (text: string) => void;
  getText: () => string;
  getActiveFormats: () => EditorActiveFormats;
  getCaretInfo: () => EditorCaretInfo;
  createSearchQuery: (searchText: string, options?: { caseSensitive?: boolean }) => unknown;
  findMatches: (query: unknown, scope?: { from: number; to: number } | null) => Array<{ from: number; to: number }>;
  getSelectionRange: () => { from: number; to: number; head: number; anchor: number; empty: boolean };
  selectAndRevealRange: (range: { from: number; to: number }, options?: { focus?: boolean }) => void;
  replaceRange: (range: { from: number; to: number }, replacement: string, options?: { focus?: boolean }) => { from: number; to: number } | null;
  replaceAllRanges: (matches: Array<{ from: number; to: number }>, replacement: string, options?: { focus?: boolean }) => void;
  setSearchDecorations: (value: {
    scope?: { from: number; to: number } | null;
    matches?: Array<{ from: number; to: number }>;
    activeMatch?: { from: number; to: number } | null;
  }) => void;
  clearSearchDecorations: () => void;
  insertTextAtSelection: (text: string, options?: { select?: { from: number; to: number } }) => void;
  setTypewriterMode: (enabled: boolean) => void;
  applyFormat: (action: string) => void;
  focus: () => void;
  rebuildFromCurrentText: () => void;
  destroy: () => void;
};

declare global {
  interface Window {
    __NOVELIST_TEST_API__?: {
      getState: () => {
        title: string;
        fileName: string;
        text: string;
        isDirty: boolean;
        saveStatus: string;
        unsupported: boolean;
      };
      setText?: (text: string) => void;
      save?: () => Promise<void>;
    };
    showOpenFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle>;
  }
}
