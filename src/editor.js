import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { redo, undo, indentWithTab, defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { bracketMatching, defaultHighlightStyle, foldGutter, foldKeymap, HighlightStyle, indentOnInput, syntaxHighlighting, syntaxTree } from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
import { EditorSelection, EditorState, RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { Decoration, drawSelection, dropCursor, EditorView, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers, rectangularSelection, crosshairCursor } from "@codemirror/view";
import { SearchCursor, SearchQuery } from "@codemirror/search";
import { GFM } from "@lezer/markdown";
import { tags } from "@lezer/highlight";

const markdownHighlightStyle = HighlightStyle.define([
  { tag: tags.heading, fontWeight: "700", color: "var(--cm-heading)" },
  { tag: tags.heading1, fontSize: "1.6em", fontWeight: "700", color: "var(--cm-heading)" },
  { tag: tags.heading2, fontSize: "1.35em", fontWeight: "700", color: "var(--cm-heading)" },
  { tag: tags.heading3, fontSize: "1.15em", fontWeight: "700", color: "var(--cm-heading)" },
  { tag: [tags.heading4, tags.heading5, tags.heading6], fontSize: "1em", fontWeight: "700", color: "var(--cm-heading)" },
  { tag: tags.strong, fontWeight: "800", color: "var(--cm-strong)" },
  { tag: tags.emphasis, fontStyle: "italic", color: "var(--cm-emphasis)" },
  { tag: tags.link, color: "var(--cm-link)", textDecoration: "underline" },
  { tag: tags.quote, color: "var(--cm-quote)", fontStyle: "italic" },
  { tag: tags.list, color: "var(--cm-list)" },
  { tag: tags.processingInstruction, color: "var(--cm-meta)" },
]);

const setSearchDecorationsEffect = StateEffect.define();
const clearSearchDecorationsEffect = StateEffect.define();

const searchDecorationsField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(value, transaction) {
    value = value.map(transaction.changes);
    for (const effect of transaction.effects) {
      if (effect.is(clearSearchDecorationsEffect)) {
        return Decoration.none;
      }
      if (effect.is(setSearchDecorationsEffect)) {
        return buildSearchDecorations(effect.value);
      }
    }
    return value;
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

function buildSearchDecorations(value = {}) {
  const builder = new RangeSetBuilder();
  if (value.scope && value.scope.from < value.scope.to) {
    builder.add(value.scope.from, value.scope.to, Decoration.mark({ class: "cm-search-scope" }));
  }
  for (const match of value.matches || []) {
    const isActive = value.activeMatch && value.activeMatch.from === match.from && value.activeMatch.to === match.to;
    builder.add(
      match.from,
      match.to,
      Decoration.mark({ class: isActive ? "cm-search-match cm-search-match--active" : "cm-search-match" })
    );
  }
  return builder.finish();
}

function createEditorTheme() {
  return EditorView.theme({
    "&": {
      height: "100%",
      color: "var(--text-main)",
      backgroundColor: "transparent",
      fontSize: "var(--editor-font-size)",
    },
    "&.cm-editor": {
      height: "100%",
      display: "flex",
      flexDirection: "column",
    },
    ".cm-scroller": {
      flex: "1 1 auto",
      height: "100%",
      overflow: "auto",
      padding: "2rem 0 3.5rem",
      fontFamily: "var(--editor-font-family)",
    },
    ".cm-content": {
      minHeight: "100%",
      caretColor: "var(--accent)",
      lineHeight: "1.72",
      padding: "0 0 40vh",
      fontFamily: "var(--editor-font-family)",
    },
    ".cm-line": {
      paddingLeft: "3.65rem",
      paddingRight: "3.65rem",
    },
    ".cm-activeLine": {
      background: "var(--cm-active-line)",
    },
    ".cm-activeLineGutter": {
      background: "var(--cm-active-gutter-bg)",
      color: "var(--cm-active-gutter-text)",
    },
    ".cm-focused": {
      outline: "none",
    },
    ".cm-selectionBackground": {
      background: "var(--cm-selection) !important",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--md-sys-color-primary)",
    },
    ".cm-gutters": {
      display: "none",
    },
    ".cm-selectionLayer .cm-selectionBackground": {
      background: "var(--cm-selection)",
    },
  });
}

function getSelectedLines(state, range = state.selection.main) {
  const effectiveTo = range.empty ? range.to : Math.max(range.from, range.to - 1);
  const startLine = state.doc.lineAt(range.from).number;
  const endLine = state.doc.lineAt(effectiveTo).number;
  const lines = [];
  for (let lineNumber = startLine; lineNumber <= endLine; lineNumber += 1) {
    lines.push(state.doc.line(lineNumber));
  }
  return lines;
}

function lineStartsWithPrefix(line, prefix) {
  return line.text.startsWith(prefix);
}

function lineStartsWithPattern(line, pattern) {
  return pattern.test(line.text);
}

function lineHeadingLevel(line) {
  const match = /^(#{1,6})\s+/.exec(line.text);
  return match ? match[1].length : 0;
}

function allSelectedLinesMatch(state, predicate, range = state.selection.main) {
  const lines = getSelectedLines(state, range);
  return lines.length > 0 && lines.every(predicate);
}

function findAncestorOfType(state, position, typeName) {
  let node = syntaxTree(state).resolveInner(position, 0);
  while (node) {
    if (node.name === typeName) {
      return node;
    }
    node = node.parent;
  }
  return null;
}

function rangeInsideInlineFormat(state, range, typeName, markerLength) {
  const positions = range.empty
    ? [range.from, Math.max(0, range.from - 1)]
    : [range.from];

  for (const position of positions) {
    const node = findAncestorOfType(state, position, typeName);
    if (!node) {
      continue;
    }
    if (range.from >= node.from + markerLength && range.to <= node.to - markerLength) {
      return true;
    }
  }
  return false;
}

function getActiveFormats(state) {
  const range = state.selection.main;
  return {
    "heading-1": allSelectedLinesMatch(state, (line) => lineHeadingLevel(line) === 1, range),
    "heading-2": allSelectedLinesMatch(state, (line) => lineHeadingLevel(line) === 2, range),
    "heading-3": allSelectedLinesMatch(state, (line) => lineHeadingLevel(line) === 3, range),
    bold: rangeInsideInlineFormat(state, range, "StrongEmphasis", 2),
    italic: rangeInsideInlineFormat(state, range, "Emphasis", 1),
    strikethrough: rangeInsideInlineFormat(state, range, "Strikethrough", 2),
    "inline-code": rangeInsideInlineFormat(state, range, "InlineCode", 1),
    bullet: allSelectedLinesMatch(state, (line) => lineStartsWithPrefix(line, "- "), range),
    ordered: allSelectedLinesMatch(state, (line) => lineStartsWithPattern(line, /^\d+\.\s+/), range),
    task: allSelectedLinesMatch(state, (line) => lineStartsWithPattern(line, /^- \[[ xX]\]\s+/), range),
    quote: allSelectedLinesMatch(state, (line) => lineStartsWithPrefix(line, "> "), range),
  };
}

export function expandRangeToWord(state, range) {
  if (!range.empty) {
    return range;
  }

  const word = state.wordAt(range.from);
  if (!word || range.from <= word.from || range.from >= word.to) {
    return range;
  }

  return EditorSelection.range(word.from, word.to);
}

function createState(docText, onDocChange, onSelectionChange, options = {}) {
  return EditorState.create({
    doc: docText,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      markdown({ extensions: [GFM] }),
      keymap.of([
        indentWithTab,
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
      ]),
      EditorView.lineWrapping,
      syntaxHighlighting(markdownHighlightStyle),
      createEditorTheme(),
      searchDecorationsField,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onDocChange(update.state.doc.toString(), update.state);
          if (options.isTypewriterModeEnabled?.()) {
            update.view.dispatch({
              effects: EditorView.scrollIntoView(update.state.selection.main.head, { y: "center" }),
            });
          }
        }
        if (update.docChanged || update.selectionSet) {
          onSelectionChange(update.state);
        }
      }),
    ],
  });
}

