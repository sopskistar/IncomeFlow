/** Read-only connection to the existing encrypted test account. No signature or send is implemented. */
import { chromium, expect } from "@playwright/test";
import { browserPath } from "./browser-path";
import { ownerAddress } from "./config";
import { encodePassport, parsePassport, storageKey } from "../src/lib/passport";
import { mkdirSync, writeFileSync } from "node:fs";
import proof from "../deployments/passport-proof.json";
const owner = ownerAddress();
if (owner.toLowerCase() !== proof.owner.toLowerCase())
  throw new Error("Encrypted account differs from the verified owner.");
const root = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3098";
const out = process.env.PASSPORT_QA_OUTPUT || ".impeccable/passport";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: browserPath(),
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
await context.addInitScript(
  ({ owner, key, archive }) => {
    (globalThis as unknown as { __name: (fn: unknown) => unknown }).__name = (
      fn,
    ) => fn;
    if (!localStorage.getItem(key)) localStorage.setItem(key, archive);
    let connected =
      sessionStorage.getItem("passport-readonly-connected") === "1";
    const listeners: Record<string, ((v: unknown) => void)[]> = {};
    Object.defineProperty(window, "ethereum", {
      configurable: true,
      value: {
        on: (e: string, f: (v: unknown) => void) =>
          (listeners[e] ||= []).push(f),
        removeListener: () => {},
        request: async ({ method }: { method: string }) => {
          if (method === "eth_chainId") return "0x14a34";
          if (method === "eth_accounts") return connected ? [owner] : [];
          if (method === "eth_requestAccounts") {
            connected = true;
            sessionStorage.setItem("passport-readonly-connected", "1");
            return [owner];
          }
          if (method === "wallet_getCapabilities") return {};
          if (
            method === "wallet_requestPermissions" ||
            method === "wallet_getPermissions"
          )
            return [{ parentCapability: "eth_accounts" }];
          throw new Error(
            "Read-only encrypted-account inspection. Signing and transactions disabled.",
          );
        },
      },
    });
  },
  {
    owner,
    key: storageKey(owner),
    archive: JSON.stringify({
      version: 1,
      chainId: 84532,
      owner,
      passports: [proof.passport],
    }),
  },
);
const page = await context.newPage();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
const network: { path: string; failure?: string; status?: number }[] = [];
page.on("requestfailed", (request) =>
  network.push({
    path: new URL(request.url()).pathname,
    failure: request.failure()?.errorText,
  }),
);
page.on("response", (response) => {
  if (response.status() >= 400)
    network.push({
      path: new URL(response.url()).pathname,
      status: response.status(),
    });
});
try {
  await page.goto(root + "/passport");
  await page
    .locator("header")
    .getByText("Connect wallet", { exact: true })
    .click();
  await page.getByRole("button", { name: "Browser wallet", exact: true }).click();
  await page.getByRole("button", { name: proof.passport.request.title }).click();
  await expect(
    page.getByText("Owner-signed request verified", { exact: true }),
  ).toBeVisible({ timeout: 90000 });
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.screenshot({
      path: `${out}/returning-owner-${width}.png`,
      fullPage: true,
    });
    if (
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    )
      errors.push(`owner-${width} overflow`);
  }
  // Inspect the unsigned confirmation against the original signed link version.
  await page.goto(
    `${root}/passport#${encodePassport(parsePassport({ ...proof.passport, associations: [] }))}`,
  );
  await expect(
    page.getByText("Owner-signed request verified", { exact: true }),
  ).toBeVisible({ timeout: 90000 });
  await page
    .getByLabel("Origin transaction hash", { exact: true })
    .fill(proof.passport.associations[0].transactionHash);
  await page
    .getByLabel("Transfer log index", { exact: true })
    .fill(String(proof.passport.associations[0].logIndex));
  await page
    .getByRole("button", { name: "Review payment association", exact: true })
    .click();
  await page.screenshot({
    path: `${out}/association-confirmation-narrow.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Cancel association", exact: true })
    .click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "New request", exact: true }).click();
  await page
    .getByLabel("Job or project title")
    .fill(proof.passport.request.title);
  await page
    .getByLabel("Description (optional)")
    .fill(
      "Unsigned UI review preview. No new payment request is signed or associated.",
    );
  await page.getByLabel("Amount requested (ifUSD)").fill("100");
  await page.getByLabel("Your IncomeFlow vault").fill(proof.vault);
  await page.getByLabel("Expected payer wallet (optional)").fill(owner);
  await page.screenshot({ path: `${out}/request-creation.png`, fullPage: true });
  await page.getByRole("button", { name: "Review request", exact: true }).click();
  await page.screenshot({ path: `${out}/signing-review.png`, fullPage: true });
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.screenshot({
    path: `${out}/signing-review-narrow.png`,
    fullPage: true,
  });
} catch (error) {
  await page
    .screenshot({ path: `${out}/capture-failure.png`, fullPage: true })
    .catch(() => {});
  writeFileSync(
    `${out}/capture-failure.json`,
    JSON.stringify(
      { checkedAt: new Date().toISOString(), error: String(error), network, pageErrors: errors },
      null,
      2,
    ) + "\n",
  );
  throw error;
} finally {
  await context.close();
  await browser.close();
}
writeFileSync(
  out + "/owner-capture.json",
  JSON.stringify(
    {
      root,
      checkedAt: new Date().toISOString(),
      owner,
      errors,
      network,
      mode: "Read-only encrypted-account connection; genuine saved signatures verified; unsigned form preview; no signing or transaction method.",
    },
    null,
    2,
  ) + "\n",
);
if (errors.length) throw new Error(errors.join(";"));
