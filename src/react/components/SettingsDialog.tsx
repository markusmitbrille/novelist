import React from "react";

import { DEFAULT_THEME_ID, THEME_PICKER_ROWS, THEME_PRESETS } from "../../constants";
import type { NovelistSettings } from "../types";
import { MdCheckbox, MdDialog, MdOutlinedSelect, MdOutlinedTextField } from "../md3";
import { renderFontOptions } from "../ui";
import { icon } from "../head-assets";

type SettingsDialogProps = {
  open: boolean;
  settings: NovelistSettings;
  onClose: () => void;
  onUpdate: (updater: (draft: NovelistSettings) => NovelistSettings, rebuildEditor?: boolean) => void;
};

export function SettingsDialog({ open, settings, onClose, onUpdate }: SettingsDialogProps) {
  const selectedTheme = THEME_PRESETS[settings.theme] ? settings.theme : DEFAULT_THEME_ID;

  return (
    <MdDialog id="settingsDialog" open={open} onClosed={onClose}>
      <div slot="headline">Editor Settings</div>
      <div slot="content">
        <div className="settings-grid">
          <MdOutlinedSelect id="settingsFontFamily" label="Font family" value={settings.fontFamily} onChangeValue={(value) => onUpdate((draft) => ({ ...draft, fontFamily: value }), true)}>
            {renderFontOptions(settings.fontFamily)}
          </MdOutlinedSelect>
          <MdOutlinedTextField id="settingsFontSize" label="Font size" type="number" value={String(settings.fontSize)} onChangeValue={(value) => onUpdate((draft) => ({ ...draft, fontSize: Number(value || draft.fontSize) }))} />
          <label className="settings-checkbox-row" htmlFor="settingsAutosaveEnabled">
            <MdCheckbox id="settingsAutosaveEnabled" checked={settings.autosaveEnabled !== false} onChangeChecked={(checked) => onUpdate((draft) => ({ ...draft, autosaveEnabled: checked }))} />
            <span className="settings-checkbox-row__text">
              <span className="settings-checkbox-row__label">Autosave</span>
              <span className="settings-checkbox-row__supporting">Save opened files automatically after edits.</span>
            </span>
          </label>
          <label className="settings-checkbox-row" htmlFor="settingsTypewriterMode">
            <MdCheckbox id="settingsTypewriterMode" checked={settings.typewriterMode === true} onChangeChecked={(checked) => onUpdate((draft) => ({ ...draft, typewriterMode: checked }))} />
            <span className="settings-checkbox-row__text">
              <span className="settings-checkbox-row__label">Typewriter Mode</span>
              <span className="settings-checkbox-row__supporting">Keep the active writing line near the center while typing.</span>
            </span>
          </label>
          <div className="settings-theme-field">
            <div className="settings-theme-field__label">Theme</div>
            <div id="settingsThemePicker" className="theme-picker" role="group" aria-label="Theme">
              {THEME_PICKER_ROWS.map((row, rowIndex) => row.map((themeId, columnIndex) => {
                const preset = THEME_PRESETS[themeId];
                const isSelected = themeId === selectedTheme;
                const cornerClasses = [
                  rowIndex === 0 && columnIndex === 0 ? "is-top-left" : "",
                  rowIndex === 0 && columnIndex === row.length - 1 ? "is-top-right" : "",
                  rowIndex === THEME_PICKER_ROWS.length - 1 && columnIndex === 0 ? "is-bottom-left" : "",
                  rowIndex === THEME_PICKER_ROWS.length - 1 && columnIndex === row.length - 1 ? "is-bottom-right" : "",
                ].filter(Boolean).join(" ");
                const swatchStyle = {
                  "--theme-swatch-color": preset.swatchColor,
                  "--theme-swatch-contrast": preset.tokens["--md-sys-color-on-primary"],
                } as React.CSSProperties;

                return (
                  <div className={`theme-picker__cell ${isSelected ? "is-selected" : ""} ${cornerClasses}`} data-theme-picker-cell key={themeId}>
                    <button
                      type="button"
                      className={`theme-swatch ${isSelected ? "is-selected" : ""}`}
                      data-theme-choice={themeId}
                      aria-label={preset.label}
                      aria-pressed={isSelected ? "true" : "false"}
                      style={swatchStyle}
                      onClick={() => onUpdate((draft) => ({ ...draft, theme: themeId || DEFAULT_THEME_ID }), true)}
                    >
                      <span className="theme-swatch__dot" aria-hidden="true"></span>
                      <span className="theme-swatch__check" aria-hidden="true">{icon("check")}</span>
                    </button>
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      </div>
      <div slot="actions"><md-text-button onClick={onClose}>Close</md-text-button></div>
    </MdDialog>
  );
}
