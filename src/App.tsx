import React, { useEffect, useMemo, useRef, useState } from "react";

import { AUTOSAVE_DELAY_MS, DEFAULT_DOCUMENT_TITLE, DEFAULT_SETTINGS, getShortcutLabel, MENU_ORDER, NOVELIST_SETTINGS_KEY } from "./constants.js";
import { createEditorManager } from "./editor.js";
import { getAppStyles } from "./styles.js";
import { applyThemeToShell } from "./react/theme";
import { AppTooltip } from "./react/components/AppTooltip";
import { FormatBar } from "./react/components/FormatBar";
import { SearchPopup } from "./react/components/SearchPopup";
import { MdCheckbox, MdDialog, MdMenu, MdOutlinedSelect, MdOutlinedTextField } from "./react/md3";
import { getShortcutAction, renderFontOptions } from "./react/ui";
import { icon } from "./react/head-assets";
import type { EditorManager, NovelistSettings } from "./react/types";
import type { MaterialTextFieldElement } from "./react/material-types";

type SearchState = {
  isOpen: boolean;
  mode: "find" | "replace";
  query: string;
  replacement: string;
  matchCase: boolean;
  matches: Array<{ from: number; to: number }>;
  currentIndex: number;
  scope: { from: number; to: number } | null;
};

type FileSystemHandleWithPermission = FileSystemFileHandle & {
  queryPermission?: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
};

const EMPTY_SEARCH: SearchState = {
  isOpen: false,
  mode: "find",
  query: "",
  replacement: "",
  matchCase: false,
  matches: [],
  currentIndex: -1,
  scope: null,
};

function supportsFileSystemAccess() {
  return typeof window.showOpenFilePicker === "function"
    && typeof window.showSaveFilePicker === "function";
}

function normalizeSettings(settings: Partial<NovelistSettings> | null | undefined): NovelistSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(settings || {}),
    fontSize: Number.isFinite(settings?.fontSize)
      ? Math.max(12, Math.min(32, Number(settings?.fontSize)))
      : DEFAULT_SETTINGS.fontSize,
    currentLineHighlight: settings?.currentLineHighlight === true,
    backgroundImage: String(settings?.backgroundImage || ""),
    fontFamily: String(settings?.fontFamily || DEFAULT_SETTINGS.fontFamily),
    theme: String(settings?.theme || DEFAULT_SETTINGS.theme),
  };
}

function loadStoredSettings(): NovelistSettings {
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem(NOVELIST_SETTINGS_KEY) || "null"));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function storeSettings(settings: NovelistSettings) {
  localStorage.setItem(NOVELIST_SETTINGS_KEY, JSON.stringify(settings));
}

