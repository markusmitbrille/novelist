// @vitest-environment jsdom

import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import App from "../../src/App";

function installFileSystemMocks() {
  const writes: string[] = [];
  const handle = {
    name: "chapter.md",
    async getFile() {
      return new File(["# Chapter\n\nOpening line."], "chapter.md", { type: "text/markdown" });
    },
    async queryPermission() {
      return "granted";
    },
    async requestPermission() {
      return "granted";
    },
    async createWritable() {
      return {
        async write(value: string) {
          writes.push(String(value));
        },
        async close() {},
      };
    },
  };
  Object.defineProperty(window, "showOpenFilePicker", {
    configurable: true,
    value: vi.fn(async () => [handle]),
  });
  Object.defineProperty(window, "showSaveFilePicker", {
    configurable: true,
    value: vi.fn(async () => handle),
  });
  return { handle, writes };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  delete window.__NOVELIST_TEST_API__;
  delete window.showOpenFilePicker;
  delete window.showSaveFilePicker;
});

describe("Novelist file workflow", () => {
  it("opens a markdown file into the editor session", async () => {
    installFileSystemMocks();
    render(<App />);

    await act(async () => {
      fireEvent.click(document.querySelector('[data-menu-action="open"]') as Element);
    });

    await waitFor(() => {
      expect(window.__NOVELIST_TEST_API__?.getState().fileName).toBe("chapter.md");
    });
    expect(window.__NOVELIST_TEST_API__?.getState().text).toBe("# Chapter\n\nOpening line.");
    expect(screen.getByText(/Opened\./)).toBeTruthy();
  });

  it("saves changes back through the opened file handle", async () => {
    const { writes } = installFileSystemMocks();
    render(<App />);

    await act(async () => {
      fireEvent.click(document.querySelector('[data-menu-action="open"]') as Element);
    });
    await waitFor(() => expect(window.__NOVELIST_TEST_API__?.getState().fileName).toBe("chapter.md"));

    act(() => {
      window.__NOVELIST_TEST_API__?.setText?.("# Chapter\n\nRevised line.");
    });
    await waitFor(() => expect(window.__NOVELIST_TEST_API__?.getState().text).toBe("# Chapter\n\nRevised line."));
    act(() => {
      window.__NOVELIST_TEST_API__?.setSelection?.(11);
    });
    await act(async () => {
      fireEvent.click(document.querySelector('[data-menu-action="save"]') as Element);
    });

    expect(writes.at(-1)).toBe("# Chapter\n\nRevised line.");
    expect(window.__NOVELIST_TEST_API__?.getState().isDirty).toBe(false);
    expect(window.__NOVELIST_TEST_API__?.getSelection?.()?.head).toBe(11);
  });

  it("autosaves edits to the opened file", async () => {
    const { writes } = installFileSystemMocks();
    render(<App />);

    await act(async () => {
      fireEvent.click(document.querySelector('[data-menu-action="open"]') as Element);
    });
    await waitFor(() => expect(window.__NOVELIST_TEST_API__?.getState().fileName).toBe("chapter.md"));

    vi.useFakeTimers();
    act(() => {
      window.__NOVELIST_TEST_API__?.setText?.("Autosaved text.");
    });
    act(() => {
      window.__NOVELIST_TEST_API__?.setSelection?.(9);
    });
    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    vi.useRealTimers();

    await waitFor(() => expect(writes.at(-1)).toBe("Autosaved text."));
    expect(window.__NOVELIST_TEST_API__?.getSelection?.()?.head).toBe(9);
  });

  it("does not autosave when autosave is disabled", async () => {
    const { writes } = installFileSystemMocks();
    localStorage.setItem("novelist:settings:v1", JSON.stringify({ autosaveEnabled: false }));
    render(<App />);

    await act(async () => {
      fireEvent.click(document.querySelector('[data-menu-action="open"]') as Element);
    });
    await waitFor(() => expect(window.__NOVELIST_TEST_API__?.getState().fileName).toBe("chapter.md"));

    vi.useFakeTimers();
    await act(async () => {
      window.__NOVELIST_TEST_API__?.setText?.("Autosave disabled text.");
      vi.advanceTimersByTime(700);
    });
    vi.useRealTimers();

    expect(writes).toEqual([]);
    expect(window.__NOVELIST_TEST_API__?.getState().isDirty).toBe(true);
    expect(document.querySelector("#toolbarStatus")?.textContent).toBe("Unsaved changes.");
  });

  it("saves manually when autosave is disabled", async () => {
    const { writes } = installFileSystemMocks();
    localStorage.setItem("novelist:settings:v1", JSON.stringify({ autosaveEnabled: false }));
    render(<App />);

    await act(async () => {
      fireEvent.click(document.querySelector('[data-menu-action="open"]') as Element);
    });
    await waitFor(() => expect(window.__NOVELIST_TEST_API__?.getState().fileName).toBe("chapter.md"));

    act(() => {
      window.__NOVELIST_TEST_API__?.setText?.("Manual save still works.");
    });
    await act(async () => {
      fireEvent.click(document.querySelector('[data-menu-action="save"]') as Element);
    });

    expect(writes.at(-1)).toBe("Manual save still works.");
    expect(window.__NOVELIST_TEST_API__?.getState().isDirty).toBe(false);
  });

  it("prunes removed settings when loading stored settings", () => {
    installFileSystemMocks();
    localStorage.setItem("novelist:settings:v1", JSON.stringify({
      theme: "ocean-dark",
      fontFamily: "'Times New Roman', Times, serif",
      fontSize: 19,
      backgroundImage: "https://example.com/image.jpg",
      currentLineHighlight: true,
      autosaveEnabled: false,
    }));

    render(<App />);

    const storedSettings = JSON.parse(localStorage.getItem("novelist:settings:v1") || "{}");
    expect(storedSettings).toEqual({
      theme: "ocean-dark",
      fontFamily: "'Times New Roman', Times, serif",
      fontSize: 19,
      autosaveEnabled: false,
      typewriterMode: false,
    });
  });

  it("renders status without obsolete title or caret offset UI", () => {
    installFileSystemMocks();
    render(<App />);

    expect(document.querySelector("#documentTitleField")).toBeNull();
    expect(screen.getByText(/Untitled\.md \| Line 1, Col 1 \| 0 words/)).toBeTruthy();
    expect(document.querySelector(".menubar__caret-text")?.textContent).not.toContain("Caret");
  });

  it("keeps repeated dirty edits reflected in status-derived UI", async () => {
    installFileSystemMocks();
    render(<App />);

    act(() => {
      window.__NOVELIST_TEST_API__?.setText?.("One two");
    });
    expect(screen.getByText(/2 words/)).toBeTruthy();

    act(() => {
      window.__NOVELIST_TEST_API__?.setText?.("One two three four");
    });
    expect(screen.getByText(/4 words/)).toBeTruthy();
    expect(window.__NOVELIST_TEST_API__?.getState().isDirty).toBe(true);
  });

  it("uses Enter and Escape for dialog primary and cancel behavior", async () => {
    const { writes } = installFileSystemMocks();
    render(<App />);

    act(() => {
      window.__NOVELIST_TEST_API__?.setText?.("Dirty draft.");
    });
    await act(async () => {
      fireEvent.click(document.querySelector('[data-menu-action="new"]') as Element);
    });
    await waitFor(() => expect(screen.getByText("Save your changes before replacing the current document?")).toBeTruthy());

    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(window.__NOVELIST_TEST_API__?.getState().text).toBe("Dirty draft.");

    await act(async () => {
      fireEvent.click(document.querySelector('[data-menu-action="new"]') as Element);
    });
    await act(async () => {
      fireEvent.keyDown(document, { key: "Enter" });
    });
    await waitFor(() => expect(writes.at(-1)).toBe("Dirty draft."));
    await waitFor(() => expect(window.__NOVELIST_TEST_API__?.getState().text).toBe(""));
  });

  it("guards dirty documents before replacing them with New", async () => {
    installFileSystemMocks();
    render(<App />);

    act(() => {
      window.__NOVELIST_TEST_API__?.setText?.("Draft that should survive.");
    });
    await act(async () => {
      fireEvent.click(document.querySelector('[data-menu-action="new"]') as Element);
    });

    await waitFor(() => expect(screen.getByText("Save your changes before replacing the current document?")).toBeTruthy());
    await act(async () => {
      fireEvent.click(document.querySelector("#dirtyCancelButton") as Element);
    });
    expect(window.__NOVELIST_TEST_API__?.getState().text).toBe("Draft that should survive.");

    await act(async () => {
      fireEvent.click(document.querySelector('[data-menu-action="new"]') as Element);
    });
    await act(async () => {
      fireEvent.click(document.querySelector("#dirtyDiscardButton") as Element);
    });

    await waitFor(() => expect(window.__NOVELIST_TEST_API__?.getState().text).toBe(""));
    expect(window.__NOVELIST_TEST_API__?.getState().isDirty).toBe(false);
  });

  it("uses Save As for an untitled document", async () => {
    const { writes } = installFileSystemMocks();
    render(<App />);

    act(() => {
      window.__NOVELIST_TEST_API__?.setText?.("Fresh document.");
    });
    await act(async () => {
      fireEvent.click(document.querySelector('[data-menu-action="save-as"]') as Element);
    });

    expect(window.showSaveFilePicker).toHaveBeenCalled();
    expect(writes.at(-1)).toBe("Fresh document.");
  });

  it("opens About from the app logo button", async () => {
    installFileSystemMocks();
    render(<App />);

    await act(async () => {
      fireEvent.click(document.querySelector("#appLogoButton") as Element);
    });

    await waitFor(() => expect(screen.getByText("About Novelist")).toBeTruthy());
  });

  it("shows a Chromium requirement when File System Access is unavailable", () => {
    render(<App />);

    expect(screen.getByText("Novelist requires a Chromium-based browser.")).toBeTruthy();
    expect(window.__NOVELIST_TEST_API__?.getState().unsupported).toBe(true);
  });
});
