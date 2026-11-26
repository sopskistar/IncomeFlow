/** Genuine read-only request and receipt capture. No injected wallet or fictional chain data. */
import { chromium, expect } from "@playwright/test";
import { browserPath } from "./browser-path.ts";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { encodePassport } from "../src/lib/passport.ts";
const root = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3098";
const out = process.env.PASSPORT_QA_OUTPUT || ".impeccable/passport";
mkdirSync(out, { recursive: true });
const proof = JSON.parse(
  readFileSync("deployments/passport-proof.json", "utf8"),
);
const partial = {
  ...proof.passport,
  associations: proof.passport.associations.slice(0, 1),
};
const browser = await chromium.launch({
  headless: true,
  executablePath: browserPath(),
  args: ["--no-sandbox"],
});
const errors = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
for (const [name, width, route] of [
  ["desktop", 1440, "/passport-demo?view=owner"],
  ["tablet", 768, "/passport-demo"],
  ["mobile", 390, "/passport-demo"],
  ["partial-mobile", 390, `/pay#${encodePassport(partial)}`],
  ["narrow", 320, "/passport-demo"],
  ["owner-mobile", 390, "/passport-demo?view=owner"],
  ["landing-desktop", 1440, "/"],
  ["landing-mobile", 390, "/"],
]) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(root + route, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  if (route.includes("passport-demo") || route.startsWith("/pay#"))
    await expect(
      page.getByText("Owner-signed request verified", { exact: true }),
    ).toBeVisible({ timeout: 90000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    errors.push(`${name}: horizontal overflow`);
}
await page.setViewportSize({ width: 390, height: 1000 });
await page.goto(root + "/passport-demo?view=owner");
await expect(
  page.getByText("Owner-signed request verified", { exact: true }),
).toBeVisible({ timeout: 90000 });
await page.getByRole("button", { name: "Use dark theme" }).click();
await page.screenshot({ path: `${out}/owner-dark-mobile.png`, fullPage: true });
await context.close();
if (process.env.PASSPORT_SKIP_VIDEO === "1") {
  await browser.close();
  writeFileSync(
    out + "/capture.json",
    JSON.stringify(
      {
        root,
        checkedAt: new Date().toISOString(),
        errors,
        source:
          "Read-only responsive capture; existing signed request and receipts.",
      },
      null,
      2,
    ) + "\n",
  );
  if (errors.length) process.exitCode = 1;
} else {
  const film = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: "artifacts/video/passport/raw",
      size: { width: 1280, height: 800 },
    },
  });
  const video = await film.newPage();
  let from = Date.now();
  const marks = {};
  const mark = (n) => {
    marks[n] = (Date.now() - from) / 1000;
  };
  await video.goto(root + "/");
  await video.evaluate(() => document.fonts.ready);
  mark("landing");
  await video.waitForTimeout(2500);
  await video
    .getByRole("link", { name: "Create a payment request", exact: true })
    .click();
  mark("empty-request");
  await video.waitForTimeout(1800);

  await video.goto(`${root}/pay#${encodePassport(partial)}`);
  await expect(
    video.getByText("Owner-signed request verified", { exact: true }),
  ).toBeVisible({ timeout: 90000 });
  mark("partial");
  await video.locator(".passport-summary").scrollIntoViewIfNeeded();
  await video.waitForTimeout(4500);
  await video.goto(root + "/passport-demo");
  await expect(
    video.getByText("Owner-signed request verified", { exact: true }),
  ).toBeVisible({ timeout: 90000 });
  mark("settled-client");
  await video.locator(".passport-summary").scrollIntoViewIfNeeded();
  await video.waitForTimeout(4500);
  await video.locator(".passport-payment").first().scrollIntoViewIfNeeded();
  await video.waitForTimeout(3500);
  await video.goto(root + "/passport-demo?view=owner");
  await expect(
    video.getByText("Owner-signed request verified", { exact: true }),
  ).toBeVisible({ timeout: 90000 });
  mark("full-passport");
  await video.locator(".passport-summary").scrollIntoViewIfNeeded();
  await video.waitForTimeout(3500);
  await video.locator(".passport-payment").first().scrollIntoViewIfNeeded();
  mark("proof-first");
  await video.waitForTimeout(5000);
  await video.locator(".passport-payment").nth(1).scrollIntoViewIfNeeded();
  mark("proof-second");
  await video.waitForTimeout(5000);
  const recording = await video.video().path();
  await film.close();
  await browser.close();
  const report = {
    root,
    checkedAt: new Date().toISOString(),
    errors,
    recording,
    marks,
    source:
      "Genuine live RPC reads of the original signed request and its first/all association sets. No injected wallet, no signing or new transaction.",
  };
  writeFileSync(out + "/capture.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  if (errors.length) process.exitCode = 1;
}
