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

  it("applies expanded markdown formatting commands", () => {
    const { manager } = createManager();
    manager.setDocument("Alpha\nBeta");
    manager.view.dispatch({ selection: EditorSelection.range(0, manager.getText().length) });
    manager.applyFormat("ordered");
    expect(manager.getText()).toBe("1. Alpha\n2. Beta");

    manager.applyFormat("ordered");
    expect(manager.getText()).toBe("Alpha\nBeta");

    manager.applyFormat("task");
    expect(manager.getText()).toBe("- [ ] Alpha\n- [ ] Beta");

    manager.setDocument("marked");
    manager.view.dispatch({ selection: EditorSelection.range(0, 6) });
    manager.applyFormat("strikethrough");
    expect(manager.getText()).toBe("~~marked~~");

    manager.setDocument("value");
    manager.view.dispatch({ selection: EditorSelection.range(0, 5) });
    manager.applyFormat("inline-code");
    expect(manager.getText()).toBe("`value`");
    manager.destroy();
  });

  it("inserts markdown snippets", () => {
    const { manager } = createManager();
    manager.setDocument("Start");
    manager.view.dispatch({ selection: EditorSelection.cursor(5) });
    manager.applyFormat("image");
    expect(manager.getText()).toBe("Start![alt text](image.png)");

    manager.setDocument("Start");
    manager.view.dispatch({ selection: EditorSelection.cursor(5) });
    manager.applyFormat("fenced-code");
    expect(manager.getText()).toBe("Start\n\n```\ncode\n```");

    manager.setDocument("Start");
    manager.view.dispatch({ selection: EditorSelection.cursor(5) });
    manager.applyFormat("footnote");
    expect(manager.getText()).toBe("Start[^1]\n\n[^1]: Footnote text");
    manager.destroy();
  });

  it("places the caret after inserted line formatting stubs", () => {
    const { manager } = createManager();
    manager.setDocument("");
    manager.applyFormat("heading-1");
    expect(manager.getText()).toBe("# ");
    expect(manager.getSelectionRange().head).toBe(2);

    manager.setDocument("");
    manager.applyFormat("bullet");
    expect(manager.getText()).toBe("- ");
    expect(manager.getSelectionRange().head).toBe(2);

    manager.setDocument("");
    manager.applyFormat("ordered");
    expect(manager.getText()).toBe("1. ");
    expect(manager.getSelectionRange().head).toBe(3);

    manager.setDocument("");
    manager.applyFormat("task");
    expect(manager.getText()).toBe("- [ ] ");
    expect(manager.getSelectionRange().head).toBe(6);

    manager.setDocument("");
    manager.applyFormat("quote");
    expect(manager.getText()).toBe("> ");
    expect(manager.getSelectionRange().head).toBe(2);
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
