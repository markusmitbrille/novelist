import { expect, test } from "@playwright/test";

async function installFileSystemMocks(page) {
  await page.addInitScript(() => {
    window.__NOVELIST_TEST_WRITES__ = [];
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
          async write(value) {
            window.__NOVELIST_TEST_WRITES__.push(String(value));
          },
          async close() {},
        };
      },
    };
    window.showOpenFilePicker = async () => [handle];
    window.showSaveFilePicker = async () => handle;
  });
}

async function gotoApp(page) {
  await installFileSystemMocks(page);
  await page.goto("/docs/index.html?e2e=1");
  await expect(page.locator("#novelistRoot")).toHaveAttribute("data-app-ready", "true");
}

async function clickMenuAction(page, action) {
  const menuByAction = {
    new: "file",
    open: "file",
    save: "file",
    "save-as": "file",
    undo: "edit",
    redo: "edit",
    find: "edit",
    replace: "edit",
    settings: "view",
    "word-count": "view",
    divider: "insert",
    link: "insert",
    image: "insert",
    "fenced-code": "insert",
    footnote: "insert",
    about: "help",
    "heading-1": "format",
    "heading-2": "format",
    "heading-3": "format",
    bold: "format",
    italic: "format",
    strikethrough: "format",
    "inline-code": "format",
    bullet: "format",
    ordered: "format",
    task: "format",
    quote: "format",
  };
  const menuName = menuByAction[action];
  if (!menuName) {
    throw new Error(`No visible menu mapped for action ${action}`);
  }
  await page.locator(`[data-menu-trigger="${menuName}"]`).dispatchEvent("pointerdown", {
    pointerType: "mouse",
    button: 0,
  });
  const item = page.locator(`md-menu-item[data-menu-action="${action}"]`);
  await expect(item).toBeVisible();
  await item.click();
}

