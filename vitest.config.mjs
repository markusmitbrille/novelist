import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.{js,ts,tsx}"],
    environmentMatchGlobs: [
      ["tests/dom/**/*.test.{js,ts,tsx}", "jsdom"],
    ],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html", "json-summary"],
      exclude: [
        "dist/**",
        "node_modules/**",
        "scripts/**",
        "tests/**",
      ],
    },
  },
});