function applyWrapFormatting(view, prefix, suffix = prefix, placeholder = "") {
  const transaction = view.state.changeByRange((range) => {
    const effectiveRange = expandRangeToWord(view.state, range);
    const selectedText = view.state.sliceDoc(effectiveRange.from, effectiveRange.to) || placeholder;
    const insertText = `${prefix}${selectedText}${suffix}`;
    const anchor = effectiveRange.from + prefix.length;
    const head = anchor + selectedText.length;
    return {
      changes: { from: effectiveRange.from, to: effectiveRange.to, insert: insertText },
      range: EditorSelection.range(anchor, head),
    };
  });
  view.dispatch(transaction);
  view.focus();
}

function unwrapInlineFormat(view, typeName, markerLength) {
  const nodesToUnwrap = [];
  const seen = new Set();

  for (const range of view.state.selection.ranges) {
    const node = findAncestorOfType(view.state, range.from, typeName);
    if (!node || !rangeInsideInlineFormat(view.state, range, typeName, markerLength)) {
      return false;
    }
    const key = `${node.from}:${node.to}`;
    if (!seen.has(key)) {
      seen.add(key);
      nodesToUnwrap.push(node);
    }
  }

  const changes = [];
  for (const node of nodesToUnwrap.sort((a, b) => b.from - a.from)) {
    changes.push(
      { from: node.to - markerLength, to: node.to },
      { from: node.from, to: node.from + markerLength }
    );
  }

  view.dispatch({ changes });
  view.focus();
  return true;
}

