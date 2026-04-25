// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { EditorSelection, EditorState } from "@codemirror/state";
import { createEditorManager, expandRangeToWord } from "../../src/editor.js";

function createManager() {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  const manager = createEditorManager({
    parent,
    onDocChange: () => {},
    onSelectionChange: () => {},
  });
  return { parent, manager };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("editor inline formatting targeting", () => {
  it("does not expand to the previous word when the caret is at the end of a word", () => {
    const state = EditorState.create({ doc: "Hello" });
    const range = EditorSelection.cursor(5);
    const expanded = expandRangeToWord(state, range);

    expect(expanded.from).toBe(5);
    expect(expanded.to).toBe(5);
    expect(expanded.empty).toBe(true);
  });

  it("still expands when the caret is inside a word", () => {
    const state = EditorState.create({ doc: "Hello" });
    const range = EditorSelection.cursor(2);
    const expanded = expandRangeToWord(state, range);

    expect(expanded.from).toBe(0);
    expect(expanded.to).toBe(5);
    expect(expanded.empty).toBe(false);
  });

  it("does not expand when the caret is at the start of a word", () => {
    const state = EditorState.create({ doc: "Hello" });
    const range = EditorSelection.cursor(0);
    const expanded = expandRangeToWord(state, range);

    expect(expanded.from).toBe(0);
    expect(expanded.to).toBe(0);
    expect(expanded.empty).toBe(true);
  });
});

describe("editor markdown commands", () => {
  it("applies heading and inline formatting commands", () => {
    const { manager } = createManager();
    manager.setDocument("Title");
    manager.view.dispatch({ selection: EditorSelection.range(0, 5) });
    manager.applyFormat("heading-1");
    expect(manager.getText()).toBe("# Title");
    manager.view.dispatch({ selection: EditorSelection.range(2, 7) });
    manager.applyFormat("bold");
    expect(manager.getText()).toBe("# **Title**");
    manager.destroy();
  });

  it("replace all changes every match in the active document", () => {
    const { manager } = createManager();
    manager.setDocument("Alpha beta Alpha");
    const query = manager.createSearchQuery("Alpha", { caseSensitive: true });
    manager.replaceAllRanges(manager.findMatches(query), "Gamma");
    expect(manager.getText()).toBe("Gamma beta Gamma");
    manager.destroy();
  });
});
