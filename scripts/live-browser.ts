/** Opt-in REAL testnet browser journey. Signing stays in Node/Foundry; no key enters the page. */
import { chromium, expect } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { browserPath } from "./browser-path";
import {
  binary,
  keyArgs,
  ownerAddress,
  loadManifest,
  base,
  reactive,
  stringify,
  artifact,
} from "./config";
import { type Hash, toFunctionSelector } from "viem";
const exec = promisify(execFile);
async function main() {
  if (process.env.LIVE_TESTNET !== "1")
    throw new Error(
      "Set LIVE_TESTNET=1 to authorize this real testnet-only integration journey.",
    );
  if (existsSync("deployments/browser-proof.json")) {
    console.log(
      "Browser journey is already verified; no new deployment or payment sent.",
    );
    return;
  }
  const owner = ownerAddress(),
    m = loadManifest();
  if (!m.token || !m.recipients) throw new Error("Demo deployment missing");
  const sends: {
    chain: number;
    hash: Hash;
    to?: string;
    data: string;
    value: string;
  }[] = existsSync("deployments/browser-transactions.json")
    ? JSON.parse(readFileSync("deployments/browser-transactions.json", "utf8"))
        .transactions
    : [];
  const allowed = new Set(
    [m.token, m.vault, m.reactive, m.callbackProxy, m.systemContract]
      .filter(Boolean)
      .map((v) => v!.toLowerCase()),
  );
  const recoveredDraft: { reactive?: string; vault?: string; bound?: boolean } =
    {};
  for (const tx of sends) {
    const client = tx.chain === 84532 ? base : reactive;
    const receipt = await client.getTransactionReceipt({ hash: tx.hash });
    if (receipt.status !== "success")
      throw new Error(
        `Prior browser transaction failed: ${tx.hash}; inspect before retrying.`,
      );
    if (!tx.to && receipt.contractAddress) {
      allowed.add(receipt.contractAddress.toLowerCase());
      if (tx.data.startsWith(artifact("IncomeFlowReactive").bytecode.object))
        recoveredDraft.reactive = receipt.contractAddress;
      if (tx.data.startsWith(artifact("IncomeVault").bytecode.object))
        recoveredDraft.vault = receipt.contractAddress;
    }
  }
  if (recoveredDraft.reactive) {
    const bound = (await reactive.readContract({
      address: recoveredDraft.reactive as `0x${string}`,
      abi: artifact("IncomeFlowReactive").abi,
      functionName: "vault",
    })) as string;
    recoveredDraft.bound =
      bound.toLowerCase() === recoveredDraft.vault?.toLowerCase();
  }
  const browser = await chromium.launch({
    headless: true,
    executablePath: browserPath(),
    args: ["--no-sandbox"],
  });
  mkdirSync("artifacts/video/raw", { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: "artifacts/video/raw",
      size: { width: 1440, height: 900 },
    },
  });
  await context.exposeBinding(
    "incomeFlowWalletRPC",
    async (
      _source,
      payload: { chain: number; method: string; params: unknown[] },
    ) => {
      console.log("Test wallet RPC:", payload.method);
      if (payload.chain !== 84532 && payload.chain !== 5318007)
        throw new Error("Testnets only");
      const client = payload.chain === 84532 ? base : reactive;
      if (payload.method === "eth_sendTransaction") {
        const t = payload.params[0] as {
          from: string;
          to?: string;
          data?: string;
          value?: string;
        };
        if (t.from.toLowerCase() !== owner.toLowerCase())
          throw new Error("Unexpected signing account");
        const value = BigInt(t.value || "0");
        if (value > 500_000_000_000_000_000n)
          throw new Error("Value exceeds testnet journey limit");
        if (t.to && !allowed.has(t.to.toLowerCase()))
          throw new Error("Target not part of this test deployment");
        if (
          !t.to &&
          !["IncomeVault", "IncomeFlowReactive"].some((n) =>
            (t.data || "").startsWith(artifact(n).bytecode.object),
          )
        )
          throw new Error("Unrecognized deployment bytecode");
        const args = [
          "send",
          "--rpc-url",
          client.transport.url!,
          ...keyArgs(),
          "--async",
          "--value",
          value.toString(),
          ...(t.to
            ? [t.to, "--data", t.data || "0x"]
            : ["--create", t.data || "0x"]),
        ];
        const { stdout } = await exec(binary("cast"), args, {
          timeout: 180_000,
        }).catch((error) => {
          console.error("Encrypted signer failed:", error.stderr || error.code);
          throw new Error("Encrypted test signer failed; inspect the Node log before retrying.");
        });
        const hash = stdout.match(/0x[0-9a-fA-F]{64}/)?.[0] as Hash | undefined;
        if (!hash) throw new Error("Signer returned no transaction hash");
        sends.push({
          chain: payload.chain,
          hash,
          to: t.to,
          data: t.data || "0x",
          value: value.toString(),
        });
        writeFileSync(
          "deployments/browser-transactions.json",
          stringify({ owner, transactions: sends }) + "\n",
        );
        if (!t.to) {
          const receipt = await client.waitForTransactionReceipt({ hash });
          if (receipt.contractAddress)
            allowed.add(receipt.contractAddress.toLowerCase());
        }
        return hash;
      }
      if (
        ![
          "eth_blockNumber",
          "eth_getBalance",
          "eth_getCode",
          "eth_call",
          "eth_estimateGas",
          "eth_gasPrice",
          "eth_maxPriorityFeePerGas",
          "eth_feeHistory",
          "eth_getTransactionCount",
          "eth_getTransactionReceipt",
          "eth_getTransactionByHash",
          "eth_getBlockByNumber",
          "eth_getBlockByHash",
        ].includes(payload.method)
      )
        throw new Error(`Unsupported test wallet RPC method ${payload.method}`);
      return client.request({
        method: payload.method as never,
        params: payload.params as never,
      });
    },
  );
  await context.addInitScript(
    ({ account, draft }) => {
      // tsx preserves function names with this helper; it must exist in the browser realm.
      (globalThis as unknown as { __name: (fn: unknown) => unknown }).__name = (fn) => fn;
      if (draft.reactive)
        try {
          localStorage.setItem(
            `incomeflow.setup.${account.toLowerCase()}`,
            JSON.stringify(draft),
          );
        } catch {}
      let chain = "0x14a34";
      let connected = sessionStorage.getItem("incomeflow.live.connected") === "1";
      const listeners: Record<string, ((value: unknown) => void)[]> = {};
      const provider = {
        isIncomeFlowTestWallet: true,
        on: (event: string, fn: (value: unknown) => void) => {
          (listeners[event] ||= []).push(fn);
        },
        removeListener: (event: string, fn: (value: unknown) => void) => {
          listeners[event] = (listeners[event] || []).filter((x) => x !== fn);
        },
        request: async ({
          method,
          params = [],
        }: {
          method: string;
          params: unknown[];
        }) => {
          console.log("wallet method", method);
          if (method === "eth_requestAccounts") {
            connected = true;
            sessionStorage.setItem("incomeflow.live.connected", "1");
            return [account];
          }
          if (method === "eth_accounts") return connected ? [account] : [];
          if (method === "eth_chainId") return chain;
          if (method === "net_version") return String(parseInt(chain, 16));
          if (method === "wallet_switchEthereumChain") {
            const next = (params[0] as { chainId: string }).chainId;
            if (!["0x14a34", "0x512577"].includes(next))
              throw new Error("Testnets only");
            chain = next;
            for (const fn of listeners.chainChanged || []) fn(chain);
            return null;
          }
          if (method === "wallet_addEthereumChain") return null;
          if (
            method === "wallet_getCapabilities"
          )
            return {};
          if (method === "wallet_requestPermissions" || method === "wallet_getPermissions") return [{ parentCapability: "eth_accounts" }];
          return (
            window as unknown as {
              incomeFlowWalletRPC: (p: unknown) => Promise<unknown>;
            }
          ).incomeFlowWalletRPC({ chain: parseInt(chain, 16), method, params });
        },
      };
      Object.defineProperty(window, "ethereum", {
        value: provider,
        configurable: true,
      });

    },
    { account: owner, draft: recoveredDraft },
  );
  const page = await context.newPage();
  page.on("pageerror", error => console.log("Browser error:", error.message));
  page.on("console", msg => { if (msg.type() === "error" || msg.text().startsWith("wallet method")) console.log(msg.text()); });
  const started = Date.now();
  const marks: Record<string, number> = {};
  const mark = (name: string) => {
    marks[name] = (Date.now() - started) / 1000;
  };
  const root = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3098";
  try {
    await page.goto(root + "/app", {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    // The provider is a real encrypted local signer used only by this test runner, not a simulated wallet popup.
    await page
      .locator("header")
      .getByText("Connect wallet", { exact: true })
      .click();
    const named = page.getByRole("button", {
      name: "IncomeFlow test wallet",
      exact: true,
    });
    if (await named.count()) await named.click();
    else
      await page
        .getByRole("button", { name: "Browser wallet", exact: true })
        .first()
        .click();
    await expect(
      page.getByRole("button", { name: "Create or resume setup" }),
    ).toBeVisible({ timeout: 30_000 });
    mark("setupStart");
    await page.getByRole("button", { name: "Create or resume setup" }).click();
    await Promise.race([
      expect(page.getByRole("heading", { name: "Make your income plan." })).toBeVisible({ timeout: 240_000 }),
      page.locator(".transaction-banner.error").waitFor({ state: "visible", timeout: 240_000 }).then(async () => { throw new Error(await page.locator(".transaction-banner.error").innerText()); }),
    ]);
    mark("rulesReady");
    const newVault = new URL(page.url()).searchParams.get(
      "vault",
    ) as `0x${string}`;
    const version = (await base.readContract({
      address: newVault,
      abi: artifact("IncomeVault").abi,
      functionName: "policyVersion",
    })) as bigint;
    if (version === 0n) {
      for (let i = 0; i < 3; i++)
        await page
          .getByLabel(`Destination ${i + 1} wallet`)
          .fill(m.recipients[i]);
      mark("rulesSave");
      await page.getByRole("button", { name: "Save allocation rules" }).click();
      await expect(page.locator(".transaction-banner")).toContainText(
        "Transaction confirmed",
        { timeout: 120_000 },
      );
    }
    mark("rulesConfirmed");
    const priorCount = (await base.readContract({
      address: newVault,
      abi: artifact("IncomeVault").abi,
      functionName: "paymentCount",
    })) as bigint;
    if (priorCount === 0n) {
      mark("receiveStart");
      await page
        .getByRole("navigation", { name: "Workspace" })
        .getByRole("link", { name: "Receive", exact: true })
        .click();
      await page.getByLabel("Amount to send (ifUSD)").fill("100");
      mark("paymentSend");
      await page
        .getByRole("button", { name: "Send real testnet payment" })
        .click();
      await expect(page.locator(".transaction-banner")).toContainText(
        "Transaction confirmed",
        { timeout: 120_000 },
      );
    }
    const paymentTx = sends.find(t => t.to?.toLowerCase() === m.token!.toLowerCase() && t.data.startsWith(toFunctionSelector("transfer(address,uint256)")));
    if (!paymentTx) throw new Error("No saved real payment transaction.");
    const originReceipt = await base.getTransactionReceipt({hash: paymentTx.hash});
    const historyBefore = String(originReceipt.blockNumber + 199n);
    await page.goto(`${root}/app?vault=${newVault}&view=activity&before=${historyBefore}`, {waitUntil: "domcontentloaded"});
    await expect(
      page.locator(".payment-status").filter({ hasText: "Distribution confirmed" }),
    ).toBeVisible({ timeout: 120_000 });
    mark("distributionConfirmed");
    await page.locator(".payment-row>summary").first().click();
    await expect(page.getByText("Actual recipient transfers")).toBeVisible();
    mark("receiptOpen");
    await page
      .getByRole("navigation", { name: "Workspace" })
      .getByRole("link", { name: "Health", exact: true })
      .click();
    const resumeAlreadyConfirmed = sends.some(t => t.to?.toLowerCase() === newVault.toLowerCase() && t.data === toFunctionSelector("resume()"));
    const isPaused = await base.readContract({address: newVault, abi: artifact("IncomeVault").abi, functionName: "paused"});
    if (!resumeAlreadyConfirmed && !isPaused) {
    await page
      .getByRole("button", { name: "Pause allocations", exact: true })
      .click();
    await expect(page.locator(".transaction-banner")).toContainText(
      "Transaction confirmed",
      { timeout: 120_000 },
    );
    }
    if (!resumeAlreadyConfirmed) {
    await expect(
      page.getByRole("button", { name: "Resume allocations", exact: true }),
    ).toBeVisible({ timeout: 60_000 });
    await page
      .getByRole("button", { name: "Resume allocations", exact: true })
      .click();
    await expect(page.locator(".transaction-banner")).toContainText(
      "Transaction confirmed",
      { timeout: 120_000 },
    );
    }
    await expect(page.getByRole("button", {name: "Pause allocations", exact: true})).toBeVisible({timeout: 60_000});
    mark("ownerControlsVerified");
    await page.goto(`${root}/app?vault=${newVault}&view=activity&before=${historyBefore}`, {waitUntil: "domcontentloaded"});
    await page.locator(".payment-row>summary").first().click();
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".vault-toolbar")).toContainText("Your vault", { timeout: 60_000 });
    await expect(page.locator(".payment-status").filter({ hasText: "Distribution confirmed" })).toBeVisible({ timeout: 60_000 });
    await page.locator(".payment-row>summary").first().click();
    mark("returningOwnerVerified");
    const vault = new URL(page.url()).searchParams.get("vault")!;
    const response = await page.request.get(root + "/api/vault/" + vault + "?before=" + historyBefore);
    const data = await response.json();
    if (
      data.totalDistributed !== "100000000" ||
      data.paymentCount !== "1" ||
      data.payments[0]?.status !== "Distribution confirmed"
    )
      throw new Error("Unexpected real browser-journey chain state");
    writeFileSync(
      "deployments/browser-proof.json",
      stringify({
        checkedAt: new Date().toISOString(),
        description:
          "Genuine UI journey signed through a Node-only encrypted Foundry keystore exposed as an explicitly named EIP-1193 test wallet. No private key entered the browser.",
        vault,
        marks,
        recording: await page.video()?.path(),
        data,
        transactions: sends,
      }) + "\n",
    );
    await page.screenshot({
      path: ".impeccable/review/live-wallet-receipt.png",
      fullPage: true,
    });
    const video = page.video();
    await context.close();
    console.log(
      "Real UI testnet journey verified. Recording:",
      await video?.path(),
    );
  } catch (error) {
    writeFileSync(`artifacts/video/attempt-${started}.json`, stringify({ marks, recording: await page.video()?.path(), error: error instanceof Error ? error.message : String(error) }));
    await page.screenshot({ path: ".impeccable/review/live-wallet-error.png", fullPage: true });
    console.error(await page.locator("main").innerText());
    throw error;
  } finally {
    await context.close().catch(() => {});
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
