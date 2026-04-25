import React from "react";

import { icon } from "../head-assets";
import { MdOutlinedTextField } from "../md3";
import type { MaterialTextFieldElement } from "../material-types";
import type { SearchState } from "../types";

type SearchPopupProps = {
  search: SearchState;
  searchQueryRef: React.MutableRefObject<MaterialTextFieldElement | null>;
  onSearchQueryInput: (value: string) => void;
  onSearchReplacementInput: (value: string) => void;
  onGoToAdjacentSearchMatch: (direction: number) => void;
  onSearchMatchCaseToggle: () => void;
  onCloseSearchPopup: () => void;
  onReplaceCurrentSearchMatch: () => void;
  onReplaceAllSearchMatches: () => void;
};

export function SearchPopup(props: SearchPopupProps) {
  const {
    search,
    searchQueryRef,
    onSearchQueryInput,
    onSearchReplacementInput,
    onGoToAdjacentSearchMatch,
    onSearchMatchCaseToggle,
    onCloseSearchPopup,
    onReplaceCurrentSearchMatch,
    onReplaceAllSearchMatches,
  } = props;

  return (
    <div id="searchPopup" className="search-popup" hidden={!search.isOpen}>
      <div className="search-popup__card">
        <div className="search-popup__row search-popup__row--primary">
          <MdOutlinedTextField id="searchQueryInput" className="search-popup__field" label={search.mode === "replace" && search.scope ? "Find in selection" : "Find"} value={search.query} ref={searchQueryRef} onInputValue={onSearchQueryInput}>
            <span slot="leading-icon" className="material-symbols-rounded" aria-hidden="true">search</span>
          </MdOutlinedTextField>
          <div id="searchMatchCount" className="search-popup__count" aria-live="polite">{search.currentIndex >= 0 ? `${search.currentIndex + 1} of ${search.matches.length}` : `0 of ${search.matches.length}`}</div>
          <md-icon-button id="searchPreviousButton" aria-label="Previous match" data-tooltip="Previous match" disabled={!search.matches.length} onClick={() => onGoToAdjacentSearchMatch(-1)}>{icon("keyboard_arrow_up")}</md-icon-button>
          <md-icon-button id="searchNextButton" aria-label="Next match" data-tooltip="Next match" disabled={!search.matches.length} onClick={() => onGoToAdjacentSearchMatch(1)}>{icon("keyboard_arrow_down")}</md-icon-button>
          <md-icon-button id="searchMatchCaseButton" toggle selected={search.matchCase ? true : undefined} aria-label="Match case" data-tooltip="Match case" onClick={onSearchMatchCaseToggle}>{icon("match_case")}</md-icon-button>
          <md-icon-button id="searchCloseButton" aria-label="Close find and replace" data-tooltip="Close" onClick={() => onCloseSearchPopup()}>{icon("close")}</md-icon-button>
        </div>
        <div id="searchReplaceRow" className="search-popup__row" hidden={search.mode !== "replace"}>
          <MdOutlinedTextField id="searchReplaceInput" className="search-popup__field" label="Replace with" value={search.replacement} onInputValue={onSearchReplacementInput}>
            <span slot="leading-icon" className="material-symbols-rounded" aria-hidden="true">edit</span>
          </MdOutlinedTextField>
          <md-filled-icon-button id="searchReplaceButton" aria-label="Replace" data-tooltip="Replace" disabled={search.mode !== "replace" || !search.matches.length} onClick={onReplaceCurrentSearchMatch}>{icon("published_with_changes")}</md-filled-icon-button>
          <md-filled-tonal-icon-button id="searchReplaceAllButton" aria-label="Replace all" data-tooltip="Replace all" disabled={search.mode !== "replace" || !search.matches.length} onClick={onReplaceAllSearchMatches}>{icon("playlist_add_check_circle")}</md-filled-tonal-icon-button>
        </div>
        <div id="searchScopeHint" className="search-popup__scope-hint" hidden={!(search.mode === "replace" && search.scope)}>Replace is currently limited to the highlighted selection.</div>
      </div>
    </div>
  );
}
