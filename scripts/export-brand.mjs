import { chromium } from "@playwright/test";
import { readFileSync, copyFileSync, writeFileSync } from "node:fs";
import { browserPath } from "./browser-path.ts";
const browser = await chromium.launch({
  headless: true,
  executablePath: browserPath(),
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
const font = readFileSync("public/fonts/manrope-800.ttf").toString("base64");
const mark = readFileSync("public/brand/mark-dark.svg", "utf8");
await page.setContent(
  `<style>@font-face{font-family:Brand;src:url(data:font/ttf;base64,${font})}*{box-sizing:border-box}body{margin:0;background:#142f27;color:#f2f7f4;font-family:Brand,sans-serif;padding:64px}svg{width:64px;height:64px}header{display:flex;align-items:center;gap:16px;font-size:32px}h1{font-size:76px;letter-spacing:-3px;line-height:1.08;margin:68px 0 30px}p{font-size:21px;color:#c1d4c9}footer{position:absolute;bottom:52px;right:64px;font-size:16px;color:#c1d4c9}</style><header>${mark}IncomeFlow</header><h1>Give every payment<br>a purpose.</h1><p>Spending. Savings. Tax reserve. Automatically allocated.</p><footer>Built on Reactive Omni. Testnet demonstration.</footer>`,
);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "public/brand/social.png" });
copyFileSync("public/brand/social.png", "public/brand/repository-preview.png");
await page.setViewportSize({ width: 512, height: 512 });
await page.setContent(
  `<style>body{margin:0}svg{width:512px;height:512px}</style>${readFileSync("public/brand/icon.svg", "utf8")}`,
);
await page.screenshot({ path: "public/brand/app-icon.png" });
for (const [name, ink] of [
  ["light", "#165d4c"],
  ["dark", "#f1f8f4"],
])
  writeFileSync(
    `public/brand/wordmark-${name}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 64"><title>IncomeFlow</title><path d="M8 32h12c14 0 10-20 24-20h12M20 32h36M20 32c14 0 10 20 24 20h12" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/><text x="76" y="44" font-family="Manrope,sans-serif" font-weight="800" font-size="37" letter-spacing="-1" fill="${ink}">IncomeFlow</text></svg>\n`,
  );
await browser.close();
console.log(
  "Exported original SVG/PNG brand assets. Manrope licensed under OFL.",
);
