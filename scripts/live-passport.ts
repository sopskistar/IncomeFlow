/** Opt-in real testnet acceptance. Node-only encrypted signer; no keys enter Chromium.
 * Resumes persisted hashes. Exactly two supported-token payments (40 + 60) at most.
 */
import { chromium, expect } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { decodeFunctionData, erc20Abi, type Hex, zeroHash } from "viem";
import {
  binary,
  keyArgs,
  ownerAddress,
  base,
  reactive,
  stringify,
} from "./config";
import { browserPath } from "./browser-path";
import {
  parseRequest,
  requestTypedData,
  associationTypedData,
  parsePassport,
  requestDigest,
  encodePassport,
  storageKey,
  type Passport,
} from "../src/lib/passport";
import manifest from "../deployments/testnet.json";
import previous from "../deployments/browser-proof.json";
const exec = promisify(execFile),
  owner = ownerAddress();
if (process.env.LIVE_TESTNET !== "1")
  throw new Error("Explicit LIVE_TESTNET=1 required.");
const url = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3098";
if (!/^http:\/\/localhost:3098$/.test(url))
  throw new Error(
    "Signer restricted to trusted local production build on port 3098.",
  );
const path = "deployments/passport-proof.json";
type State = {
  owner: string;
  vault: string;
  passport?: Passport;
  transactions: { hash: Hex; amount: string }[];
  evidence: unknown[];
  completed?: string;
  recordings?: { path?: string; marks: Record<string, number> }[];
  recording?: { path?: string; marks: Record<string, number> };
};
const vault = (previous as unknown as { vault: string }).vault;
if (!vault)
  throw new Error("Read the prior acceptance manifest for the existing vault.");
const state: State = existsSync(path)
  ? JSON.parse(readFileSync(path, "utf8"))
  : { owner, vault, transactions: [], evidence: [] };
if (
  state.owner.toLowerCase() !== owner.toLowerCase() ||
  state.vault.toLowerCase() !== vault.toLowerCase()
)
  throw new Error("Checkpoint owner/vault mismatch.");
const persist = () => writeFileSync(path, stringify(state) + "\n");
if (state.completed) {
  console.log("Previously completed Passport acceptance:", state.completed);
  process.exit(0);
}
if (
  (await base.getChainId()) !== 84532 ||
  (await reactive.getChainId()) !== 5318007
)
  throw new Error("Testnet chain mismatch.");
const pre =
  state.transactions.length === 2
    ? {
        notice:
          "Read-only resumption; no additional funding or transaction permitted.",
      }
    : await fetch(`${url}/api/vault/${vault}?fresh=1`).then((r) => r.json());
if (
  state.transactions.length < 2 &&
  (pre.owner.toLowerCase() !== owner.toLowerCase() ||
    pre.paused ||
    pre.policyVersion !== "1" ||
    pre.health.vaultDebt !== "0" ||
    pre.health.reactiveDebt !== "0" ||
    !pre.health.subscribed ||
    BigInt(pre.health.vaultBalance) < 100000000000000n ||
    BigInt(pre.health.reactiveBalance) < 50000000000000000n)
)
  throw new Error("Existing vault automation prerequisites not satisfied.");
const [eth, tokens] = await Promise.all([
  base.getBalance({ address: owner }),
  base.readContract({
    address: manifest.token as Hex,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [owner],
  }),
]);
if (
  eth < 100000000000000n ||
  tokens <
    100000000n - state.transactions.reduce((s, t) => s + BigInt(t.amount), 0n)
)
  throw new Error(
    "Insufficient existing testnet balances; no funding attempted.",
  );