function toggleWrapFormatting(view, typeName, prefix, suffix = prefix, placeholder = "") {
  const markerLength = prefix.length;
  const allActive = view.state.selection.ranges.every((range) =>
    rangeInsideInlineFormat(view.state, range, typeName, markerLength)
  );
  if (allActive) {
    unwrapInlineFormat(view, typeName, markerLength);
    return;
  }
  applyWrapFormatting(view, prefix, suffix, placeholder);
}

function toggleLinePrefix(view, prefix) {
  const lines = getSelectedLines(view.state);
  const allActive = lines.every((line) => lineStartsWithPrefix(line, prefix));
  const changes = [];
  let nextCursor = null;
  for (const line of lines) {
    if (allActive) {
      changes.push({ from: line.from, to: line.from + prefix.length });
    } else if (!lineStartsWithPrefix(line, prefix)) {
      changes.push({ from: line.from, insert: prefix });
      if (view.state.selection.main.empty && line.from <= view.state.selection.main.head && view.state.selection.main.head <= line.to) {
        nextCursor = line.from + prefix.length;
      }
    }
  }
  view.dispatch({
    changes,
    selection: nextCursor == null ? undefined : EditorSelection.cursor(nextCursor),
  });
  view.focus();
}

function toggleLinePattern(view, pattern, createPrefix) {
  const lines = getSelectedLines(view.state);
  const allActive = lines.every((line) => pattern.test(line.text));
  const changes = [];
  let nextCursor = null;
  lines.forEach((line, index) => {
    const match = pattern.exec(line.text);
    if (allActive && match) {
      changes.push({ from: line.from, to: line.from + match[0].length });
    } else if (!match) {
      const prefix = createPrefix(index, line);
      changes.push({ from: line.from, insert: prefix });
      if (view.state.selection.main.empty && line.from <= view.state.selection.main.head && view.state.selection.main.head <= line.to) {
        nextCursor = line.from + prefix.length;
      }
    }
  });
  view.dispatch({
    changes,
    selection: nextCursor == null ? undefined : EditorSelection.cursor(nextCursor),
  });
  view.focus();
}

function toggleHeading(view, level) {
  const prefix = `${"#".repeat(level)} `;
  const lines = getSelectedLines(view.state);
  const allActive = lines.every((line) => lineHeadingLevel(line) === level);
  const changes = [];
  let nextCursor = null;
  for (const line of lines) {
    const currentLevel = lineHeadingLevel(line);
    if (currentLevel > 0) {
      changes.push({ from: line.from, to: line.from + currentLevel + 1 });
    }
    if (!allActive) {
      changes.push({ from: line.from, insert: prefix });
      if (view.state.selection.main.empty && line.from <= view.state.selection.main.head && view.state.selection.main.head <= line.to) {
        nextCursor = line.from + prefix.length;
      }
    }
  }
  view.dispatch({
    changes,
    selection: nextCursor == null ? undefined : EditorSelection.cursor(nextCursor),
  });
  view.focus();
}

