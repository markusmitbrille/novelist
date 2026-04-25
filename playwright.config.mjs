import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/gui",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/serve.js",
    url: "http://127.0.0.1:4173/docs/index.html",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
