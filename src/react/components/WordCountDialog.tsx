import React from "react";

import type { DocumentStats } from "../types";
import { MdDialog } from "../md3";

type WordCountDialogProps = {
  open: boolean;
  stats: DocumentStats;
  onClose: () => void;
};

function formatNumber(value: number) {
  return value.toLocaleString();
}

export function WordCountDialog({ open, stats, onClose }: WordCountDialogProps) {
  const detailRows = [
    { id: "characters", label: "Characters", value: formatNumber(stats.characterCount) },
    { id: "characters-no-spaces", label: "Characters without spaces", value: formatNumber(stats.characterCountNoSpaces) },
    { id: "paragraphs", label: "Paragraphs", value: formatNumber(stats.paragraphCount) },
    { id: "lines", label: "Lines", value: formatNumber(stats.lineCount) },
    { id: "reading-time", label: "Estimated reading time", value: stats.estimatedReadingMinutes === 1 ? "1 minute" : `${formatNumber(stats.estimatedReadingMinutes)} minutes` },
  ];

  return (
    <MdDialog id="wordCountDialog" open={open} onClosed={onClose}>
      <div slot="headline">Word Count</div>
      <div slot="content">
        <div id="wordCountDialogBody" className="word-count-dialog">
          <div className="word-count-dialog__hero">
            <div className="word-count-dialog__eyebrow">Document</div>
            <div className="word-count-dialog__count-row">
              <span id="wordCountDialogWordCount" className="word-count-dialog__count">{formatNumber(stats.wordCount)}</span>
              <span className="word-count-dialog__unit">words</span>
            </div>
            <div className="word-count-dialog__supporting">Current markdown text in the editor.</div>
          </div>
          <md-divider></md-divider>
          <div className="word-count-dialog__section">
            <div className="word-count-dialog__section-title">Document Stats</div>
            <div className="word-count-dialog__list">
              {detailRows.map((row, index) => (
                <React.Fragment key={row.id}>
                  <div className="word-count-dialog__row" data-word-count-stat={row.id}>
                    <span className="word-count-dialog__label">{row.label}</span>
                    <span className="word-count-dialog__value">{row.value}</span>
                  </div>
                  {index < detailRows.length - 1 ? <md-divider></md-divider> : null}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div slot="actions"><md-text-button data-dialog-close="word-count" onClick={onClose}>Close</md-text-button></div>
    </MdDialog>
  );
}
