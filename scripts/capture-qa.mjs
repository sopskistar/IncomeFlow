import { chromium } from "@playwright/test";
import { browserPath } from "./browser-path.ts";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
const root = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3098";
const out = ".impeccable/review";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: browserPath(),
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const issues = [];
page.on("pageerror", (e) => issues.push(e.message));
for (const [name, width, route] of [
  ["landing-desktop", 1440, "/"],
  ["landing-mobile", 390, "/"],
  ["desktop", 1440, "/app?vault=demo"],
  ["tablet", 768, "/app?vault=demo"],
  ["mobile", 390, "/app?vault=demo"],
  ["narrow", 320, "/app?vault=demo"],
  ["rules-narrow", 320, "/app?vault=demo&view=rules"],
]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(root + route, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.evaluate(() => document.fonts.ready);
  if (route.includes("vault=demo")) {
    await page.locator(".sync-note").waitFor({ timeout: 90000 });
    await page
      .getByRole("button", { name: "Refresh", exact: true })
      .waitFor({ timeout: 30000 });
  }
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  console.log("Captured", name);
}
await page.setViewportSize({ width: 390, height: 900 });
await page.getByRole("button", { name: "Use dark theme" }).click();
await page.screenshot({ path: `${out}/dark-mobile.png`, fullPage: true });
const font = readFileSync("public/fonts/manrope-800.ttf").toString("base64");
const icon = readFileSync("public/brand/mark-dark.svg", "utf8");
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(
  `<style>@font-face{font-family:Brand;src:url(data:font/ttf;base64,${font})}*{box-sizing:border-box}body{margin:0;background:#142f27;color:#f2f7f4;font-family:Brand,sans-serif;padding:64px}svg{width:64px;height:64px}header{display:flex;align-items:center;gap:16px;font-size:32px}h1{font-size:76px;letter-spacing:-3px;line-height:1.08;margin:68px 0 30px}p{font-size:21px;color:#c1d4c9}footer{position:absolute;bottom:52px;right:64px;font-size:16px;color:#c1d4c9}</style><header>${icon}IncomeFlow</header><h1>Give every payment<br>a purpose.</h1><p>Spending. Savings. Tax reserve. Automatically allocated.</p><footer>Built on Reactive Omni. Testnet demonstration.</footer>`,
);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "public/brand/social.png" });
await page.setViewportSize({ width: 512, height: 512 });
await page.setContent(
  `<style>*{box-sizing:border-box}body{margin:0}svg{width:512px;height:512px}</style>${readFileSync("public/brand/icon.svg", "utf8")}`,
);
await page.screenshot({ path: "public/brand/app-icon.png" });
writeFileSync(
  `${out}/browser-errors.json`,
  JSON.stringify(issues, null, 2) + "\n",
);
await browser.close();
if (issues.length) throw new Error(issues.join("\n"));