function insertDivider(view) {
  const { from, to } = view.state.selection.main;
  const before = view.state.sliceDoc(0, from);
  const after = view.state.sliceDoc(to);
  const beforeBreaks = (before.match(/\n*$/)?.[0].length) || 0;
  const afterBreaks = (after.match(/^\n*/)?.[0].length) || 0;
  const prefix = before.length === 0 ? "" : beforeBreaks >= 2 ? "" : "\n".repeat(2 - beforeBreaks);
  const suffix = after.length === 0 ? "" : afterBreaks >= 2 ? "" : "\n".repeat(2 - afterBreaks);
  const insertText = `${prefix}---${suffix}`;
  const dividerStart = from + prefix.length;

  view.dispatch({
    changes: { from, to, insert: insertText },
    selection: EditorSelection.cursor(dividerStart + 3),
  });
  view.focus();
}

function insertBlock(view, text, cursorOffset = text.length) {
  const { from, to } = view.state.selection.main;
  const before = view.state.sliceDoc(0, from);
  const after = view.state.sliceDoc(to);
  const prefix = before.length === 0 || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const suffix = after.length === 0 || after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
  const insertText = `${prefix}${text}${suffix}`;
  const start = from + prefix.length;
  view.dispatch({
    changes: { from, to, insert: insertText },
    selection: EditorSelection.cursor(start + cursorOffset),
    scrollIntoView: true,
  });
  view.focus();
}

function insertFootnote(view) {
  const text = view.state.doc.toString();
  const ids = [...text.matchAll(/\[\^(\d+)\]/g)].map((match) => Number(match[1])).filter(Number.isFinite);
  const nextId = Math.max(0, ...ids) + 1;
  const { from, to } = view.state.selection.main;
  const marker = `[^${nextId}]`;
  const definition = `\n\n[^${nextId}]: Footnote text`;
  view.dispatch({
    changes: [
      { from, to, insert: marker },
      { from: view.state.doc.length, insert: definition },
    ],
    selection: EditorSelection.cursor(from + marker.length),
    scrollIntoView: true,
  });
  view.focus();
}

