import React from "react";

import { icon } from "../head-assets";
import { formatTooltipLabel } from "../ui";

const QUICK_ACTIONS = ["undo", "redo"];
const FORMAT_ACTIONS: Array<[string, string, string]> = [
  ["heading-1", "format_h1", "Heading 1"],
  ["heading-2", "format_h2", "Heading 2"],
  ["heading-3", "format_h3", "Heading 3"],
  ["bold", "format_bold", "Bold"],
  ["italic", "format_italic", "Italic"],
  ["bullet", "format_list_bulleted", "Bullet List"],
  ["quote", "format_quote", "Blockquote"],
  ["divider", "horizontal_rule", "Horizontal Rule"],
  ["link", "link", "Link"],
];

const TOGGLE_ACTIONS = new Set(["heading-1", "heading-2", "heading-3", "bold", "italic", "bullet", "quote"]);

type FormatBarProps = {
  activeFormats: Record<string, boolean>;
  onMenuAction: (action: string) => void | Promise<void>;
};

function actionTooltip(label: string, action: string) {
  return formatTooltipLabel(label, action);
}

export function FormatBar(props: FormatBarProps) {
  const { activeFormats, onMenuAction } = props;

  return (
    <div className="formatbar">
      <div className="formatbar__group">
        {QUICK_ACTIONS.map((action) => (
          <md-icon-button key={action} aria-label={action[0].toUpperCase() + action.slice(1)} data-tooltip={actionTooltip(action[0].toUpperCase() + action.slice(1), action)} data-format={action} onClick={() => onMenuAction(action)}>
            {icon(action)}
          </md-icon-button>
        ))}
      </div>
      <div className="formatbar__divider"></div>
      <div className="formatbar__group">
        {FORMAT_ACTIONS.map(([action, materialIcon, label]) => (
          <md-icon-button key={action} toggle={TOGGLE_ACTIONS.has(action) ? true : undefined} selected={activeFormats?.[action] ? true : undefined} aria-label={label} data-tooltip={actionTooltip(label, action)} data-format={action} onClick={() => onMenuAction(action)}>
            {icon(materialIcon)}
          </md-icon-button>
        ))}
      </div>
    </div>
  );
}
