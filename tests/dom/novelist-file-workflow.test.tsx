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
    await act(async () => {
      fireEvent.click(document.querySelector('[data-menu-action="save"]') as Element);
    });

    expect(writes.at(-1)).toBe("# Chapter\n\nRevised line.");
    expect(window.__NOVELIST_TEST_API__?.getState().isDirty).toBe(false);
  });

  it("autosaves edits to the opened file", async () => {
    const { writes } = installFileSystemMocks();
    render(<App />);

    await act(async () => {
      fireEvent.click(document.querySelector('[data-menu-action="open"]') as Element);
    });
    await waitFor(() => expect(window.__NOVELIST_TEST_API__?.getState().fileName).toBe("chapter.md"));

    vi.useFakeTimers();
    await act(async () => {
      window.__NOVELIST_TEST_API__?.setText?.("Autosaved text.");
      vi.advanceTimersByTime(700);
    });
    vi.useRealTimers();

    await waitFor(() => expect(writes.at(-1)).toBe("Autosaved text."));
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

  it("shows a Chromium requirement when File System Access is unavailable", () => {
    render(<App />);

    expect(screen.getByText("Novelist requires a Chromium-based browser.")).toBeTruthy();
    expect(window.__NOVELIST_TEST_API__?.getState().unsupported).toBe(true);
  });
});
