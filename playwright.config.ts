import { defineConfig, devices, chromium } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
const browserCache = join(homedir(), ".cache/ms-playwright");
const installedBrowser = existsSync(chromium.executablePath())
  ? undefined
  : existsSync(browserCache)
    ? readdirSync(browserCache)
        .filter((x) => /^chromium-\d+$/.test(x))
        .sort()
        .reverse()
        .map((x) => join(browserCache, x, "chrome-linux64/chrome"))
        .find(existsSync)
    : undefined;
export default defineConfig({
  testDir: "tests/browser",
  timeout: 120_000,
  expect: { timeout: 30_000 },
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3097",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || installedBrowser,
    },
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: process.env.CI
          ? "npm run start -- --port 3097"
          : "npm run dev -- --port 3097",
        url: "http://localhost:3097",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
