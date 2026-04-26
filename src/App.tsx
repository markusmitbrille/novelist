import React, { useEffect, useMemo, useRef, useState } from "react";
import { supportsFileSystemAccess, isAbortError } from "./file-system-access";
import { useDocumentSession } from "./hooks/useDocumentSession";
import { useEditorBridge } from "./hooks/useEditorBridge";
import { useSearchController } from "./hooks/useSearchController";
import { useSettings } from "./hooks/useSettings";
import { countDocumentStats, countWords } from "./text";
import { getShortcutAction } from "./react/ui";
import { AppTooltip } from "./react/components/AppTooltip";
import { DirtyDocumentDialog } from "./react/components/DirtyDocumentDialog";
import { FormatBar } from "./react/components/FormatBar";
import { Menubar } from "./react/components/Menubar";
import { SearchPopup } from "./react/components/SearchPopup";
import { SettingsDialog } from "./react/components/SettingsDialog";
import { WordCountDialog } from "./react/components/WordCountDialog";
import { MdDialog } from "./react/md3";
import { icon } from "./react/head-assets";

export default function App() {
  const [isSupported] = useState(supportsFileSystemAccess);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wordCountOpen, setWordCountOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const { settings, updateSettings } = useSettings();
  const documentSession = useDocumentSession(settings.autosaveEnabled);
  const syncSearchRef = useRef<() => void>(() => {});
  const editorBridge = useEditorBridge({
    isSupported,
    documentText: documentSession.state.text,
    documentRevision: documentSession.state.revision,
    typewriterMode: settings.typewriterMode,
    onTextChange: documentSession.setText,
    onEditorActivity: () => syncSearchRef.current(),
  });
  const searchController = useSearchController(editorBridge.editorRef);
  const wordCount = useMemo(() => countWords(documentSession.state.text), [documentSession.state.text]);
  const documentStats = useMemo(() => countDocumentStats(documentSession.state.text), [documentSession.state.text]);
  const displayName = documentSession.state.fileName || `${documentSession.state.title}.md`;

  syncSearchRef.current = () => searchController.syncSearchResults({ reveal: false });

  async function handleMenuAction(action: string) {
    try {
      switch (action) {
        case "new":
          await documentSession.newDocument();
          searchController.syncSearchResults();
          break;
        case "open":
          await documentSession.openFile();
          searchController.syncSearchResults();
          break;
        case "save":
          await documentSession.saveCurrent("Saved.");
          break;
        case "save-as":
          await documentSession.saveAs("Saved.");
          break;
        case "find":
          searchController.openSearchPopup("find");
          break;
        case "replace":
          searchController.openSearchPopup("replace");
          break;
        case "settings":
          setSettingsOpen(true);
          break;
        case "word-count":
          setWordCountOpen(true);
          break;
        case "about":
          setAboutOpen(true);
          break;
        default:
          editorBridge.applyEditorAction(action);
          break;
      }
    } catch (error) {
      if (!isAbortError(error)) {
        documentSession.setStatus(error instanceof Error ? error.message : String(error));
      }
    }
  }

  useEffect(() => {
    document.documentElement.lang = "en";
    document.title = "Novelist";
    return () => {
      documentSession.clearAutosave();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.isComposing || settingsOpen || wordCountOpen || aboutOpen || documentSession.dirtyDialogOpen) {
        return;
      }
      if (event.key === "Escape" && searchController.search.isOpen) {
        event.preventDefault();
        searchController.closeSearchPopup();
        return;
      }
      const action = getShortcutAction(event);
      if (action) {
        event.preventDefault();
        await handleMenuAction(action);
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [searchController.search, settingsOpen, wordCountOpen, aboutOpen, documentSession.dirtyDialogOpen]);

  useEffect(() => {
    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) {
        return;
      }
      if (documentSession.dirtyDialogOpen) {
        if (event.key === "Enter") {
          event.preventDefault();
          documentSession.resolveDirtyReplacement("save");
        } else if (event.key === "Escape") {
          event.preventDefault();
          documentSession.resolveDirtyReplacement("cancel");
        }
        return;
      }
      if (settingsOpen || wordCountOpen || aboutOpen) {
        if (event.key === "Enter" || event.key === "Escape") {
          event.preventDefault();
          setSettingsOpen(false);
          setWordCountOpen(false);
          setAboutOpen(false);
        }
      }
    };
    document.addEventListener("keydown", handleDialogKeyDown, true);
    return () => document.removeEventListener("keydown", handleDialogKeyDown, true);
  }, [settingsOpen, wordCountOpen, aboutOpen, documentSession.dirtyDialogOpen]);

  useEffect(() => {
    window.__NOVELIST_TEST_API__ = {
      getState() {
        return {
          title: documentSession.state.title,
          fileName: documentSession.state.fileName,
          text: documentSession.state.text,
          isDirty: documentSession.state.isDirty,
          saveStatus: documentSession.state.saveStatus,
          unsupported: !isSupported,
        };
      },
      setText(text: string) {
        documentSession.setText(text);
      },
      save() {
        return documentSession.saveCurrent("Saved.");
      },
    };
  }, [documentSession.state, isSupported]);

  if (!isSupported) {
    return (
      <div id="novelistRoot" className="novelist-app novelist-app--unsupported" data-app-ready="false">
        <main className="unsupported-browser">
          <div className="unsupported-browser__mark">{icon("edit_document")}</div>
          <h1>Novelist requires a Chromium-based browser.</h1>
          <p>Novelist edits local markdown files directly, so it needs the File System Access API available in Chrome, Edge, and other Chromium-based browsers.</p>
        </main>
      </div>
    );
  }

  return (
    <div id="novelistRoot" className="novelist-app" data-app-ready="true" data-dirty={documentSession.state.isDirty ? "true" : "false"}>
      <Menubar
        displayName={displayName}
        saveStatus={documentSession.state.saveStatus}
        caret={editorBridge.caret}
        wordCount={wordCount}
        onMenuAction={handleMenuAction}
        onAppLogoClick={() => setAboutOpen(true)}
      />

      <FormatBar activeFormats={editorBridge.activeFormats} onMenuAction={handleMenuAction} />

      <main className="workspace-content">
        <section className="editor-stage">
          <div className="editor-paper">
            <div className="editor-surface">
              <div id="editorMount" className="editor-mount" ref={editorBridge.editorMountRef}></div>
            </div>
          </div>
          <SearchPopup
            search={searchController.search}
            searchQueryRef={searchController.searchQueryRef}
            onSearchQueryInput={(value) => {
              searchController.setSearchState((current) => ({ ...current, query: value, currentIndex: 0 }));
              queueMicrotask(() => searchController.syncSearchResults({ reveal: false }));
            }}
            onSearchReplacementInput={(value) => searchController.setSearch({ replacement: value })}
            onGoToAdjacentSearchMatch={searchController.goToAdjacentSearchMatch}
            onSearchMatchCaseToggle={() => {
              searchController.setSearchState((current) => ({ ...current, matchCase: !current.matchCase }));
              queueMicrotask(() => searchController.syncSearchResults({ reveal: false }));
            }}
            onCloseSearchPopup={searchController.closeSearchPopup}
            onReplaceCurrentSearchMatch={searchController.replaceCurrentSearchMatch}
            onReplaceAllSearchMatches={searchController.replaceAllSearchMatches}
          />
        </section>
      </main>

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onUpdate={(updater, rebuildEditor = false) => {
          updateSettings(updater);
          if (rebuildEditor) {
            editorBridge.rebuildEditor();
          }
        }}
      />
      <WordCountDialog
        open={wordCountOpen}
        stats={documentStats}
        onClose={() => setWordCountOpen(false)}
      />
      <DirtyDocumentDialog
        open={documentSession.dirtyDialogOpen}
        onCancel={() => documentSession.resolveDirtyReplacement("cancel")}
        onDiscard={() => documentSession.resolveDirtyReplacement("discard")}
        onSave={() => documentSession.resolveDirtyReplacement("save")}
      />
      <MdDialog id="aboutDialog" open={aboutOpen} onClosed={() => setAboutOpen(false)}>
        <div slot="headline">About Novelist</div>
        <div slot="content">Novelist is a local markdown editor for Chromium-based browsers. It opens and saves files directly on your device.</div>
        <div slot="actions"><md-text-button onClick={() => setAboutOpen(false)}>Close</md-text-button></div>
      </MdDialog>
      <AppTooltip />
    </div>
  );
}
