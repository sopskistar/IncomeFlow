import { test, expect } from "@playwright/test";
import manifest from "../../deployments/testnet.json" with { type: "json" };
// Explicit local EIP-1193 test double. It never signs, sends or simulates a live callback.
test("wallet network switching, owner rule validation, rejected transaction and disconnect", async ({
  page,
}) => {
  await page.addInitScript(
    ({ account }) => {
      let chain = "0x1";
      let connected = false;
      const listeners: Record<string, ((v: unknown) => void)[]> = {};
      Object.defineProperty(window, "ethereum", {
        value: {
          on: (event: string, fn: (v: unknown) => void) => {
            (listeners[event] ||= []).push(fn);
          },
          removeListener: (event: string, fn: (v: unknown) => void) => {
            listeners[event] = (listeners[event] || []).filter((f) => f !== fn);
          },
          request: async ({
            method,
            params = [],
          }: {
            method: string;
            params: unknown[];
          }) => {
            if (method === "eth_requestAccounts") {
              connected = true;
              return [account];
            }
            if (method === "eth_accounts") return connected ? [account] : [];
            if (method === "eth_chainId") return chain;
            if (method === "wallet_getCapabilities") return {};
            if (
              method === "wallet_requestPermissions" ||
              method === "wallet_getPermissions"
            )
              return [{ parentCapability: "eth_accounts" }];
            if (method === "wallet_revokePermissions") {
              connected = false;
              return null;
            }
            if (method === "wallet_switchEthereumChain") {
              chain = (params[0] as { chainId: string }).chainId;
              for (const fn of listeners.chainChanged || []) fn(chain);
              return null;
            }
            if (method === "wallet_addEthereumChain") return null;
            const error = Object.assign(
              new Error("Test fixture: user rejected transaction."),
              { code: 4001 },
            );
            throw error;
          },
        },
        configurable: true,
      });
    },
    { account: manifest.owner },
  );
  await page.goto("/app?vault=demo&view=rules");
  await page
    .locator("header")
    .getByText("Connect wallet", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Browser wallet", exact: true })
    .click();
  await expect(
    page.getByText("Your wallet is on an unsupported network."),
  ).toBeVisible();
  await page
    .locator("main")
    .getByRole("button", { name: "Switch to Base Sepolia", exact: true })
    .click();
  await expect(
    page.getByText("Your wallet is on an unsupported network."),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Save allocation rules" }),
  ).toBeEnabled();
  await page.getByLabel("Destination 1 percentage").fill("49");
  await page.getByRole("button", { name: "Save allocation rules" }).click();
  await expect(page.locator(".validation-errors")).toContainText(
    "exactly 100%",
  );
  await page.getByLabel("Destination 1 percentage").fill("50");
  await page.getByRole("button", { name: "Save allocation rules" }).click();
  await expect(page.locator(".transaction-banner.error")).toBeVisible();
  await expect(page.locator(".transaction-banner.error")).not.toContainText(
    "Transaction confirmed",
  );
  await page.locator("header .wallet-menu>summary").click();
  await page
    .getByRole("button", { name: "Disconnect wallet", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Save allocation rules" }),
  ).toBeDisabled();
});
