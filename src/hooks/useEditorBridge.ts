import { useEffect, useRef, useState } from "react";

import { createEditorManager } from "../editor";
import type { EditorActiveFormats, EditorCaretInfo, EditorManager } from "../react/types";

export function useEditorBridge(options: {
  isSupported: boolean;
  documentText: string;
  documentRevision: number;
  typewriterMode?: boolean;
  onTextChange: (text: string) => void;
  onEditorActivity?: () => void;
}) {
  const { isSupported, documentText, documentRevision, typewriterMode = false, onTextChange, onEditorActivity = () => {} } = options;
  const editorMountRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<EditorManager | null>(null);
  const lastAppliedRevisionRef = useRef(-1);
  const [activeFormats, setActiveFormats] = useState<EditorActiveFormats>({});
  const [caret, setCaret] = useState<EditorCaretInfo>({ offset: 0, line: 1, column: 1 });

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

  function syncEditorUiState() {
    syncActiveFormats();
    syncCaretState();
  }

  useEffect(() => {
    if (!isSupported || !editorMountRef.current || editorRef.current) {
      return;
    }
    editorRef.current = createEditorManager({
      parent: editorMountRef.current,
      onDocChange(text) {
        onTextChange(text);
        onEditorActivity();
      },
      onSelectionChange() {
        onEditorActivity();
        syncEditorUiState();
      },
    });
    editorRef.current.setDocument(documentText);
    lastAppliedRevisionRef.current = documentRevision;
    syncEditorUiState();
    return () => {
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, [isSupported]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || lastAppliedRevisionRef.current === documentRevision) {
      return;
    }
    if (editor.getText() !== documentText) {
      editor.setDocument(documentText);
    }
    lastAppliedRevisionRef.current = documentRevision;
    syncEditorUiState();
  }, [documentRevision, documentText]);

  function applyEditorAction(action: string) {
    editorRef.current?.applyFormat(action);
    editorRef.current?.focus();
    syncActiveFormats();
  }

  function insertTextAtSelection(text: string) {
    editorRef.current?.insertTextAtSelection(text);
    syncEditorUiState();
  }

  function rebuildEditor() {
    editorRef.current?.rebuildFromCurrentText();
    syncEditorUiState();
  }

  useEffect(() => {
    editorRef.current?.setTypewriterMode(typewriterMode);
  }, [typewriterMode]);

  return {
    editorMountRef,
    editorRef,
    activeFormats,
    caret,
    applyEditorAction,
    insertTextAtSelection,
    rebuildEditor,
    syncEditorUiState,
  };
}
