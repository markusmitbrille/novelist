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
  await page.locator(`md-menu-item[data-menu-action="${action}"]`).evaluate((element) => element.click());
}

test.describe("Novelist", () => {
  test("opens, edits, and saves a markdown file", async ({ page }) => {
    await gotoApp(page);

    await clickMenuAction(page, "open");
    await expect(page.locator("#toolbarStatus")).toContainText("Opened.");

    await page.evaluate(() => window.__NOVELIST_TEST_API__.setText("# Chapter\n\nSaved from Chromium."));
    await clickMenuAction(page, "save");

    await expect.poll(async () => page.evaluate(() => window.__NOVELIST_TEST_WRITES__.at(-1))).toBe("# Chapter\n\nSaved from Chromium.");
    await expect(page.locator("#novelistRoot")).toHaveAttribute("data-dirty", "false");
  });

  test("find and replace updates editor text", async ({ page }) => {
    await gotoApp(page);
    await page.evaluate(() => window.__NOVELIST_TEST_API__.setText("Alpha beta Alpha"));

    await clickMenuAction(page, "replace");
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
});
