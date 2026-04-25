// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
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

function setScrollMetrics(scrollDOM, { scrollTop, clientHeight, scrollHeight }) {
  Object.defineProperty(scrollDOM, "scrollTop", {
    configurable: true,
    writable: true,
    value: scrollTop,
  });
  Object.defineProperty(scrollDOM, "clientHeight", {
    configurable: true,
    value: clientHeight,
  });
  Object.defineProperty(scrollDOM, "scrollHeight", {
    configurable: true,
    value: scrollHeight,
  });
}

afterEach(() => {
  vi.useRealTimers();
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

describe("editor streaming autoscroll", () => {
  it("enabling autoscroll snaps to the end without changing selection", () => {
    const { manager } = createManager();
    manager.setDocument("Alpha\nBeta\nGamma");
    manager.view.dispatch({ selection: EditorSelection.cursor(2) });
    setScrollMetrics(manager.view.scrollDOM, {
      scrollTop: 0,
      clientHeight: 120,
      scrollHeight: 400,
    });

    const dispatchSpy = vi.spyOn(manager.view, "dispatch");
    const selectionBefore = manager.getSelectionRange();

    manager.enableStreamingAutoscroll();

    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      effects: expect.anything(),
    }));
    expect(manager.getSelectionRange()).toEqual(selectionBefore);
    manager.destroy();
  });

  it("appendText includes a scroll effect while autoscroll is enabled", () => {
    const { manager } = createManager();
    manager.setDocument("Alpha");
    setScrollMetrics(manager.view.scrollDOM, {
      scrollTop: 0,
      clientHeight: 120,
      scrollHeight: 400,
    });
    manager.enableStreamingAutoscroll();

    const dispatchSpy = vi.spyOn(manager.view, "dispatch");
    manager.appendText(" Beta");

    expect(dispatchSpy).toHaveBeenLastCalledWith(expect.objectContaining({
      changes: { from: 5, insert: " Beta" },
      effects: expect.anything(),
    }));
    manager.destroy();
  });

  it("scrolling away from the bottom disables autoscroll immediately", () => {
    const { manager } = createManager();
    manager.setDocument("Alpha");
    setScrollMetrics(manager.view.scrollDOM, {
      scrollTop: 280,
      clientHeight: 120,
      scrollHeight: 400,
    });
    manager.enableStreamingAutoscroll();

    manager.view.scrollDOM.scrollTop = 200;
    manager.view.scrollDOM.dispatchEvent(new Event("scroll"));

    const dispatchSpy = vi.spyOn(manager.view, "dispatch");
    manager.appendText(" Beta");

    expect(dispatchSpy).toHaveBeenLastCalledWith(expect.not.objectContaining({
      effects: expect.anything(),
    }));
    manager.destroy();
  });

  it("scrolling back to the bottom re-enables autoscroll", () => {
    const { manager } = createManager();
    manager.setDocument("Alpha");
    setScrollMetrics(manager.view.scrollDOM, {
      scrollTop: 280,
      clientHeight: 120,
      scrollHeight: 400,
    });
    manager.enableStreamingAutoscroll();

    manager.view.scrollDOM.scrollTop = 200;
    manager.view.scrollDOM.dispatchEvent(new Event("scroll"));
    manager.view.scrollDOM.scrollTop = 280;
    manager.view.scrollDOM.dispatchEvent(new Event("scroll"));

    const dispatchSpy = vi.spyOn(manager.view, "dispatch");
    manager.appendText(" Beta");

    expect(dispatchSpy).toHaveBeenLastCalledWith(expect.objectContaining({
      effects: expect.anything(),
    }));
    manager.destroy();
  });

  it("cancels any pending bottom snap when the user detaches before it runs", () => {
    const { manager } = createManager();
    manager.setDocument("Alpha");
    setScrollMetrics(manager.view.scrollDOM, {
      scrollTop: 280,
      clientHeight: 120,
      scrollHeight: 400,
    });

    const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    let pendingFrame = null;
    globalThis.requestAnimationFrame = vi.fn((callback) => {
      pendingFrame = callback;
      return 1;
    });
    globalThis.cancelAnimationFrame = vi.fn(() => {
      pendingFrame = null;
    });

    manager.enableStreamingAutoscroll();
    manager.view.scrollDOM.scrollTop = 200;
    manager.view.scrollDOM.dispatchEvent(new Event("scroll"));
    pendingFrame?.(0);

    expect(manager.view.scrollDOM.scrollTop).toBe(200);
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
    manager.destroy();
  });
});
