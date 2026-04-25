import { useRef, useState, type MutableRefObject } from "react";

import type { EditorManager, SearchState } from "../react/types";
import type { MaterialTextFieldElement } from "../react/material-types";

export const EMPTY_SEARCH: SearchState = {
  isOpen: false,
  mode: "find",
  query: "",
  replacement: "",
  matchCase: false,
  matches: [],
  currentIndex: -1,
  scope: null,
};

export function useSearchController(editorRef: MutableRefObject<EditorManager | null>) {
  const searchQueryRef = useRef<MaterialTextFieldElement | null>(null);
  const [search, setSearchState] = useState<SearchState>(EMPTY_SEARCH);

  function setSearch(next: Partial<SearchState>) {
    setSearchState((current) => ({ ...current, ...next }));
  }

  function syncSearchResults(options: { reveal?: boolean } = {}) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    setSearchState((current) => {
      if (!current.isOpen || !current.query) {
        editor.clearSearchDecorations();
        return { ...current, matches: [], currentIndex: -1 };
      }
      const query = editor.createSearchQuery(current.query, { caseSensitive: current.matchCase });
      const matches = editor.findMatches(query, current.scope);
      const currentIndex = matches.length ? Math.max(0, Math.min(current.currentIndex, matches.length - 1)) : -1;
      const activeMatch = currentIndex >= 0 ? matches[currentIndex] : null;
      editor.setSearchDecorations({ scope: current.scope, matches, activeMatch });
      if (activeMatch && options.reveal) {
        editor.selectAndRevealRange(activeMatch);
      }
      return { ...current, matches, currentIndex };
    });
  }

  function openSearchPopup(mode: "find" | "replace") {
    const selection = editorRef.current?.getSelectionRange();
    const scope = mode === "replace" && selection && !selection.empty
      ? { from: Math.min(selection.from, selection.to), to: Math.max(selection.from, selection.to) }
      : null;
    setSearchState((current) => ({ ...current, isOpen: true, mode, scope, currentIndex: 0 }));
    queueMicrotask(() => {
      searchQueryRef.current?.focus?.();
      syncSearchResults({ reveal: false });
    });
  }

  function closeSearchPopup() {
    editorRef.current?.clearSearchDecorations();
    setSearchState((current) => ({ ...current, isOpen: false, scope: null, matches: [], currentIndex: -1 }));
    editorRef.current?.focus();
  }

  function goToAdjacentSearchMatch(direction: number) {
    if (!search.matches.length) {
      return;
    }
    const nextIndex = (search.currentIndex + direction + search.matches.length) % search.matches.length;
    setSearch({ currentIndex: nextIndex });
    const match = search.matches[nextIndex];
    editorRef.current?.setSearchDecorations({ scope: search.scope, matches: search.matches, activeMatch: match });
    editorRef.current?.selectAndRevealRange(match);
  }

  function replaceCurrentSearchMatch() {
    if (search.mode !== "replace" || search.currentIndex < 0) {
      return;
    }
    const match = search.matches[search.currentIndex];
    editorRef.current?.replaceRange(match, search.replacement);
    syncSearchResults({ reveal: true });
  }

  function replaceAllSearchMatches() {
    if (search.mode !== "replace" || !search.matches.length) {
      return;
    }
    editorRef.current?.replaceAllRanges(search.matches, search.replacement);
    syncSearchResults({ reveal: false });
  }

  return {
    search,
    searchQueryRef,
    setSearch,
    setSearchState,
    syncSearchResults,
    openSearchPopup,
    closeSearchPopup,
    goToAdjacentSearchMatch,
    replaceCurrentSearchMatch,
    replaceAllSearchMatches,
  };
}
