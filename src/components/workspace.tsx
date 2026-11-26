"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useConnection, useConfig, useSwitchChain } from "wagmi";
import { getWalletClient } from "wagmi/actions";
import {
  type Address,
  type Hash,
  type WalletClient,
  type TransactionReceipt,
  type Abi,
  parseEther,
  parseUnits,
  parseAbi,
  isAddress,
  BaseError,
} from "viem";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react";
import { Header, Footer, ChainLink, CopyButton, WalletControl } from "./shared";
import {
  baseClient,
  reactiveClient,
  vaultAbi,
  reactiveAbi,
  tokenAbi,
  proxy,
  system,
  supportedToken,
  demoVault,
  vaultBytecode,
  reactiveBytecode,
} from "@/lib/contracts";
import {
  amountText,
  allocate,
  shortAddress,
  validateRules,
  percentageBps,
  type RuleDraft,
  type Rule,
} from "@/lib/domain";
import type { VaultData, Payment } from "@/lib/vault-data";
import { useAllocationDraft } from "./use-allocation-draft";

type TxState = {
  stage: "wallet" | "pending" | "confirmed" | "error";
  label: string;
  hash?: Hash;
  chain: number;
  message?: string;
};
type SendAction = (client: WalletClient) => Promise<Hash>;
type Perform = (
  label: string,
  chain: number,
  action: SendAction,
) => Promise<TransactionReceipt>;
const views = ["Overview", "Rules", "Receive", "Activity", "Health"] as const;
function errorMessage(error: unknown) {
  if (error instanceof BaseError) return error.shortMessage;
  if (error instanceof Error) return error.message;
  return "The transaction could not be completed. Check your wallet and try again.";
}

