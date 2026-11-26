import { chromium } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
/** Reuse a working local Chromium; CI installs the package's exact browser revision. */
export function browserPath(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE)
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (existsSync(chromium.executablePath())) return undefined;
  const root = join(homedir(), ".cache/ms-playwright");
  if (!existsSync(root)) return undefined;
  return readdirSync(root)
    .filter((n) => /^chromium-\d+$/.test(n))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]))
    .map((n) => join(root, n, "chrome-linux64/chrome"))
    .find(existsSync);
}
