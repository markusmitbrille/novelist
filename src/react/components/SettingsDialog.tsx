import React from "react";

import type { NovelistSettings } from "../types";
import { MdCheckbox, MdDialog, MdOutlinedSelect, MdOutlinedTextField } from "../md3";
import { renderFontOptions } from "../ui";

type SettingsDialogProps = {
  open: boolean;
  settings: NovelistSettings;
  onClose: () => void;
  onUpdate: (updater: (draft: NovelistSettings) => NovelistSettings, rebuildEditor?: boolean) => void;
};

export function SettingsDialog({ open, settings, onClose, onUpdate }: SettingsDialogProps) {
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