console.log(
  "Existing balances and funded, active, zero-debt subscription checked. No deployment or faucet.",
);
mkdirSync("artifacts/video/passport/raw", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: browserPath(),
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  recordVideo: {
    dir: "artifacts/video/passport/raw",
    size: { width: 1440, height: 1000 },
  },
});
let newHash: Hex | undefined;
await context.exposeBinding(
  "passportRPC",
  async (
    _source,
    { method, params = [] }: { method: string; params: unknown[] },
  ) => {
    if (method === "eth_signTypedData_v4") {
      if (String(params[0]).toLowerCase() !== owner.toLowerCase())
        throw new Error("Unexpected account.");
      const typed = JSON.parse(String(params[1]));
      if (
        typed.domain.name !== "IncomeFlow Payment Passport" ||
        Number(typed.domain.chainId) !== 84532 ||
        typed.domain.verifyingContract.toLowerCase() !== vault.toLowerCase()
      )
        throw new Error("Unrecognized signing domain.");
      if (typed.primaryType === "PaymentRequest") {
        if (state.passport)
          throw new Error(
            "Existing signed request checkpoint must be resumed.",
          );
        const r = parseRequest({
          ...typed.message,
          version: 1,
          chainId: 84532,
          issuedAt: Number(typed.message.issuedAt),
          dueAt: Number(typed.message.dueAt),
          validUntil: Number(typed.message.validUntil),
        });
        if (
          r.amount !== "100000000" ||
          r.owner.toLowerCase() !== owner.toLowerCase()
        )
          throw new Error("Unexpected request.");
        const canonical = requestTypedData(r);
        const { stdout } = await exec(
          binary("cast"),
          ["wallet", "sign", "--data", stringify(canonical), ...keyArgs()],
          { timeout: 60000 },
        );
        const signature = stdout.trim() as Hex;
        state.passport = parsePassport({
          version: 1,
          request: r,
          signature,
          associations: [],
        });
        persist();
        return signature;
      }
      if (typed.primaryType === "PaymentAssociation" && state.passport) {
        const m = typed.message;
        const a = {
          transactionHash: m.transactionHash as Hex,
          logIndex: Number(m.logIndex),
          destinationHash: m.destinationHash || zeroHash,
          reactiveHash: m.reactiveHash || zeroHash,
        };
        if (
          m.requestDigest !== requestDigest(state.passport.request) ||
          !state.transactions.some(
            (t) => t.hash.toLowerCase() === a.transactionHash.toLowerCase(),
          )
        )
          throw new Error(
            "Association outside this request and recorded payments.",
          );
        const { stdout } = await exec(
          binary("cast"),
          [
            "wallet",
            "sign",
            "--data",
            stringify(associationTypedData(state.passport.request, a)),
            ...keyArgs(),
          ],
          { timeout: 60000 },
        );
        return stdout.trim();
      }
      throw new Error("Unsupported typed signature.");
    }
    if (method === "eth_sendTransaction") {
      const t = params[0] as {
        from: string;
        to: string;
        data: Hex;
        value?: Hex;
      };
      if (
        t.from.toLowerCase() !== owner.toLowerCase() ||
        t.to.toLowerCase() !== manifest.token.toLowerCase() ||
        BigInt(t.value || "0") !== 0n
      )
        throw new Error("Only this test token payment is allowed.");
      const decoded = decodeFunctionData({ abi: erc20Abi, data: t.data });
      const targetAmount =
        state.transactions.length === 0 ? 40000000n : 60000000n;
      if (
        state.transactions.length >= 2 ||
        decoded.functionName !== "transfer" ||
        String(decoded.args[0]).toLowerCase() !== vault.toLowerCase() ||
        decoded.args[1] !== targetAmount
      )
        throw new Error("Unexpected or duplicate payment.");
      const { stdout } = await exec(
        binary("cast"),
        [
          "send",
          "--async",
          "--rpc-url",
          base.transport.url!,
          ...keyArgs(),
          t.to,
          "--data",
          t.data,
        ],
        { timeout: 120000 },
      );
      const hash = stdout.match(/0x[a-f0-9]{64}/i)?.[0] as Hex;
      if (!hash)
        throw new Error("No broadcast hash; inspect nonce before retry.");
      state.transactions.push({ hash, amount: targetAmount.toString() });
      persist();
      newHash = hash;
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
      ].includes(method)
    )
      throw new Error(`Unsupported RPC ${method}`);
    return base.request({ method, params } as never);
  },
);
await context.addInitScript(
  ({ owner, archive, key }) => {
    (globalThis as unknown as { __name: (fn: unknown) => unknown }).__name = (
      fn,
    ) => fn;
    if (archive && !localStorage.getItem(key))
      localStorage.setItem(key, archive);
    let connected = sessionStorage.getItem("passport-connected") === "1";
    const listeners: Record<string, ((v: unknown) => void)[]> = {};
    Object.defineProperty(window, "ethereum", {
      configurable: true,
      value: {
        on: (e: string, f: (v: unknown) => void) =>
          (listeners[e] ||= []).push(f),
        removeListener: (e: string, f: (v: unknown) => void) => {
          listeners[e] = (listeners[e] || []).filter((x) => x !== f);
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
            sessionStorage.setItem("passport-connected", "1");
            return [owner];
          }
          if (method === "eth_accounts") return connected ? [owner] : [];
          if (method === "eth_chainId") return "0x14a34";
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
          if (
            method === "wallet_switchEthereumChain" ||
            method === "wallet_addEthereumChain"
          )
            return null;
          return (
            window as unknown as {
              passportRPC: (v: unknown) => Promise<unknown>;
            }
          ).passportRPC({ method, params });
        },
      },
    });
  },
  {
    owner,
    archive: state.passport
      ? stringify({
          version: 1,
          chainId: 84532,
          owner,
          passports: [state.passport],
        })
      : "",
    key: storageKey(owner),
  },
);
const page = await context.newPage();
const filmStart = Date.now();
if (state.recording) (state.recordings ||= []).push(state.recording);
state.recording = { marks: {} };
const mark = (name: string) => {
  state.recording!.marks[name] = (Date.now() - filmStart) / 1000;
  persist();
};
page.on("pageerror", (e) => console.error("Page error:", e.message));
async function connect() {
  if (
    await page.evaluate(
      () => sessionStorage.getItem("passport-connected") === "1",
    )
  ) {
    await expect(page.locator("header .wallet-menu summary")).toBeVisible();
    return;
  }
  if (
    await page
      .locator("header")
      .getByText("Connect wallet", { exact: true })
      .isVisible()
  ) {
    await page
      .locator("header")
      .getByText("Connect wallet", { exact: true })
      .click();
    await page
      .getByRole("button", { name: "Browser wallet", exact: true })
      .click();
  }
}
try {
  await page.goto(url + "/passport");
  await connect();
  if (!state.passport) {
    mark("request-start");
    await page
      .getByLabel("Job or project title")
      .fill("Website design — illustrative test job");
    await page.getByLabel("Amount requested (ifUSD)").fill("100");
    await page.getByLabel("Your IncomeFlow vault").fill(vault);
    await page.getByLabel("Expected payer wallet (optional)").fill(owner);
    await page
      .getByLabel("Description (optional)")
      .fill(
        "Illustrative freelancer scenario. Genuine testnet engineering payments, not commercial income.",
      );
    await page
      .getByRole("button", { name: "Review request", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Sign and create request", exact: true })
      .click();
    await expect(
      page.getByText("Owner-signed request verified", { exact: true }),
    ).toBeVisible({ timeout: 90000 });
  } else {
    await page
      .getByRole("button", { name: state.passport.request.title })
      .click();
    await expect(
      page.getByText("Owner-signed request verified", { exact: true }),
    ).toBeVisible({ timeout: 90000 });
  }
  for (let i = 0; i < 2; i++) {
    const p = state.passport!;
    mark(`payment-${i}-start`);
    if (!state.transactions[i]) {
      await page.goto(`${url}/pay#${encodePassport(p)}`);
      await connect();
      await expect(
        page.getByText("Owner-signed request verified", { exact: true }),
      ).toBeVisible({ timeout: 90000 });
      await page
        .getByLabel("Payment amount (ifUSD)")
        .fill(i === 0 ? "40" : "60");
      await page
        .getByRole("button", { name: "Pay test ifUSD", exact: true })
        .click();
      await expect
        .poll(() => state.transactions.length, { timeout: 90000 })
        .toBe(i + 1);
      await base.waitForTransactionReceipt({ hash: newHash! });
      await expect(
        page.getByRole("status").filter({ hasText: "Transfer confirmed:" }),
      ).toBeVisible({ timeout: 90000 });
    }
    mark(`payment-${i}-sent`);
    const tx = state.transactions[i];
    const receipt = await base.getTransactionReceipt({ hash: tx.hash });
    if (receipt.status !== "success")
      throw new Error("Existing payment reverted; stop without repeating it.");
    let payment = state.evidence.find(
      (e) =>
        (e as { originHash?: string }).originHash?.toLowerCase() ===
        tx.hash.toLowerCase(),
    ) as Record<string, unknown> | undefined;
    if (!payment)
      await expect
        .poll(
          async () => {
            const d = await fetch(`${url}/api/vault/${vault}?fresh=1`).then(
              (r) => r.json(),
            );
            payment = d.payments?.find(
              (x: { originHash: string }) =>
                x.originHash?.toLowerCase() === tx.hash.toLowerCase(),
            );
            return payment?.status;
          },
          { timeout: 120000, intervals: [2000, 4000] },
        )
        .toBe("Distribution confirmed");
    mark(`association-${i}-start`);
    if (
      !state.passport!.associations.some((a) => a.transactionHash === tx.hash)
    ) {
      await page.goto(url + "/passport");
      await connect();
      await page.getByRole("button", { name: p.request.title }).click();
      await expect(
        page.getByText("Owner-signed request verified", { exact: true }),
      ).toBeVisible({ timeout: 90000 });
      await page
        .getByLabel("Origin transaction hash", { exact: true })
        .fill(tx.hash);
      await page
        .getByLabel("Transfer log index", { exact: true })
        .fill(String(payment!.logIndex));
      await page
        .getByText("Optional callback and Reactive evidence", { exact: true })
        .click();
      await page
        .getByLabel("Destination callback transaction hash")
        .fill(String(payment!.destinationHash));
      if (payment!.reactiveHash)
        await page
          .getByLabel("Reactive transaction hash", { exact: true })
          .fill(String(payment!.reactiveHash));
      await page
        .getByRole("button", {
          name: "Review payment association",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", {
          name: "Sign association",
          exact: true,
        })
        .click();
      await expect(
        page.getByText(
          "Owner association signed; transfer verified and counted once.",
          { exact: true },
        ),
      ).toBeVisible({ timeout: 90000 });
      const archive = await page.evaluate(
        (key) => localStorage.getItem(key),
        storageKey(owner),
      );
      state.passport = JSON.parse(archive!).passports[0];
      state.evidence[i] = payment;
      persist();
    }
    mark(`association-${i}-complete`);
    await page.screenshot({
      path: `artifacts/video/passport/${i === 0 ? "partial" : "settled"}.png`,
      fullPage: true,
    });
  }
  mark("returning-owner");
  await page.reload();
  await connect();
  await page
    .getByRole("button", { name: state.passport!.request.title })
    .click();
  await expect(
    page.getByText("Owner-signed request verified", { exact: true }),
  ).toBeVisible({ timeout: 90000 });
  await expect(page.locator(".passport-summary")).toContainText("100 ifUSD");
  await expect(page.locator(".passport-summary")).toContainText("0 ifUSD");
  await expect(
    page.getByText("Allocation confirmed", { exact: true }),
  ).toHaveCount(2);
  const response = await fetch(`${url}/api/passport/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: stringify(state.passport),
  });
  const data = await response.json();
  if (
    !response.ok ||
    data.outstanding !== "0" ||
    data.paid !== "100000000" ||
    data.failures.length
  )
    throw new Error("Final chain verification failed.");
  state.evidence.push({
    final: data,
    preflight: pre,
    accountIdentity:
      "Owner and payer are the same disposable test account; no real client identity is claimed.",
  });
  state.completed = new Date().toISOString();
  persist();
  console.log(
    "Passport live acceptance passed. Exactly two test token transfers.",
  );
} catch (error) {
  await page
    .screenshot({
      path: "artifacts/video/passport/acceptance-error.png",
      fullPage: true,
    })
    .catch(() => {});
  throw error;
} finally {
  state.recording!.path = await page.video()?.path();
  persist();
  await context.close();
  await browser.close();
}