test.describe("Novelist", () => {
  test("unsupported browser screen renders without File System Access", async ({ page }) => {
    await page.addInitScript(() => {
      delete window.showOpenFilePicker;
      delete window.showSaveFilePicker;
    });
    await page.goto("/docs/index.html?e2e=unsupported");
    await expect(page.locator("#novelistRoot")).toHaveAttribute("data-app-ready", "false");
    await expect(page.getByText("Novelist requires a Chromium-based browser.")).toBeVisible();
  });

  test("opens, edits, and saves a markdown file", async ({ page }) => {
    await gotoApp(page);

    await clickMenuAction(page, "open");
    await expect(page.locator("#toolbarStatus")).toContainText("Opened.");

    await page.evaluate(() => window.__NOVELIST_TEST_API__.setText("# Chapter\n\nSaved from Chromium."));
    await clickMenuAction(page, "save");

    await expect.poll(async () => page.evaluate(() => window.__NOVELIST_TEST_WRITES__.at(-1))).toBe("# Chapter\n\nSaved from Chromium.");
    await expect(page.locator("#novelistRoot")).toHaveAttribute("data-dirty", "false");
  });

  test("dirty guard blocks New until the user chooses an action", async ({ page }) => {
    await gotoApp(page);
    await page.evaluate(() => window.__NOVELIST_TEST_API__.setText("Keep this draft."));

    await clickMenuAction(page, "new");
    await expect(page.locator("#dirtyDocumentDialog")).toBeVisible();
    await page.locator("#dirtyCancelButton").click();
    await expect.poll(async () => page.evaluate(() => window.__NOVELIST_TEST_API__.getState().text)).toBe("Keep this draft.");

    await clickMenuAction(page, "new");
    await page.locator("#dirtyDiscardButton").click();
    await expect.poll(async () => page.evaluate(() => window.__NOVELIST_TEST_API__.getState().text)).toBe("");
  });

  test("find and replace updates editor text", async ({ page }) => {
    await gotoApp(page);
    await page.evaluate(() => window.__NOVELIST_TEST_API__.setText("Alpha beta Alpha"));

    await clickMenuAction(page, "replace");
    await expect(page.locator("#searchPopup")).toBeVisible();
    await page.locator("#searchQueryInput").evaluate((element) => {
      element.value = "Alpha";
      element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    });
    await page.locator("#searchReplaceInput").evaluate((element) => {
      element.value = "Gamma";
      element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    });
    await page.locator("#searchReplaceAllButton").click();

    await expect.poll(async () => page.evaluate(() => window.__NOVELIST_TEST_API__.getState().text)).toBe("Gamma beta Gamma");
  });

  test("word count updates after repeated dirty edits", async ({ page }) => {
    await gotoApp(page);

    await page.evaluate(() => window.__NOVELIST_TEST_API__.setText("One two"));
    await expect(page.locator(".menubar__caret-text")).toContainText("2 words");

    await page.evaluate(() => window.__NOVELIST_TEST_API__.setText("One two three four"));
    await expect(page.locator(".menubar__caret-text")).toContainText("4 words");
  });

  test("editor settings shows theme picker without horizontal overflow", async ({ page }) => {
    await gotoApp(page);

    await clickMenuAction(page, "settings");
    const dialog = page.locator("#settingsDialog");
    await expect(dialog).toBeVisible();
    await expect(page.locator("#settingsThemePicker")).toBeVisible();
    await expect(page.locator("[data-theme-choice]")).toHaveCount(8);
    await expect(page.locator(".theme-swatch.is-selected")).toHaveCount(1);
    await expect(page.locator("#settingsBackgroundImage")).toHaveCount(0);
    await expect(page.locator("#settingsCurrentLineHighlight")).toHaveCount(0);
    await expect(page.locator("#settingsAutosaveEnabled")).toBeVisible();
    await expect(page.locator("#settingsTypewriterMode")).toBeVisible();

    const overflow = await page.locator("#settingsDialog [slot='content']").evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
    await expect.poll(async () => page.locator("#settingsDialog").evaluate((element) => element.getBoundingClientRect().width)).toBeLessThanOrEqual(500);
    const layout = await page.locator("#settingsDialog").evaluate((dialog) => {
      const content = dialog.querySelector("[slot='content']");
      const grid = dialog.querySelector(".settings-grid");
      const picker = dialog.querySelector("#settingsThemePicker");
      const controls = [
        dialog.querySelector("#settingsFontFamily"),
        dialog.querySelector("#settingsFontSize"),
        dialog.querySelector(".settings-checkbox-row"),
        picker,
      ].filter(Boolean);
      const contentRect = content.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      const pickerRect = picker.getBoundingClientRect();
      return {
        contentLeft: contentRect.left,
        contentRight: contentRect.right,
        gridWidth: gridRect.width,
        pickerWidth: pickerRect.width,
        controlBounds: controls.map((control) => {
          const rect = control.getBoundingClientRect();
          return { left: rect.left, right: rect.right };
        }),
      };
    });
    expect(layout.gridWidth).toBeLessThanOrEqual(layout.contentRight - layout.contentLeft + 1);
    expect(layout.gridWidth).toBeLessThanOrEqual(410);
    expect(layout.pickerWidth).toBeGreaterThanOrEqual(layout.gridWidth - 1);
    expect(layout.pickerWidth).toBeLessThanOrEqual(layout.gridWidth + 1);
    for (const bounds of layout.controlBounds) {
      expect(bounds.left).toBeGreaterThanOrEqual(layout.contentLeft - 1);
      expect(bounds.right).toBeLessThanOrEqual(layout.contentRight + 1);
    }

    await page.locator('[data-theme-choice="sage-light"]').click();
    await expect.poll(async () => page.evaluate(() => document.documentElement.dataset.theme)).toBe("sage-light");

    await page.locator("#settingsAutosaveEnabled").click();
    await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem("novelist:settings:v1")).autosaveEnabled)).toBe(false);
    await page.locator("#settingsTypewriterMode").click();
    await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem("novelist:settings:v1")).typewriterMode)).toBe(true);
  });

  test("word count dialog opens with document stats", async ({ page }) => {
    await gotoApp(page);
    await page.evaluate(() => window.__NOVELIST_TEST_API__.setText("One two three.\n\nFour five."));

    await clickMenuAction(page, "word-count");
    await expect(page.locator("#wordCountDialog")).toBeVisible();
    await expect(page.locator("#wordCountDialogWordCount")).toHaveText("5");
    await expect(page.locator('[data-word-count-stat="characters"] .word-count-dialog__value')).toHaveText("26");
    await expect(page.locator('[data-word-count-stat="characters-no-spaces"] .word-count-dialog__value')).toHaveText("21");
    await expect(page.locator('[data-word-count-stat="paragraphs"] .word-count-dialog__value')).toHaveText("2");
    await expect(page.locator('[data-word-count-stat="lines"] .word-count-dialog__value')).toHaveText("3");
    await expect(page.locator('[data-word-count-stat="reading-time"] .word-count-dialog__value')).toHaveText("1 minute");
  });

  test("selection does not highlight identical text spans", async ({ page }) => {
    await gotoApp(page);
    await page.evaluate(() => window.__NOVELIST_TEST_API__.setText("Alpha beta Alpha"));

    await page.locator(".cm-content").click();
    await page.keyboard.press(process.platform === "darwin" ? "Meta+Home" : "Control+Home");
    for (let index = 0; index < 5; index += 1) {
      await page.keyboard.press("Shift+ArrowRight");
    }
    await page.waitForTimeout(300);

    await expect(page.locator(".cm-selectionMatch, .cm-selectionMatch-main")).toHaveCount(0);
  });

  test("shortcuts and editor chrome use Chromium-safe behavior", async ({ page }) => {
    await gotoApp(page);

    await expect(page.locator("#documentTitleField")).toHaveCount(0);
    await expect(page.locator(".menubar__caret-text")).not.toContainText("Caret");

    await page.keyboard.press(process.platform === "darwin" ? "Meta+G" : "Control+G");
    await expect(page.locator(".cm-panel.cm-search")).toHaveCount(0);
    await expect(page.locator("#searchPopup")).not.toBeVisible();

    await page.keyboard.press(process.platform === "darwin" ? "Meta+F" : "Control+F");
    await expect(page.locator("#searchPopup")).toBeVisible();
    await page.locator("#searchCloseButton").click();

    await page.keyboard.press(process.platform === "darwin" ? "Meta+Shift+H" : "Control+H");
    await expect(page.locator("#searchPopup")).toBeVisible();
    await expect(page.locator("#searchReplaceRow")).toBeVisible();
    await page.locator("#searchCloseButton").click();

    await page.keyboard.press(process.platform === "darwin" ? "Meta+Comma" : "Control+Comma");
    await expect(page.locator("#settingsDialog")).not.toBeVisible();

    await page.keyboard.press(process.platform === "darwin" ? "Meta+Shift+8" : "Control+Shift+8");
    await expect.poll(async () => page.evaluate(() => window.__NOVELIST_TEST_API__.getState().text)).toBe("");

    await page.locator('[data-menu-trigger="edit"]').dispatchEvent("pointerdown", {
      pointerType: "mouse",
      button: 0,
    });
    await expect(page.locator('md-menu-item[data-menu-action="find"]')).toBeVisible();
    await expect(page.locator('md-menu-item[data-menu-action="replace"]')).toBeVisible();
  });

  test("new formatting actions insert markdown", async ({ page }) => {
    await gotoApp(page);
    await page.evaluate(() => window.__NOVELIST_TEST_API__.setText("Alpha"));

    await page.locator(".cm-content").click();
    await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await clickMenuAction(page, "strikethrough");
    await expect.poll(async () => page.evaluate(() => window.__NOVELIST_TEST_API__.getState().text)).toBe("~~Alpha~~");

    await expect(page.locator('[data-format="symbol"]')).toHaveCount(0);
    await expect(page.locator('[data-format="emoji"]')).toHaveCount(0);
  });

  test("app logo opens the About dialog", async ({ page }) => {
    await gotoApp(page);

    await page.locator("#appLogoButton").click();
    await expect(page.locator("#aboutDialog")).toBeVisible();
  });

  test("editor text margins are symmetrical", async ({ page }) => {
    await gotoApp(page);
    const padding = await page.locator(".cm-line").first().evaluate((line) => {
      const styles = getComputedStyle(line);
      return {
        left: styles.paddingLeft,
        right: styles.paddingRight,
      };
    });
    expect(padding.left).toBe(padding.right);
  });
});