function countWords(text: string) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function suggestedMarkdownName(title: string) {
  const slug = String(title || DEFAULT_DOCUMENT_TITLE)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${slug || "untitled"}.md`;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

async function ensureWritablePermission(handle: FileSystemHandleWithPermission) {
  if (typeof handle.queryPermission !== "function" || typeof handle.requestPermission !== "function") {
    return true;
  }
  if (await handle.queryPermission({ mode: "readwrite" }) === "granted") {
    return true;
  }
  return await handle.requestPermission({ mode: "readwrite" }) === "granted";
}

async function writeFile(handle: FileSystemHandleWithPermission, text: string) {
  if (!(await ensureWritablePermission(handle))) {
    throw new Error("Write permission was not granted for this file.");
  }
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
}

export default function App() {
  const editorMountRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<EditorManager | null>(null);
  const searchQueryRef = useRef<MaterialTextFieldElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const menuAnchorsRef = useRef<Record<string, HTMLElement | null>>({});
  const fileHandleRef = useRef<FileSystemHandleWithPermission | null>(null);
  const latestTextRef = useRef("");

  const [isSupported] = useState(supportsFileSystemAccess);
  const [settings, setSettings] = useState<NovelistSettings>(() => loadStoredSettings());
  const [title, setTitle] = useState(DEFAULT_DOCUMENT_TITLE);
  const [fileName, setFileName] = useState("");
  const [saveStatus, setSaveStatus] = useState("Ready.");
  const [isDirty, setIsDirty] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [caret, setCaret] = useState({ offset: 0, line: 1, column: 1 });
  const [search, setSearchState] = useState<SearchState>(EMPTY_SEARCH);
  const [openMenuName, setOpenMenuName] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const wordCount = useMemo(() => countWords(latestTextRef.current), [isDirty, title, fileName]);
  const displayName = fileName || `${title}.md`;

  function setSearch(next: Partial<SearchState>) {
    setSearchState((current) => ({ ...current, ...next }));
  }

  function closeAllMenus() {
    setOpenMenuName(null);
  }

  function syncActiveFormats() {
    if (editorRef.current) {
      setActiveFormats(editorRef.current.getActiveFormats());
    }
  }

  function syncCaretState() {
    if (editorRef.current) {
      setCaret(editorRef.current.getCaretInfo());
    }
  }

  function clearAutosave() {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
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

  async function saveToHandle(handle: FileSystemHandleWithPermission, statusMessage = "Saved.") {
    const text = editorRef.current?.getText() ?? latestTextRef.current;
    setSaveStatus("Saving...");
    await writeFile(handle, text);
    latestTextRef.current = text;
    setIsDirty(false);
    setSaveStatus(statusMessage);
  }

  async function saveAs() {
    const handle = await window.showSaveFilePicker({
      suggestedName: suggestedMarkdownName(title),
      types: [{
        description: "Markdown files",
        accept: { "text/markdown": [".md", ".markdown"], "text/plain": [".txt"] },
      }],
    }) as FileSystemHandleWithPermission;
    fileHandleRef.current = handle;
    setFileName(handle.name || "");
    await saveToHandle(handle, "Saved.");
  }

  async function saveCurrentFile(statusMessage = "Saved.") {
    if (!fileHandleRef.current) {
      await saveAs();
      return;
    }
    await saveToHandle(fileHandleRef.current, statusMessage);
  }

  function scheduleAutosave() {
    clearAutosave();
    if (!fileHandleRef.current) {
      setSaveStatus("Unsaved changes.");
      return;
    }
    setSaveStatus("Autosaving...");
    saveTimerRef.current = window.setTimeout(() => {
      saveCurrentFile("Autosaved.").catch((error) => {
        setSaveStatus(error instanceof Error ? error.message : "Autosave failed.");
      });
    }, AUTOSAVE_DELAY_MS);
  }

  async function openFile() {
    const [handle] = await window.showOpenFilePicker({
      multiple: false,
      types: [{
        description: "Markdown files",
        accept: { "text/markdown": [".md", ".markdown"], "text/plain": [".txt"] },
      }],
    }) as FileSystemHandleWithPermission[];
    if (!handle) {
      return;
    }
    const file = await handle.getFile();
    const text = await file.text();
    clearAutosave();
    fileHandleRef.current = handle;
    latestTextRef.current = text;
    editorRef.current?.setDocument(text);
    setTitle(file.name.replace(/\.(md|markdown|txt)$/i, "") || DEFAULT_DOCUMENT_TITLE);
    setFileName(file.name);
    setIsDirty(false);
    setSaveStatus("Opened.");
    syncActiveFormats();
    syncCaretState();
    syncSearchResults();
  }

  function newDocument() {
    clearAutosave();
    fileHandleRef.current = null;
    latestTextRef.current = "";
    editorRef.current?.setDocument("");
    setTitle(DEFAULT_DOCUMENT_TITLE);
    setFileName("");
    setIsDirty(false);
    setSaveStatus("New document.");
    syncSearchResults();
  }

  async function handleMenuAction(action: string) {
    try {
      switch (action) {
        case "new":
          newDocument();
          break;
        case "open":
          await openFile();
          break;
        case "save":
          await saveCurrentFile("Saved.");
          break;
        case "save-as":
          await saveAs();
          break;
        case "find":
          openSearchPopup("find");
          break;
        case "replace":
          openSearchPopup("replace");
          break;
        case "settings":
          setSettingsOpen(true);
          break;
        case "word-count":
          setSaveStatus(`${wordCount.toLocaleString()} words.`);
          break;
        case "about":
          setAboutOpen(true);
          break;
        default:
          editorRef.current?.applyFormat(action);
          editorRef.current?.focus();
          syncActiveFormats();
          break;
      }
    } catch (error) {
      if (!isAbortError(error)) {
        setSaveStatus(error instanceof Error ? error.message : String(error));
      }
    }
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

  function applySettingsUpdate(updater: (next: NovelistSettings) => NovelistSettings, rebuildEditor = false) {
    setSettings((current) => {
      const next = normalizeSettings(updater({ ...current }));
      storeSettings(next);
      applyThemeToShell({ settings: next });
      return next;
    });
    if (rebuildEditor) {
      editorRef.current?.rebuildFromCurrentText();
    }
  }

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "novelist-styles";
    style.textContent = getAppStyles();
    document.head.appendChild(style);
    document.documentElement.lang = "en";
    document.title = "Novelist";
    applyThemeToShell({ settings });
    return () => {
      style.remove();
      clearAutosave();
    };
  }, []);

  useEffect(() => {
    applyThemeToShell({ settings });
  }, [settings]);

  useEffect(() => {
    if (!isSupported || !editorMountRef.current || editorRef.current) {
      return;
    }
    editorRef.current = createEditorManager({
      parent: editorMountRef.current,
      onDocChange(text) {
        latestTextRef.current = text;
        setIsDirty(true);
        syncSearchResults({ reveal: false });
        scheduleAutosave();
      },
      onSelectionChange() {
        syncSearchResults({ reveal: false });
        syncActiveFormats();
        syncCaretState();
      },
    });
    editorRef.current.setDocument("");
    syncActiveFormats();
    syncCaretState();
    return () => {
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, [isSupported]);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.isComposing || settingsOpen || aboutOpen) {
        return;
      }
      if (event.key === "Escape" && search.isOpen) {
        event.preventDefault();
        closeSearchPopup();
        return;
      }
      const action = getShortcutAction(event);
      if (action) {
        event.preventDefault();
        await handleMenuAction(action);
        closeAllMenus();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [search, settingsOpen, aboutOpen, wordCount]);

  useEffect(() => {
    window.__NOVELIST_TEST_API__ = {
      getState() {
        return {
          title,
          fileName,
          text: latestTextRef.current,
          isDirty,
          saveStatus,
          unsupported: !isSupported,
        };
      },
      setText(text: string) {
        latestTextRef.current = text;
        editorRef.current?.setDocument(text);
        setIsDirty(true);
        scheduleAutosave();
      },
      save() {
        return saveCurrentFile("Saved.");
      },
    };
  }, [title, fileName, isDirty, saveStatus, isSupported]);

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
    <div id="novelistRoot" className="novelist-app" data-app-ready="true" data-dirty={isDirty ? "true" : "false"}>
      <header className="menubar">
        <div className="menubar__brand">
          <md-icon-button id="appLogoButton" aria-label="Novelist">{icon("edit_document")}</md-icon-button>
          <MdOutlinedTextField id="documentTitleField" className="document-title-field" aria-label="Document title" placeholder={DEFAULT_DOCUMENT_TITLE} value={title} onInputValue={(value) => {
            setTitle(value || DEFAULT_DOCUMENT_TITLE);
            setIsDirty(true);
            scheduleAutosave();
          }} />
        </div>
        <div className="menubar__menus" id="menubarMenus">
          {MENU_ORDER.map((name) => (
            <button
              key={name}
              type="button"
              id={`${name}MenuButton`}
              className="menubar__menu-trigger"
              data-menu-trigger={name}
              ref={(element) => { menuAnchorsRef.current[name] = element; }}
              onClick={() => setOpenMenuName(openMenuName === name ? null : name)}
              onMouseEnter={() => {
                if (openMenuName && openMenuName !== name) {
                  setOpenMenuName(name);
                }
              }}
            >
              {name[0].toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>
        <div className="menubar__status">
          <span id="toolbarStatus" className="menubar__status-text">{isDirty ? `${saveStatus} Unsaved changes.` : saveStatus}</span>
          <span className="menubar__caret-text">{`${displayName} · Caret ${caret.offset} · Line ${caret.line}, Col ${caret.column} · ${wordCount.toLocaleString()} words`}</span>
        </div>
        {MENU_ORDER.map((menuName) => (
          <MdMenu
            key={menuName}
            id={`${menuName}Menu`}
            anchorElement={menuAnchorsRef.current[menuName]}
            open={openMenuName === menuName}
            positioning="popover"
            quick
            onClosed={() => setOpenMenuName((current) => current === menuName ? null : current)}
          >
            {renderMenuItems(menuName, async (action) => {
              await handleMenuAction(action);
              closeAllMenus();
            })}
          </MdMenu>
        ))}
      </header>

      <FormatBar activeFormats={activeFormats} onMenuAction={handleMenuAction} />

      <main className="workspace-content">
        <section className="editor-stage">
          <div className="editor-paper">
            <div className="editor-surface">
              <div id="editorMount" className="editor-mount" ref={editorMountRef}></div>
            </div>
          </div>
          <SearchPopup
            search={search}
            searchQueryRef={searchQueryRef}
            onSearchQueryInput={(value) => {
              setSearchState((current) => ({ ...current, query: value, currentIndex: 0 }));
              queueMicrotask(() => syncSearchResults({ reveal: false }));
            }}
            onSearchReplacementInput={(value) => setSearch({ replacement: value })}
            onGoToAdjacentSearchMatch={goToAdjacentSearchMatch}
            onSearchMatchCaseToggle={() => {
              setSearchState((current) => ({ ...current, matchCase: !current.matchCase }));
              queueMicrotask(() => syncSearchResults({ reveal: false }));
            }}
            onCloseSearchPopup={closeSearchPopup}
            onReplaceCurrentSearchMatch={replaceCurrentSearchMatch}
            onReplaceAllSearchMatches={replaceAllSearchMatches}
          />
        </section>
      </main>

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onUpdate={applySettingsUpdate}
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

function renderMenuItems(menuName: string, onAction: (action: string) => void | Promise<void>) {
  const items = {
    file: [["new", "New"], ["open", "Open"], ["save", "Save"], ["save-as", "Save As"]],
    edit: [["undo", "Undo"], ["redo", "Redo"], ["divider"], ["find", "Find"], ["replace", "Replace"]],
    view: [["word-count", "Word Count"], ["settings", "Editor Settings"]],
    insert: [["divider", "Rule"], ["link", "Link"], ["image", "Image"]],
    format: [["heading-1", "Heading 1"], ["heading-2", "Heading 2"], ["heading-3", "Heading 3"], ["divider"], ["bold", "Bold"], ["italic", "Italic"], ["divider2"], ["bullet", "Bullet List"], ["quote", "Blockquote"]],
    help: [["about", "About"]],
  }[menuName] || [];

  return items.map(([action, label]) => {
    if (action.startsWith("divider") && !label) {
      return <md-divider key={action}></md-divider>;
    }
    const disabled = action === "image";
    return (
      <md-menu-item key={action} data-menu-action={action} disabled={disabled} onClick={() => !disabled && onAction(action)}>
        {label}
        {getShortcutLabel(action) ? <span className="menu-shortcut" slot="trailing-supporting-text">{getShortcutLabel(action)}</span> : null}
      </md-menu-item>
    );
  });
}

function SettingsDialog({ open, settings, onClose, onUpdate }) {
  return (
    <MdDialog id="settingsDialog" open={open} onClosed={onClose}>
      <div slot="headline">Editor Settings</div>
      <div slot="content">
        <div className="settings-grid">
          <MdOutlinedSelect id="settingsFontFamily" label="Font family" value={settings.fontFamily} onChangeValue={(value) => onUpdate((draft) => ({ ...draft, fontFamily: value }), true)}>
            {renderFontOptions(settings.fontFamily)}
          </MdOutlinedSelect>
          <MdOutlinedTextField id="settingsFontSize" label="Font size" type="number" value={String(settings.fontSize)} onChangeValue={(value) => onUpdate((draft) => ({ ...draft, fontSize: Number(value || draft.fontSize) }))} />
          <label className="settings-checkbox-row" htmlFor="settingsCurrentLineHighlight">
            <MdCheckbox id="settingsCurrentLineHighlight" checked={settings.currentLineHighlight === true} onChangeChecked={(checked) => onUpdate((draft) => ({ ...draft, currentLineHighlight: checked }))} />
            <span className="settings-checkbox-row__text">
              <span className="settings-checkbox-row__label">Highlight current line</span>
              <span className="settings-checkbox-row__supporting">Show the subtle current-line tint in the editor.</span>
            </span>
          </label>
          <MdOutlinedTextField id="settingsBackgroundImage" label="Background image URL" type="url" value={settings.backgroundImage || ""} onChangeValue={(value) => onUpdate((draft) => ({ ...draft, backgroundImage: value.trim() }))} />
        </div>
      </div>
      <div slot="actions"><md-text-button onClick={onClose}>Close</md-text-button></div>
    </MdDialog>
  );
}