export function createEditorManager(options) {
  const { parent, onDocChange, onSelectionChange = () => {} } = options;
  let typewriterMode = false;
  const isTypewriterModeEnabled = () => typewriterMode;
  let view = new EditorView({
    state: createState("", onDocChange, onSelectionChange, { isTypewriterModeEnabled }),
    parent,
  });

  return {
    get view() {
      return view;
    },
    setDocument(text) {
      view.setState(createState(text, onDocChange, onSelectionChange, { isTypewriterModeEnabled }));
      onSelectionChange(view.state);
    },
    getText() {
      return view.state.doc.toString();
    },
    createSearchQuery(searchText, options = {}) {
      return new SearchQuery({
        search: String(searchText || ""),
        caseSensitive: options.caseSensitive === true,
        literal: true,
        regexp: false,
        wholeWord: false,
      });
    },
    findMatches(query, scope = null) {
      if (!(query instanceof SearchQuery) || !query.valid || !query.search) {
        return [];
      }
      const from = scope ? Math.max(0, scope.from) : 0;
      const to = scope ? Math.min(view.state.doc.length, scope.to) : view.state.doc.length;
      const normalize = query.caseSensitive ? undefined : (value) => value.toLowerCase();
      const cursor = new SearchCursor(view.state.doc, query.search, from, to, normalize);
      const matches = [];
      for (cursor.next(); !cursor.done; cursor.next()) {
        matches.push({ from: cursor.value.from, to: cursor.value.to });
      }
      return matches;
    },
    getSelectionRange() {
      const range = view.state.selection.main;
      return {
        from: range.from,
        to: range.to,
        head: range.head,
        anchor: range.anchor,
        empty: range.empty,
      };
    },
    getCaretInfo() {
      const range = view.state.selection.main;
      const line = view.state.doc.lineAt(range.head);
      return {
        offset: range.head,
        line: line.number,
        column: (range.head - line.from) + 1,
      };
    },
    setSelection(index) {
      view.dispatch({
        selection: EditorSelection.cursor(Math.min(index, view.state.doc.length)),
      });
    },
    selectAndRevealRange(range, options = {}) {
      if (!range) {
        return;
      }
      view.dispatch({
        selection: EditorSelection.range(range.from, range.to),
        scrollIntoView: true,
      });
      if (options.focus !== false) {
        view.focus();
      }
    },
    replaceRange(range, replacement, options = {}) {
      if (!range) {
        return null;
      }
      const insertText = String(replacement ?? "");
      const nextRange = { from: range.from, to: range.from + insertText.length };
      view.dispatch({
        changes: { from: range.from, to: range.to, insert: insertText },
        selection: EditorSelection.range(nextRange.from, nextRange.to),
        scrollIntoView: true,
      });
      if (options.focus !== false) {
        view.focus();
      }
      return nextRange;
    },
    replaceAllRanges(ranges, replacement, options = {}) {
      if (!Array.isArray(ranges) || ranges.length === 0) {
        return;
      }
      const insertText = String(replacement ?? "");
      view.dispatch({
        changes: [...ranges]
          .sort((left, right) => right.from - left.from)
          .map((range) => ({ from: range.from, to: range.to, insert: insertText })),
      });
      if (options.focus !== false) {
        view.focus();
      }
    },
    setSearchDecorations(value) {
      view.dispatch({
        effects: setSearchDecorationsEffect.of(value),
      });
    },
    clearSearchDecorations() {
      view.dispatch({
        effects: clearSearchDecorationsEffect.of(null),
      });
    },
    insertTextAtSelection(text, options = {}) {
      const insertText = String(text ?? "");
      const transaction = view.state.changeByRange((range) => {
        const anchor = range.from + (options.select?.from ?? insertText.length);
        const head = range.from + (options.select?.to ?? options.select?.from ?? insertText.length);
        return {
          changes: { from: range.from, to: range.to, insert: insertText },
          range: EditorSelection.range(anchor, head),
        };
      });
      view.dispatch(transaction);
      view.focus();
    },
    setTypewriterMode(enabled) {
      typewriterMode = Boolean(enabled);
    },
    focus() {
      view.focus();
    },
    rebuildFromCurrentText() {
      const text = view.state.doc.toString();
      const selection = view.state.selection.main.head;
      view.setState(createState(text, onDocChange, onSelectionChange, { isTypewriterModeEnabled }));
      view.dispatch({ selection: EditorSelection.cursor(Math.min(selection, text.length)) });
    },
    destroy() {
      view.destroy();
    },
    getActiveFormats() {
      return getActiveFormats(view.state);
    },
    applyFormat(action) {
      switch (action) {
        case "heading-1":
          toggleHeading(view, 1);
          break;
        case "heading-2":
          toggleHeading(view, 2);
          break;
        case "heading-3":
          toggleHeading(view, 3);
          break;
        case "bold":
          toggleWrapFormatting(view, "StrongEmphasis", "**");
          break;
        case "italic":
          toggleWrapFormatting(view, "Emphasis", "*");
          break;
        case "strikethrough":
          toggleWrapFormatting(view, "Strikethrough", "~~");
          break;
        case "inline-code":
          toggleWrapFormatting(view, "InlineCode", "`", "`", "code");
          break;
        case "bullet":
          toggleLinePrefix(view, "- ");
          break;
        case "ordered":
          toggleLinePattern(view, /^\d+\.\s+/, (index) => `${index + 1}. `);
          break;
        case "task":
          toggleLinePattern(view, /^- \[[ xX]\]\s+/, () => "- [ ] ");
          break;
        case "quote":
          toggleLinePrefix(view, "> ");
          break;
        case "divider":
          insertDivider(view);
          break;
        case "link":
          applyWrapFormatting(view, "[", "](https://example.com)", "link text");
          break;
        case "image":
          applyWrapFormatting(view, "![", "](image.png)", "alt text");
          break;
        case "fenced-code":
          insertBlock(view, "```\ncode\n```", 4);
          break;
        case "footnote":
          insertFootnote(view);
          break;
        case "undo":
          undo(view);
          break;
        case "redo":
          redo(view);
          break;
        default:
          break;
      }
    },
  };
}
