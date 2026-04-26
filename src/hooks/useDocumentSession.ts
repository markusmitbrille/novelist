import { useEffect, useReducer, useRef, useState } from "react";

import { AUTOSAVE_DELAY_MS, DEFAULT_DOCUMENT_TITLE } from "../constants";
import {
  isAbortError,
  pickMarkdownFile,
  pickSaveFile,
  writeMarkdownFile,
  type OpenedMarkdownFile,
  type WritableFileHandle,
} from "../file-system-access";
import { normalizeDocumentTitle } from "../text";

export type DocumentSessionState = {
  text: string;
  revision: number;
  title: string;
  fileName: string;
  fileHandle: WritableFileHandle | null;
  isDirty: boolean;
  saveStatus: string;
  lastSavedText: string;
};

type DocumentSessionAction =
  | { type: "edit-text"; text: string; autosaveEnabled: boolean }
  | { type: "load-file"; file: OpenedMarkdownFile }
  | { type: "new-document" }
  | { type: "saving" }
  | { type: "saved"; text: string; fileHandle?: WritableFileHandle | null; fileName?: string; status: string }
  | { type: "status"; status: string };

export type DirtyReplacementChoice = "cancel" | "discard" | "save";

const INITIAL_DOCUMENT_SESSION: DocumentSessionState = {
  text: "",
  revision: 0,
  title: DEFAULT_DOCUMENT_TITLE,
  fileName: "",
  fileHandle: null,
  isDirty: false,
  saveStatus: "Ready.",
  lastSavedText: "",
};

function documentSessionReducer(state: DocumentSessionState, action: DocumentSessionAction): DocumentSessionState {
  switch (action.type) {
    case "edit-text":
      const isDirty = action.text !== state.lastSavedText;
      return {
        ...state,
        text: action.text,
        revision: state.revision + 1,
        isDirty,
        saveStatus: isDirty ? (state.fileHandle && action.autosaveEnabled ? "Autosaving..." : "Unsaved changes.") : "Saved.",
      };
    case "load-file":
      return {
        ...state,
        text: action.file.text,
        revision: state.revision + 1,
        title: normalizeDocumentTitle(action.file.title),
        fileName: action.file.fileName,
        fileHandle: action.file.handle,
        isDirty: false,
        saveStatus: "Opened.",
        lastSavedText: action.file.text,
      };
    case "new-document":
      return {
        ...INITIAL_DOCUMENT_SESSION,
        revision: state.revision + 1,
        saveStatus: "New document.",
      };
    case "saving":
      return {
        ...state,
        saveStatus: "Saving...",
      };
    case "saved":
      const textWasCurrent = action.text === state.text;
      return {
        ...state,
        fileHandle: action.fileHandle === undefined ? state.fileHandle : action.fileHandle,
        fileName: action.fileName === undefined ? state.fileName : action.fileName,
        isDirty: !textWasCurrent,
        saveStatus: textWasCurrent ? action.status : "Unsaved changes.",
        lastSavedText: action.text,
      };
    case "status":
      return {
        ...state,
        saveStatus: action.status,
      };
    default:
      return state;
  }
}

export function useDocumentSession(autosaveEnabled = true) {
  const [state, dispatch] = useReducer(documentSessionReducer, INITIAL_DOCUMENT_SESSION);
  const stateRef = useRef(INITIAL_DOCUMENT_SESSION);
  const autosaveEnabledRef = useRef(autosaveEnabled);
  const saveTimerRef = useRef<number | null>(null);
  const pendingReplacementRef = useRef<(() => Promise<void>) | null>(null);
  const [dirtyDialogOpen, setDirtyDialogOpen] = useState(false);

  stateRef.current = state;
  autosaveEnabledRef.current = autosaveEnabled;

  function clearAutosave() {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }

  async function saveTextToHandle(handle: WritableFileHandle, text: string, status: string) {
    dispatch({ type: "saving" });
    await writeMarkdownFile(handle, text);
    dispatch({ type: "saved", text, status });
  }

  async function saveAs(status = "Saved.") {
    const handle = await pickSaveFile(stateRef.current.title);
    const text = stateRef.current.text;
    dispatch({ type: "saving" });
    await writeMarkdownFile(handle, text);
    dispatch({
      type: "saved",
      text,
      fileHandle: handle,
      fileName: handle.name || "",
      status,
    });
  }

  async function saveCurrent(status = "Saved.") {
    const handle = stateRef.current.fileHandle;
    if (!handle) {
      await saveAs(status);
      return;
    }
    await saveTextToHandle(handle, stateRef.current.text, status);
  }

  function scheduleAutosave(text: string, handle = stateRef.current.fileHandle) {
    clearAutosave();
    if (!handle || !autosaveEnabledRef.current) {
      return;
    }
    saveTimerRef.current = window.setTimeout(() => {
      saveTextToHandle(handle, text, "Autosaved.").catch((error) => {
        if (!isAbortError(error)) {
          dispatch({ type: "status", status: error instanceof Error ? error.message : "Autosave failed." });
        }
      });
    }, AUTOSAVE_DELAY_MS);
  }

  function setText(text: string) {
    dispatch({ type: "edit-text", text, autosaveEnabled: autosaveEnabledRef.current });
    if (text !== stateRef.current.lastSavedText && autosaveEnabledRef.current) {
      scheduleAutosave(text);
    } else {
      clearAutosave();
    }
  }

  useEffect(() => {
    if (!autosaveEnabled) {
      clearAutosave();
    }
  }, [autosaveEnabled]);

  async function replaceWithNewDocument() {
    clearAutosave();
    dispatch({ type: "new-document" });
  }

  async function replaceWithPickedFile() {
    const file = await pickMarkdownFile();
    if (!file) {
      return;
    }
    clearAutosave();
    dispatch({ type: "load-file", file });
  }

  async function runGuardedReplacement(replacement: () => Promise<void>) {
    if (!stateRef.current.isDirty) {
      await replacement();
      return;
    }
    pendingReplacementRef.current = replacement;
    setDirtyDialogOpen(true);
  }

  async function resolveDirtyReplacement(choice: DirtyReplacementChoice) {
    if (choice === "cancel") {
      pendingReplacementRef.current = null;
      setDirtyDialogOpen(false);
      return;
    }
    const replacement = pendingReplacementRef.current;
    if (!replacement) {
      setDirtyDialogOpen(false);
      return;
    }
    try {
      if (choice === "save") {
        await saveCurrent("Saved.");
      }
      pendingReplacementRef.current = null;
      setDirtyDialogOpen(false);
      await replacement();
    } catch (error) {
      if (!isAbortError(error)) {
        dispatch({ type: "status", status: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  async function newDocument() {
    await runGuardedReplacement(replaceWithNewDocument);
  }

  async function openFile() {
    await runGuardedReplacement(replaceWithPickedFile);
  }

  return {
    state,
    dirtyDialogOpen,
    setText,
    saveCurrent,
    saveAs,
    newDocument,
    openFile,
    clearAutosave,
    resolveDirtyReplacement,
    setStatus(status: string) {
      dispatch({ type: "status", status });
    },
  };
}