export function Workspace() {
  const params = useSearchParams();
  const router = useRouter();
  const config = useConfig();
  const { address, chainId } = useConnection();
  const { switchChainAsync } = useSwitchChain();
  const selected = params.get("vault");
  const vault =
    selected === "demo"
      ? demoVault
      : selected && isAddress(selected)
        ? (selected as Address)
        : undefined;
  const active =
    views.find((v) => v.toLowerCase() === params.get("view")) || "Overview";
  const [openAddress, setOpenAddress] = useState("");
  const [inputError, setInputError] = useState("");
  const [tx, setTx] = useState<TxState | null>(null);
  const [creating, setCreating] = useState(false);
  const lock = useRef(false);
  const workflowLock = useRef(false);
  const freshRead = useRef(false);
  const busy = creating || tx?.stage === "wallet" || tx?.stage === "pending";
  const query = useQuery<VaultData>({
    queryKey: ["vault", vault, params.get("before")],
    enabled: !!vault,
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params.get("before")) search.set("before", params.get("before")!);
      if (freshRead.current) {
        search.set("fresh", "1");
        freshRead.current = false;
      }
      const r = await fetch(`/api/vault/${vault}?${search}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Unable to read chain data.");
      return d;
    },
    refetchInterval: 20_000,
  });
  const data = query.data;
  const owner =
    !!address && data?.owner.toLowerCase() === address.toLowerCase();
  const nav = (view: string, chosen = selected || "") =>
    `/app?view=${view.toLowerCase()}${chosen ? `&vault=${chosen}` : ""}`;
  const perform: Perform = async (label, chain, action) => {
    if (lock.current) throw new Error("Another transaction is in progress.");
    lock.current = true;
    try {
      if (!address) throw new Error("Connect your wallet first.");
      setTx({ stage: "wallet", label, chain });
      // A multi-step setup outlives its render's chainId. Always ask the
      // connector to confirm the target network before constructing its client.
      await switchChainAsync({ chainId: chain as 84532 | 5318007 });
      const client = await getWalletClient(config, {
        chainId: chain as 84532 | 5318007,
      });
      const hash = await action(client as WalletClient);
      setTx({ stage: "pending", label, chain, hash });
      const receipt = await (
        chain === 84532 ? baseClient : reactiveClient
      ).waitForTransactionReceipt({ hash, timeout: 120_000 });
      if (receipt.status !== "success")
        throw new Error(
          "The transaction reverted. Inspect its explorer receipt before retrying.",
        );
      setTx({ stage: "confirmed", label, chain, hash });
      freshRead.current = true;
      if (vault) void query.refetch();
      return receipt;
    } catch (error) {
      setTx((previous) => ({
        stage: "error",
        label,
        chain,
        hash: previous?.hash,
        message: errorMessage(error),
      }));
      throw error;
    } finally {
      lock.current = false;
    }
  };
  const write = (
    label: string,
    functionName: string,
    args: readonly unknown[] = [],
    target = vault,
    chain = 84532,
    value?: bigint,
  ) => {
    if (!target) return Promise.reject(new Error("Select a vault."));
    const abi: Abi =
      target === proxy || target === system
        ? parseAbi(["function depositTo(address) payable"])
        : chain === 5318007
          ? reactiveAbi
          : target === supportedToken
            ? tokenAbi
            : vaultAbi;
    return perform(label, chain, (c) =>
      c.writeContract({
        account: address!,
        chain: c.chain,
        address: target,
        abi,
        functionName,
        args,
        value,
      }),
    );
  };
  async function createVault() {
    if (!address || workflowLock.current) return;
    workflowLock.current = true;
    setCreating(true);
    try {
      const storageKey = `incomeflow.setup.${address.toLowerCase()}`;
      const draft: { reactive?: Address; vault?: Address; bound?: boolean } =
        JSON.parse(localStorage.getItem(storageKey) || "{}");
      const persist = () =>
        localStorage.setItem(storageKey, JSON.stringify(draft));
      if (!draft.reactive) {
        const r = await perform(
          "Deploy your automation contract",
          5318007,
          (c) =>
            c.deployContract({
              account: address,
              chain: c.chain,
              abi: reactiveAbi,
              bytecode: reactiveBytecode,
              args: [address, supportedToken],
              value: parseEther("0.5"),
            }),
        );
        if (!r.contractAddress)
          throw new Error("Deployment has no contract address.");
        draft.reactive = r.contractAddress;
        persist();
      }
      if (!draft.vault) {
        const r = await perform("Create your receiving vault", 84532, (c) =>
          c.deployContract({
            account: address,
            chain: c.chain,
            abi: vaultAbi,
            bytecode: vaultBytecode,
            args: [address, supportedToken, proxy, draft.reactive],
            value: parseEther("0.003"),
          }),
        );
        if (!r.contractAddress)
          throw new Error("Vault deployment has no address.");
        draft.vault = r.contractAddress;
        persist();
      }
      if (!draft.bound) {
        await perform("Register your payment subscription", 5318007, (c) =>
          c.writeContract({
            account: address,
            chain: c.chain,
            address: draft.reactive!,
            abi: reactiveAbi,
            functionName: "bindVault",
            args: [draft.vault],
          }),
        );
        draft.bound = true;
        persist();
      }
      router.push(nav("Rules", draft.vault));
    } catch {
      /* The transaction banner retains the concrete error and interrupted setup resumes from confirmed addresses. */
    } finally {
      setCreating(false);
      workflowLock.current = false;
    }
  }
  return (
    <>
      <Header />
      <main className="container workspace" id="main">
        <div className="workspace-heading">
          <div>
            <h1>Your income workspace</h1>
            <p>Less sorting. More room for your work.</p>
          </div>
          <span className="network-label">
            Base Sepolia &amp; Reactive Lasna<span>Testnet funds only</span>
          </span>
        </div>
        <nav className="workspace-tabs" aria-label="Workspace">
          {views.map((v) => (
            <Link
              aria-current={active === v ? "page" : undefined}
              className={active === v ? "selected" : ""}
              key={v}
              href={nav(v)}
            >
              {v}
            </Link>
          ))}
        </nav>
        {address && chainId !== 84532 && chainId !== 5318007 && (
          <div className="notice" role="status">
            <strong>Your wallet is on an unsupported network.</strong>{" "}
            IncomeFlow uses Base Sepolia and Reactive Lasna testnets.
            <button
              className="button secondary compact"
              onClick={() =>
                void switchChainAsync({ chainId: 84532 }).catch(() =>
                  setTx({
                    stage: "error",
                    label: "Switch wallet network",
                    chain: 84532,
                    message:
                      "Network switch declined. Select Base Sepolia in your wallet and try again.",
                  }),
                )
              }
            >
              Switch to Base Sepolia
            </button>
          </div>
        )}
        {tx && (
          <div
            className={`transaction-banner ${tx.stage === "error" ? "error" : ""}`}
            role={tx.stage === "error" ? "alert" : "status"}
          >
            <div>
              <strong>{tx.label}</strong>
              <span>
                {tx.stage === "wallet"
                  ? "Confirm in your wallet. A network switch may be required."
                  : tx.stage === "pending"
                    ? "Submitted. Waiting for its actual receipt."
                    : tx.stage === "confirmed"
                      ? "Transaction confirmed. Refreshing chain state."
                      : tx.message}
              </span>
            </div>
            {tx.hash && (
              <ChainLink value={tx.hash} chain={tx.chain}>
                View transaction
              </ChainLink>
            )}
            {tx.stage !== "pending" && tx.stage !== "wallet" && (
              <button
                className="button subtle compact"
                onClick={() => setTx(null)}
              >
                Dismiss
              </button>
            )}
          </div>
        )}
        {!vault ? (
          <section className="setup-grid">
            <div className="setup-intro">
              <span className="large-brand-mark">
                <Wallet size={36} aria-hidden="true" />
              </span>
              <h2>A place for every payment.</h2>
              <p>
                Create your own receiving vault, set the allocations, and let
                incoming payments do the rest.
              </p>
              <div className="setup-facts">
                <span>
                  <Check size={16} aria-hidden="true" />
                  Owned by your wallet
                </span>
                <span>
                  <Check size={16} aria-hidden="true" />
                  No backend payout key
                </span>
                <span>
                  <Check size={16} aria-hidden="true" />
                  Public payment receipts
                </span>
              </div>
              <Link className="text-link" href="/app?vault=demo">
                Inspect the live demonstration vault
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="panel setup-panel">
              <h2>Create your vault</h2>
              <p>
                Setup uses three wallet transactions across two testnets. You’ll
                fund automation with 0.5 lREACT and callbacks with 0.003 test
                ETH, plus deployment gas.
              </p>
              {!address ? (
                <WalletControl />
              ) : (
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={createVault}
                >
                  {creating ? "Creating your vault…" : "Create or resume setup"}
                </button>
              )}
              <p className="small muted">
                Need funds?{" "}
                <Link href="/help#funding">Testnet funding guide</Link>.
                Confirmed setup addresses stay in this browser so interrupted
                setup can resume.
              </p>
              <hr />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isAddress(openAddress)) {
                    setInputError("Enter a valid vault address.");
                    return;
                  }
                  setInputError("");
                  router.push(nav("Overview", openAddress));
                }}
              >
                <label htmlFor="existing-vault">
                  Already have an IncomeFlow vault?
                </label>
                <div className="inline-form">
                  <input
                    id="existing-vault"
                    value={openAddress}
                    onChange={(e) => setOpenAddress(e.target.value)}
                    placeholder="0x… receiving address"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button className="button secondary" type="submit">
                    Open
                  </button>
                </div>
                {inputError && (
                  <p className="error-text" role="alert">
                    {inputError}
                  </p>
                )}
              </form>
            </div>
          </section>
        ) : (
          <>
            <div className="vault-toolbar">
              <span>
                {selected === "demo"
                  ? "Verified demonstration vault"
                  : owner
                    ? "Your vault"
                    : "Viewing vault"}{" "}
                <ChainLink kind="address" value={vault} />
              </span>
              <div>
                {!owner && <span className="tag">Read only</span>}
                <button
                  className="button subtle compact"
                  disabled={query.isFetching}
                  onClick={() => void query.refetch()}
                >
                  <RefreshCw size={14} aria-hidden="true" />
                  {query.isFetching ? "Syncing…" : "Refresh"}
                </button>
                <Link className="text-link" href="/passport">
                  Payment Passport
                </Link>
                <Link className="text-link" href="/app">
                  Change vault
                </Link>
              </div>
            </div>
            {query.isLoading && (
              <div className="loading-state" role="status">
                <div className="skeleton" />
                <div className="skeleton" />
                <p>Reading vault state and real payment receipts…</p>
              </div>
            )}
            {query.error && (
              <div className="empty-state error" role="alert">
                <h2>We couldn’t synchronize this vault.</h2>
                <p>{query.error.message}</p>
                <button
                  className="button secondary"
                  onClick={() => void query.refetch()}
                >
                  Try again
                </button>
                <ChainLink value={vault} kind="address">
                  Inspect on the explorer
                </ChainLink>
              </div>
            )}
            {data && (
              <>
                {data.paused && (
                  <div className="notice">
                    <strong>Allocations are paused.</strong> Payments can still
                    arrive. Resume to allow eligible callbacks, or use owner
                    recovery.
                  </div>
                )}
                {data.health.error && (
                  <div className="notice">{data.health.error}</div>
                )}
                {BigInt(data.health.vaultDebt) > 0n ||
                BigInt(data.health.reactiveDebt || "0") > 0n ? (
                  <div className="notice error">
                    Automation has outstanding fees. Top up the affected service
                    in Health before retrying.
                  </div>
                ) : null}
                {active === "Overview" && (
                  <>
                    <section className="overview-grid">
                      <div className="income-summary">
                        <span>Automatically allocated</span>
                        <h2>
                          {amountText(data.totalDistributed)}{" "}
                          <small>ifUSD</small>
                        </h2>
                        <p>
                          {data.paymentCount} confirmed{" "}
                          {data.paymentCount === "1" ? "payment" : "payments"}
                          <span>
                            {amountText(data.balance)} ifUSD currently in your
                            vault
                          </span>
                        </p>
                        <Link className="button primary" href={nav("Receive")}>
                          Receive a payment
                          <ArrowDownLeft size={17} aria-hidden="true" />
                        </Link>
                      </div>
                      <AllocationSummary data={data} editHref={nav("Rules")} />
                    </section>
                    <div className="section-heading">
                      <h2>Payment activity</h2>
                      <Link className="text-link" href={nav("Activity")}>
                        View all receipts
                        <ChevronRight size={16} aria-hidden="true" />
                      </Link>
                    </div>
                    <Activity payments={data.payments.slice(0, 3)} />
                    <div className="automation-note">
                      <ShieldCheck size={20} aria-hidden="true" />
                      <p>
                        Allocations use your on-chain rules at callback
                        execution.
                        <span>
                          Only your wallet can change destinations. Every
                          completed payment includes its policy version.
                        </span>
                      </p>
                      <Link href={nav("Health")}>Automation health</Link>
                    </div>
                  </>
                )}
                {active === "Rules" && (
                  <RulesEditor
                    key={`${vault}:${data.policyVersion}`}
                    data={data}
                    owner={owner}
                    busy={!!busy}
                    save={(rules) =>
                      write("Save allocation rules", "setRules", [rules]).then(
                        () => {},
                      )
                    }
                  />
                )}
                {active === "Receive" && (
                  <Receive
                    data={data}
                    busy={!!busy}
                    connected={!!address}
                    faucet={() =>
                      write(
                        "Claim 1,000 demo ifUSD",
                        "faucet",
                        [],
                        supportedToken,
                      )
                    }
                    pay={(amount) =>
                      write(
                        "Send test payment",
                        "transfer",
                        [vault, amount],
                        supportedToken,
                      )
                    }
                  />
                )}
                {active === "Activity" && (
                  <>
                    <div className="section-heading">
                      <div>
                        <h2>Your payment receipts</h2>
                        <p className="muted">
                          Actual deposits and confirmed allocation events.
                        </p>
                      </div>
                    </div>
                    <Activity payments={data.payments} />
                    <div className="history-pagination">
                      <p className="small muted">
                        Blocks {data.history.from} to {data.history.to}.{" "}
                        {data.history.partial
                          ? "Earlier history is available."
                          : "Start of deployment history."}{" "}
                        The demonstration proof is also fetched directly from
                        its real receipts.
                      </p>
                      {data.history.nextBefore && (
                        <Link
                          className="button secondary compact"
                          href={`${nav("Activity")}&before=${data.history.nextBefore}`}
                        >
                          Load older blocks
                        </Link>
                      )}
                      {params.get("before") && (
                        <Link className="text-link" href={nav("Activity")}>
                          Return to latest
                        </Link>
                      )}
                    </div>
                  </>
                )}
                {active === "Health" && (
                  <Health
                    data={data}
                    owner={owner}
                    busy={!!busy}
                    act={(
                      label,
                      name,
                      args = [],
                      target = vault,
                      chain = 84532,
                      value,
                    ) => write(label, name, args, target, chain, value)}
                  />
                )}
                <p className="sync-note">
                  Last synchronized{" "}
                  {new Date(data.checkedAt).toLocaleTimeString()}. Chain state
                  is authoritative.
                </p>
              </>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
function AllocationSummary({
  data,
  editHref,
}: {
  data: VaultData;
  editHref: string;
}) {
  return (
    <div className="allocation-summary">
      <div className="section-heading">
        <h2>Your allocation</h2>
        <Link className="text-link" href={editHref}>
          Manage rules
        </Link>
      </div>
      {data.rules.length ? (
        <>
          <div className="allocation-strip" aria-label="Allocation proportions">
            {data.rules.map((r, i) => (
              <i
                key={r.recipient}
                className={`allocation-${i % 3}`}
                style={{ flex: r.bps }}
              />
            ))}
          </div>
          <div className="rule-summary">
            {data.rules.map((r, i) => (
              <div key={r.recipient}>
                <span
                  className={`category-icon category-${i % 3}`}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span>
                  {r.label}
                  <small>{shortAddress(r.recipient)}</small>
                </span>
                <strong>{r.bps / 100}%</strong>
              </div>
            ))}
          </div>
          <span className="small muted">
            Policy version {data.policyVersion}
          </span>
        </>
      ) : (
        <div className="empty-state">
          <p>
            No rules yet. Configure destinations before sharing this address.
          </p>
          <Link className="button secondary" href={editHref}>
            Set allocation rules
          </Link>
        </div>
      )}
    </div>
  );
}
function RulesEditor({
  data,
  owner,
  busy,
  save,
}: {
  data: VaultData;
  owner: boolean;
  busy: boolean;
  save: (rules: Rule[]) => Promise<void>;
}) {
  const initialRows: RuleDraft[] = data.rules.length
    ? data.rules.map((r) => ({
        recipient: r.recipient,
        percent: String(r.bps / 100),
        label: r.label,
      }))
    : [
        { recipient: "", percent: "50", label: "Spending" },
        { recipient: "", percent: "30", label: "Savings" },
        { recipient: "", percent: "20", label: "Tax reserve" },
      ];
  const { rows, setRows, clear, commit, storageFailed, changed } =
    useAllocationDraft(
      `incomeflow.rules.${data.address.toLowerCase()}.${data.policyVersion}`,
      initialRows,
    );
  const formRef = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const validation = validateRules(rows, [data.address, data.token, proxy]);
  const update = (i: number, key: keyof RuleDraft, value: string) =>
    setRows(rows.map((r, n) => (i === n ? { ...r, [key]: value } : r)));
  const shares = rows.map((r) => percentageBps(r.percent) || 0);
  const total = shares.reduce((a, b) => a + b, 0);
  const preview =
    total === 10000 && shares.every((n) => n > 0)
      ? allocate(100_000_000n, shares)
      : null;
  const fieldError = (i: number, field: keyof RuleDraft) => {
    if (!submitted) return undefined;
    const prefix = `Destination ${i + 1}:`;
    const error = validation.errors.find(
      (message) =>
        message.startsWith(prefix) &&
        (field === "recipient"
          ? message.includes("wallet")
          : field === "percent"
            ? message.includes("percentage")
            : message.includes("category")),
    );
    return (
      error ||
      (field === "percent" && i === 0 && total !== 10000
        ? "Allocation percentages must total exactly 100%."
        : undefined)
    );
  };
  return (
    <section className="editor-grid">
      <form
        ref={formRef}
        className="panel rule-editor"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (validation.errors.length || !owner) {
            requestAnimationFrame(() =>
              formRef.current
                ?.querySelector<HTMLElement>('[aria-invalid="true"]')
                ?.focus(),
            );
            return;
          }
          void save(validation.rules)
            .then(() => {
              commit();
              setSubmitted(false);
            })
            .catch(() => {});
        }}
        noValidate
      >
        <div className="section-heading">
          <div>
            <h2>Make your income plan.</h2>
            <p className="muted">Choose where each incoming payment belongs.</p>
          </div>
          <span className="tag">Version {data.policyVersion}</span>
        </div>
        {!owner && (
          <p className="notice">
            Preview changes here. Connect the vault owner wallet to save them
            on-chain.
          </p>
        )}
        {changed && (
          <div className="draft-notice">
            <p>
              {owner ? "Unsaved changes" : "Unsaved preview changes"}.{" "}
              {storageFailed
                ? "Browser storage is unavailable; keep this view open until saved."
                : "Your draft is kept in this browser tab when you navigate or refresh."}
            </p>
            <button
              className="button subtle compact"
              type="button"
              onClick={clear}
              disabled={busy}
            >
              Discard draft
            </button>
          </div>
        )}
        <div className="rule-edit-rows">
          {rows.map((r, i) => (
            <fieldset key={i} disabled={busy}>
              <legend>Destination {i + 1}</legend>
              <div className="rule-row-title">
                <label>
                  Category
                  <input
                    id={`rule-${i}-label`}
                    aria-invalid={!!fieldError(i, "label")}
                    aria-describedby={
                      fieldError(i, "label")
                        ? `rule-${i}-label-error`
                        : undefined
                    }
                    maxLength={32}
                    value={r.label}
                    onChange={(e) => update(i, "label", e.target.value)}
                    aria-label={`Destination ${i + 1} category`}
                  />
                  {fieldError(i, "label") && (
                    <span className="field-error" id={`rule-${i}-label-error`}>
                      {fieldError(i, "label")}
                    </span>
                  )}
                </label>
                <label>
                  Percentage
                  <div className="percent-field">
                    <input
                      id={`rule-${i}-percent`}
                      aria-invalid={!!fieldError(i, "percent")}
                      aria-describedby={
                        fieldError(i, "percent")
                          ? `rule-${i}-percent-error`
                          : undefined
                      }
                      inputMode="decimal"
                      value={r.percent}
                      onChange={(e) => update(i, "percent", e.target.value)}
                      aria-label={`Destination ${i + 1} percentage`}
                    />
                    <span>%</span>
                  </div>
                  {fieldError(i, "percent") && (
                    <span
                      className="field-error"
                      id={`rule-${i}-percent-error`}
                    >
                      {fieldError(i, "percent")}
                    </span>
                  )}
                </label>
                {rows.length > 2 && (
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`Remove destination ${i + 1}`}
                    onClick={() => setRows(rows.filter((_, n) => n !== i))}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                )}
              </div>
              <label>
                Recipient wallet
                <input
                  id={`rule-${i}-recipient`}
                  aria-invalid={!!fieldError(i, "recipient")}
                  aria-describedby={
                    fieldError(i, "recipient")
                      ? `rule-${i}-recipient-error`
                      : undefined
                  }
                  value={r.recipient}
                  onChange={(e) => update(i, "recipient", e.target.value)}
                  placeholder="0x…"
                  spellCheck={false}
                  autoComplete="off"
                  aria-label={`Destination ${i + 1} wallet`}
                />
                {fieldError(i, "recipient") && (
                  <span
                    className="field-error"
                    id={`rule-${i}-recipient-error`}
                  >
                    {fieldError(i, "recipient")}
                  </span>
                )}
              </label>
            </fieldset>
          ))}
        </div>
        <div className="editor-total">
          <button
            className="button subtle compact"
            type="button"
            disabled={busy || rows.length >= 8}
            onClick={() =>
              setRows([...rows, { recipient: "", percent: "", label: "Other" }])
            }
          >
            <Plus size={16} aria-hidden="true" />
            Add destination
          </button>
          <strong className={total !== 10000 ? "error-text" : ""}>
            Total {total / 100}% / 100%
          </strong>
        </div>
        {submitted && validation.errors.length > 0 && (
          <div className="validation-errors" role="alert">
            <strong>Check your allocation:</strong>
            <ul>
              {validation.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        <button
          className="button primary"
          type="submit"
          disabled={!owner || busy}
        >
          {busy ? "Waiting for confirmation…" : "Save allocation rules"}
        </button>
        <p className="small muted">
          New rules apply when the callback executes, including to pending
          payments. Tax reserve percentages are your choice, not tax advice.
        </p>
      </form>
      <aside className="allocation-aside">
        <h2>For a 100 ifUSD payment</h2>
        <p className="muted">
          Preview only. Actual payouts are confirmed on-chain.
        </p>
        {rows.map((r, i) => (
          <div className="preview-line" key={i}>
            <span
              className={`category-icon category-${i % 3}`}
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <span>{r.label || `Destination ${i + 1}`}</span>
            <strong>{preview ? amountText(preview[i]) : "—"}</strong>
          </div>
        ))}
        <p className="small muted">
          Amounts use integer token units. Any rounding remainder goes to the
          final destination.
        </p>
      </aside>
    </section>
  );
}
function Activity({ payments }: { payments: Payment[] }) {
  const [filter, setFilter] = useState("all");
  const visible = payments.filter(
    (p) =>
      filter === "all" ||
      (filter === "confirmed"
        ? p.status === "Distribution confirmed"
        : p.status !== "Distribution confirmed"),
  );
  return (
    <div className="activity">
      <div className="activity-filter">
        <label htmlFor="status-filter">Show payments</label>
        <select
          id="status-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All states</option>
          <option value="confirmed">Confirmed allocations</option>
          <option value="pending">Awaiting allocation</option>
        </select>
      </div>
      {visible.length ? (
        visible.map((p) => (
          <details className="payment-row" key={p.id}>
            <summary>
              <span className="payment-icon">
                <ArrowDownLeft size={20} aria-hidden="true" />
              </span>
              <span className="payment-title">
                Incoming payment<small>From {shortAddress(p.payer)}</small>
              </span>
              <span
                className={`payment-status ${p.status === "Distribution confirmed" ? "success" : ""}`}
              >
                {p.status === "Distribution confirmed" && (
                  <Check size={14} aria-hidden="true" />
                )}
                {p.status}
              </span>
              <strong>
                {amountText(p.amount)} <small>ifUSD</small>
              </strong>
              <ChevronRight size={16} aria-hidden="true" />
            </summary>
            <div className="receipt-detail">
              <ol className="receipt-timeline">
                <li>
                  <Check size={17} aria-hidden="true" />
                  <div>
                    <strong>Payment detected</strong>
                    <ChainLink value={p.originHash}>
                      Base Sepolia deposit
                    </ChainLink>
                    <span>Log {p.logIndex}</span>
                  </div>
                </li>
                <li>
                  <span className="timeline-marker">
                    {p.reactiveHash ? (
                      <Check size={17} aria-hidden="true" />
                    ) : (
                      "?"
                    )}
                  </span>
                  <div>
                    <strong>
                      {p.reactiveHash
                        ? "Reactive execution confirmed"
                        : "Reactive execution not yet observed"}
                    </strong>
                    {p.reactiveHash ? (
                      <ChainLink value={p.reactiveHash} chain={5318007}>
                        Execution and callback request
                      </ChainLink>
                    ) : (
                      <span>Refresh or inspect automation health.</span>
                    )}
                  </div>
                </li>
                <li>
                  <span className="timeline-marker">
                    {p.status === "Distribution confirmed" ? (
                      <Check size={17} aria-hidden="true" />
                    ) : (
                      "?"
                    )}
                  </span>
                  <div>
                    <strong>
                      {p.status === "Distribution confirmed"
                        ? "Distribution confirmed"
                        : p.status === "Failed"
                          ? "Destination callback failed"
                          : "Destination distribution not yet confirmed"}
                    </strong>
                    {p.destinationHash && (
                      <ChainLink value={p.destinationHash}>
                        {p.status === "Failed"
                          ? "Inspect the failed callback"
                          : "Authenticated callback and payouts"}
                      </ChainLink>
                    )}
                    {p.version && <span>Policy version {p.version}</span>}
                  </div>
                </li>
              </ol>
              {p.failure && (
                <p className="notice error" role="alert">
                  {p.failure}
                </p>
              )}
              {p.allocations.length > 0 && (
                <div className="receipt-payouts">
                  <h3>Actual recipient transfers</h3>
                  {p.allocations.map((a) => (
                    <div key={a.recipient}>
                      <ChainLink value={a.recipient} kind="address" />
                      <strong>{amountText(a.amount)} ifUSD</strong>
                    </div>
                  ))}
                </div>
              )}
              <details className="advanced">
                <summary>Advanced receipt details</summary>
                <dl>
                  <dt>Payment ID</dt>
                  <dd className="address-text">{p.id}</dd>
                  <dt>Origin block</dt>
                  <dd>{p.block}</dd>
                  <dt>Gross token amount</dt>
                  <dd>{p.amount} smallest units</dd>
                </dl>
                <button
                  className="button secondary compact"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(p, null, 2)], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `incomeflow-${p.id.slice(2, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download receipt
                </button>
              </details>
            </div>
          </details>
        ))
      ) : (
        <div className="empty-state">
          <ArrowDownLeft size={28} aria-hidden="true" />
          <h3>No payments in this view.</h3>
          <p>
            Supported-token transfers to this vault appear here after chain
            synchronization. Use Activity to load older blocks.
          </p>
        </div>
      )}
    </div>
  );
}
function Receive({
  data,
  busy,
  connected,
  faucet,
  pay,
}: {
  data: VaultData;
  busy: boolean;
  connected: boolean;
  faucet: () => Promise<unknown>;
  pay: (amount: bigint) => Promise<unknown>;
}) {
  const [amount, setAmount] = useState("100");
  const [notice, setNotice] = useState("");
  return (
    <section className="receive-grid">
      <div className="panel receive-address">
        <ArrowDownLeft size={28} aria-hidden="true" />
        <h2>Your receiving address</h2>
        <p>
          Send only IncomeFlow Demo USD (ifUSD) on Base Sepolia. A regular token
          transfer starts the automation.
        </p>
        <code className="address-text">{data.address}</code>
        <CopyButton value={data.address} />
        <dl className="key-values">
          <dt>Supported token</dt>
          <dd>IncomeFlow Demo USD (ifUSD)</dd>
          <dt>Token contract</dt>
          <dd>
            <ChainLink kind="address" value={data.token} />
          </dd>
          <dt>Decimals</dt>
          <dd>6</dd>
          <dt>Network</dt>
          <dd>Base Sepolia (84532)</dd>
        </dl>
        {!data.rules.length && (
          <p className="notice error">
            Set allocation rules before receiving payments. The vault currently
            has no policy.
          </p>
        )}
      </div>
      <div className="receive-tools">
        <h2>Try a real test payment</h2>
        <p>
          Claim valueless demo tokens, then send a supported ERC-20 payment
          directly to the vault. Actual network fees require Base Sepolia test
          ETH.
        </p>
        <button
          className="button secondary"
          disabled={!connected || busy}
          onClick={() => void faucet().catch(() => {})}
        >
          Claim 1,000 demo ifUSD
        </button>
        <p className="small muted">
          Faucet: once per wallet per hour. No monetary value or redemption.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (
              !/^\d{1,12}(\.\d{1,6})?$/.test(amount) ||
              parseUnits(amount, 6) <= 0n
            ) {
              setNotice("Enter a positive amount with up to six decimals.");
              return;
            }
            setNotice("");
            void pay(parseUnits(amount, 6)).catch(() => {});
          }}
        >
          <label htmlFor="test-amount">Amount to send (ifUSD)</label>
          <input
            id="test-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            className="button primary"
            type="submit"
            disabled={!connected || busy || !data.rules.length || data.paused}
          >
            Send real testnet payment
            <ArrowUpRight size={17} aria-hidden="true" />
          </button>
          {notice && (
            <p className="error-text" role="alert">
              {notice}
            </p>
          )}
        </form>
        {!connected && (
          <p className="notice">
            Connect a wallet to claim and send test tokens.
          </p>
        )}
        <Link className="text-link" href="/help#funding">
          Get testnet ETH and lREACT
        </Link>
        <p className="small muted">
          A confirmed deposit is not a completed split. Follow the actual status
          in Activity.
        </p>
      </div>
    </section>
  );
}
function Health({
  data,
  owner,
  busy,
  act,
}: {
  data: VaultData;
  owner: boolean;
  busy: boolean;
  act: (
    label: string,
    name: string,
    args?: readonly unknown[],
    target?: Address,
    chain?: number,
    value?: bigint,
  ) => Promise<unknown>;
}) {
  const [ack, setAck] = useState(false);
  const [retryId, setRetryId] = useState("");
  const [notice, setNotice] = useState("");
  const health = data.health;
  const rc = data.reactive as Address;
  const vault = data.address as Address;
  const healthState = (debt?: string, reserves?: string, balance?: string) =>
    debt === undefined
      ? "Unavailable"
      : BigInt(debt) > 0n
        ? "Outstanding fees"
        : BigInt(reserves || 0) + BigInt(balance || 0) === 0n
          ? "Funding needed"
          : "Funded";
  return (
    <section className="health-view">
      <div className="section-heading">
        <div>
          <h2>Your automation, in view.</h2>
          <p className="muted">
            Funding is required on both networks. A funded balance does not
            guarantee callback delivery.
          </p>
        </div>
      </div>
      <div className="health-grid">
        {[
          {
            label: "Destination callbacks",
            chain: 84532,
            address: vault,
            balance: health.vaultBalance,
            debt: health.vaultDebt,
            reserves: health.vaultReserves,
            service: proxy,
            amount: "0.003",
            unit: "ETH",
          },
          {
            label: "Reactive automation",
            chain: 5318007,
            address: rc,
            balance: health.reactiveBalance,
            debt: health.reactiveDebt,
            reserves: health.reactiveReserves,
            service: system,
            amount: "0.5",
            unit: "lREACT",
          },
        ].map((item) => (
          <div className="panel health-panel" key={item.chain}>
            <div className="section-heading">
              <h3>{item.label}</h3>
              <span className="tag">
                {healthState(item.debt, item.reserves, item.balance)}
              </span>
            </div>
            <dl className="key-values">
              <dt>Native balance</dt>
              <dd>
                {item.balance ? amountText(item.balance, 18) : "Unavailable"}{" "}
                {item.unit}
              </dd>
              <dt>Service reserves</dt>
              <dd>
                {item.reserves ? amountText(item.reserves, 18) : "Unavailable"}{" "}
                {item.unit}
              </dd>
              <dt>Outstanding debt</dt>
              <dd>
                {item.debt ? amountText(item.debt, 18) : "Unavailable"}{" "}
                {item.unit}
              </dd>
              <dt>Contract</dt>
              <dd>
                <ChainLink
                  value={item.address}
                  kind="address"
                  chain={item.chain}
                />
              </dd>
            </dl>
            <button
              className="button secondary"
              disabled={!owner || busy}
              onClick={() =>
                void act(
                  `Top up ${item.label.toLowerCase()}`,
                  "depositTo",
                  [item.address],
                  item.service,
                  item.chain,
                  parseEther(item.amount),
                ).catch(() => {})
              }
            >
              Top up {item.amount} test {item.unit}
            </button>
            <p className="small muted">
              Pays debt first, then credits reserves. Confirm the value in your
              wallet.
            </p>
          </div>
        ))}
      </div>
      <div className="settings-grid">
        <div>
          <h3>Vault controls</h3>
          <p>
            {data.paused ? "Paused" : "Active"} allocations. Subscription{" "}
            {health.subscribed === undefined
              ? "unavailable"
              : health.subscribed
                ? "active"
                : "disabled"}
            .
          </p>
          <button
            className="button secondary"
            disabled={!owner || busy}
            onClick={() =>
              void act(
                data.paused ? "Resume allocations" : "Pause allocations",
                data.paused ? "resume" : "pause",
              ).catch(() => {})
            }
          >
            {data.paused ? "Resume allocations" : "Pause allocations"}
          </button>
          <p className="small muted">
            Pausing allocations does not reject deposits. Resume alone cannot
            guarantee retry of a previously failed callback.
          </p>
          <button
            className="button subtle"
            disabled={!owner || busy || health.subscribed === undefined}
            onClick={() =>
              void act(
                health.subscribed
                  ? "Stop observing payments"
                  : "Start observing payments",
                "setSubscription",
                [!health.subscribed],
                rc,
                5318007,
              ).catch(() => {})
            }
          >
            {health.subscribed
              ? "Stop payment subscription"
              : "Start payment subscription"}
          </button>
        </div>
        <div>
          <h3>Retry a recorded payment</h3>
          <p>
            Only the automation owner can retry an event already authenticated
            by Reactive. A 60-second cooldown applies.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^0x[0-9a-fA-F]{64}$/.test(retryId)) {
                setNotice("Enter the 32-byte payment ID from its receipt.");
                return;
              }
              setNotice("");
              void act(
                "Retry authenticated allocation",
                "retry",
                [retryId],
                rc,
                5318007,
              ).catch(() => {});
            }}
          >
            <label htmlFor="retry-id">Payment ID</label>
            <input
              id="retry-id"
              value={retryId}
              onChange={(e) => setRetryId(e.target.value)}
              placeholder="0x… payment ID"
            />
            <button className="button secondary" disabled={!owner || busy}>
              Request callback retry
            </button>
            {notice && (
              <p className="error-text" role="alert">
                {notice}
              </p>
            )}
          </form>
        </div>
      </div>
      <details className="advanced recovery">
        <summary>Owner recovery and contract details</summary>
        <p>
          Recover the full supported-token balance to the current owner while
          paused. This invalidates callbacks for deposits through the recovery
          block, including same-block deposits. Later deposits remain eligible.
        </p>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
          />
          I understand this withdraws all remaining ifUSD and invalidates older
          pending allocations.
        </label>
        <button
          className="button danger"
          disabled={!owner || busy || !data.paused || !ack}
          onClick={() =>
            void act("Recover remaining ifUSD", "recover").catch(() => {})
          }
        >
          Recover funds to owner wallet
        </button>
        <dl className="key-values">
          <dt>Owner</dt>
          <dd>
            <ChainLink value={data.owner} kind="address" />
          </dd>
          <dt>Authorized Reactive contract</dt>
          <dd>
            <ChainLink value={data.reactive} kind="address" chain={5318007} />
          </dd>
          <dt>Callback proxy</dt>
          <dd>
            <ChainLink value={proxy} kind="address" />
          </dd>
          <dt>Recovery block cutoff</dt>
          <dd>{data.recoveryBlock}</dd>
        </dl>
        <p className="small muted">
          Independent internal review only; not professionally audited. Testnet
          deployment. Fee reserves are not withdrawable through the application.
        </p>
      </details>
      {!owner && (
        <p className="notice">
          This vault is read only. Connect its owner wallet to use controls or
          fund it directly through the documented service.
        </p>
      )}
    </section>
  );
}
