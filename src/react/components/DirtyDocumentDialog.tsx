import React from "react";

import { MdDialog } from "../md3";

type DirtyDocumentDialogProps = {
  open: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
};

export function DirtyDocumentDialog({ open, onCancel, onDiscard, onSave }: DirtyDocumentDialogProps) {
  return (
    <MdDialog id="dirtyDocumentDialog" open={open} onClosed={onCancel}>
      <div slot="headline">Unsaved Changes</div>
      <div slot="content">Save your changes before replacing the current document?</div>
      <div slot="actions">
        <md-text-button id="dirtyCancelButton" onClick={onCancel}>Cancel</md-text-button>
        <md-text-button id="dirtyDiscardButton" onClick={onDiscard}>Discard</md-text-button>
        <md-filled-button id="dirtySaveButton" onClick={onSave}>Save</md-filled-button>
      </div>
    </MdDialog>
  );
}
