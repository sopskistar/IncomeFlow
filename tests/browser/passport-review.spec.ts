import { test, expect } from "@playwright/test";
import manifest from "../../deployments/testnet.json" with { type: "json" };
import proof from "../../deployments/passport-proof.json" with { type: "json" };
import { readFile } from "node:fs/promises";
// Non-signing EIP-1193 fixture for form and recovery regressions. Live signing is separately proven.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ account }) => {
      let connected = false;
      const listeners: Record<string, ((v: unknown) => void)[]> = {};
      Object.defineProperty(window, "ethereum", {
        configurable: true,
        value: {
          on: (e: string, f: (v: unknown) => void) =>
            (listeners[e] ||= []).push(f),
          removeListener: () => {},
          request: async ({ method }: { method: string }) => {
            if (method === "eth_chainId") return "0x14a34";
            if (method === "eth_accounts") return connected ? [account] : [];
            if (method === "eth_requestAccounts") {
              connected = true;
              return [account];
            }
            if (
              method === "wallet_requestPermissions" ||
              method === "wallet_getPermissions"
            )
              return [{ parentCapability: "eth_accounts" }];
            if (method === "wallet_getCapabilities") return {};
            if (method === "wallet_switchEthereumChain") return null;
            throw Object.assign(
              new Error("Test fixture: user rejected signing."),
              { code: 4001 },
            );
          },
        },
      });
    },
    { account: manifest.owner },
  );
  await page.goto("/passport");
  await page
    .locator("header")
    .getByText("Connect wallet", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Browser wallet", exact: true })
    .click();
  await expect(page.getByLabel("Job or project title")).toBeVisible();
});
test("signing review shows exact intent and editing preserves payer and due date", async ({
  page,
}) => {
  const due = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  await page
    .getByLabel("Job or project title")
    .fill("Illustrative review regression");
  await page.getByLabel("Amount requested (ifUSD)").fill("100.000001");
  await page.getByLabel("Your IncomeFlow vault").fill(proof.vault);
  await page
    .getByLabel("Expected payer wallet (optional)")
    .fill(manifest.owner);
  await page.getByLabel("Due date (optional, UTC)").fill(due);
  await page
    .getByRole("button", { name: "Review request", exact: true })
    .click();
  await expect(page.locator(".passport-amount")).toContainText("100.000001");
  await expect(
    page.getByRole("heading", { name: "Illustrative review regression" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit request", exact: true }).click();
  await expect(page.getByLabel("Expected payer wallet (optional)")).toHaveValue(
    manifest.owner,
  );
  await expect(page.getByLabel("Due date (optional, UTC)")).toHaveValue(due);
  await page
    .getByRole("button", { name: "Review request", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Sign and create request", exact: true })
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    /reject/i,
  );
  await expect(
    page.getByText("Owner-signed request verified", { exact: true }),
  ).toHaveCount(0);
});
test("owner can restore signed records, refresh and export a versioned backup without signing", async ({
  page,
}) => {
  const archive = {
    version: 1,
    chainId: 84532,
    owner: manifest.owner,
    passports: [proof.passport],
  };
  await page.getByLabel("Import backup", { exact: true }).setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(archive)),
  });
  await expect(
    page.getByText("Backup verified and restored.", { exact: true }),
  ).toBeVisible({ timeout: 90000 });
  await page
    .getByRole("button", { name: proof.passport.request.title })
    .click();
  await expect(
    page.getByText("Owner-signed request verified", { exact: true }),
  ).toBeVisible({ timeout: 90000 });
  const got = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export backup", exact: true })
    .click();
  const downloaded = await got;
  const data = JSON.parse(await readFile((await downloaded.path())!, "utf8"));
  expect(data).toEqual(archive);
  await page.reload();
  await page
    .locator("header")
    .getByText("Connect wallet", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Browser wallet", exact: true })
    .click();
  await page
    .getByRole("button", { name: proof.passport.request.title })
    .click();
  await expect(
    page.getByText("Owner-signed request verified", { exact: true }),
  ).toBeVisible({ timeout: 90000 });
});
