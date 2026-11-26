"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  useConnection,
  useSignTypedData,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import {
  erc20Abi,
  formatUnits,
  parseUnits,
  zeroAddress,
  zeroHash,
  type Hex,
} from "viem";
import { Header, Footer, ChainLink, CopyButton } from "./shared";
import {
  PASSPORT_TOKEN,
  parseRequest,
  parsePassport,
  encodePassport,
  decodePassport,
  requestTypedData,
  associationTypedData,
  storageKey,
  parseArchive,
  requestDigest,
  passportDigest,
  paymentKey,
  type Passport,
  type PaymentRequest,
  type Association,
} from "@/lib/passport";
import { baseClient } from "@/lib/contracts";
import type { VerifiedPassport } from "@/lib/passport-chain";

const money = (amount: string) => formatUnits(BigInt(amount), 6);
function download(name: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function verify(passport: Passport): Promise<VerifiedPassport> {
  const response = await fetch("/api/passport/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(passport),
    signal: AbortSignal.timeout(55_000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Verification unavailable.");
  return data;
}
export function PaymentPassport({
  publicView = false,
}: {
  publicView?: boolean;
}) {
  const { address, chainId } = useConnection();
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChainAsync } = useSwitchChain();
  const { data: wallet } = useWalletClient();
  const [records, setRecords] = useState<Passport[]>([]),
    [selected, setSelected] = useState<Passport | null>(null),
    [review, setReview] = useState<PaymentRequest | null>(null),
    [checkedState, setChecked] = useState<VerifiedPassport | null>(null);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [storageReady, setStorageReady] = useState(false),
    [share, setShare] = useState(""),
    [paymentAmount, setPaymentAmount] = useState(""),
    [candidate, setCandidate] = useState<Omit<Association, "signature"> | null>(
      null,
    );
  const [allowAdditional, setAllowAdditional] = useState(false);
  const [draft, setDraft] = useState<PaymentRequest | null>(null);
  useEffect(() => {
    let active = true;
    const loadPublic = () => {
      if (!active) return;
      setError("");
      setChecked(null);
      try {
        setSelected(decodePassport(location.hash.slice(1)));
        setShare(location.href);
      } catch (e) {
        setSelected(null);
        setError(e instanceof Error ? e.message : "Invalid request.");
      }
    };
    window.addEventListener("hashchange", loadPublic);
    queueMicrotask(() => {
      if (!active) return;
      if (publicView) {
        loadPublic();
        return;
      }
      setRecords([]);
      setSelected(null);
      setChecked(null);
      setReview(null);
      setStorageReady(false);
      setError("");
      if (address) {
        try {
          const raw = localStorage.getItem(storageKey(address));
          if (raw) setRecords(parseArchive(raw, address));
          setStorageReady(true);
        } catch {
          setError(
            "Local records could not be read. Export the original browser storage before replacing it. You can still inspect a signed request link.",
          );
        }
      }
      if (location.hash.length > 1) loadPublic();
    });
    return () => {
      active = false;
      window.removeEventListener("hashchange", loadPublic);
    };
  }, [address, publicView]);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (selected && checkedState?.digest === passportDigest(selected)) return;
      setChecked(null);
      setCandidate(null);
      setAllowAdditional(false);
      setPaymentAmount("");
      if (!selected) return;
      setBusy(true);
      verify(selected)
        .then((data) => {
          if (!cancelled) {
            setChecked(data);
            setPaymentAmount(money(data.outstanding));
          }
        })
        .catch((e) => {
          if (!cancelled) setError(e.message);
        })
        .finally(() => {
          if (!cancelled) setBusy(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [selected, checkedState]);
  const checked =
    checkedState && selected && checkedState.digest === passportDigest(selected)
      ? checkedState
      : null;
  const owner =
    !!address &&
    !!selected &&
    address.toLowerCase() === selected.request.owner.toLowerCase() &&
    checked?.verified;
  function save(next: Passport[], restoring = false) {
    if (!address || (!storageReady && !restoring))
      throw new Error(
        "Connect the owner wallet and recover local storage before saving.",
      );
    const archive = {
      version: 1,
      chainId: 84532,
      owner: address,
      passports: next,
    };
    parseArchive(JSON.stringify(archive), address);
    localStorage.setItem(storageKey(address), JSON.stringify(archive));
    setRecords(next);
    setStorageReady(true);
  }
  function store(p: Passport) {
    const next = [
      ...records.filter(
        (r) => requestDigest(r.request) !== requestDigest(p.request),
      ),
      p,
    ];
    save(next);
    setSelected(p);
    setShare(`${location.origin}/pay#${encodePassport(p)}`);
  }
  async function action(fn: () => Promise<void>) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed. Try again.");
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    if (selected)
      await action(async () => {
        setChecked(await verify(selected));
        setNotice("Evidence refreshed from the chain.");
      });
  }
  return (
    <>
      <Header />
      <main id="main" className="container passport-page">
        <div className="passport-heading">
          <div>
            <h1>{publicView ? "Payment request" : "Payment Passport"}</h1>
            <p>
              {publicView
                ? "Payment details signed by the vault owner. Verify before you send."
                : "From payment requested to income organized."}
            </p>
          </div>
          <Link className="text-link" href="/app">
            Your vault workspace
          </Link>
        </div>
        <p className="notice">
          Base Sepolia testnet. ifUSD has no monetary value. This is a payment
          record, not a legal invoice or tax calculation.
        </p>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        {!publicView && (
          <div className="passport-toolbar">
            <button
              className="button secondary"
              disabled={!address || !storageReady || busy}
              onClick={() => {
                history.replaceState(null, "", "/passport");
                setDraft(null);
                setSelected(null);
                setReview(null);
                setChecked(null);
                setError("");
              }}
            >
              New request
            </button>
            <button
              className="button subtle"
              disabled={!address || !storageReady || busy}
              onClick={() =>
                download("incomeflow-passport-backup.json", {
                  version: 1,
                  chainId: 84532,
                  owner: address,
                  passports: records,
                })
              }
            >
              Export backup
            </button>
            <label
              className={`button subtle ${!address || busy ? "is-disabled" : ""}`}
              aria-disabled={!address || busy}
            >
              Import backup
              <input
                className="sr-only"
                type="file"
                accept="application/json"
                disabled={!address || busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void action(async () => {
                    if (file.size > 2000000)
                      throw new Error("Archive exceeds 2 MB.");
                    const next = parseArchive(await file.text(), address!);
                    for (const p of next) await verify(p);
                    save(next, true);
                    setNotice("Backup verified and restored.");
                  });
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        )}
        {!publicView && !address && (
          <p className="small muted">
            Connect the owner wallet to create requests or manage browser
            backups. Public records remain read only.
          </p>
        )}
        {!publicView && !address && !selected && (
          <section className="panel passport-empty">
            <h2>Your work deserves a clear record.</h2>
            <p>
              Connect your wallet to create an owner-signed request or recover
              your records. Already have a vault? Use its receiving address
              below after connecting.
            </p>
            <Link className="button secondary" href="/app">
              Create or find your vault
            </Link>
          </section>
        )}
        <div
          className={
            publicView || !address ? "passport-public" : "passport-layout"
          }
        >
          {!publicView && address && (
            <aside className="passport-index" aria-label="Saved requests">
              <h2>Your requests</h2>
              {records.length === 0 ? (
                <p className="muted">
                  No saved requests yet. Create one for your next job.
                </p>
              ) : (
                records.map((p) => (
                  <button
                    key={p.request.id}
                    aria-pressed={selected?.request.id === p.request.id}
                    className={`passport-request ${selected?.request.id === p.request.id ? "selected" : ""}`}
                    onClick={() => {
                      setError("");
                      setSelected(p);
                      setShare(`${location.origin}/pay#${encodePassport(p)}`);
                    }}
                  >
                    <strong>{p.request.title}</strong>
                    <span>{money(p.request.amount)} ifUSD</span>
                    <small>{p.request.id.slice(0, 14)}</small>
                  </button>
                ))
              )}
              <p className="small muted">
                Records stay in this browser, under your wallet address. Export
                a backup for another device. Shared signed requests work
                independently.
              </p>
            </aside>
          )}
          <div className="passport-body">
            {!selected && !publicView && address && !review && (
              <section className="panel">
                <h2>Request payment for your work.</h2>
                <p>
                  A signed request identifies your vault and the amount. It does
                  not move tokens.
                </p>
                <form
                  className="passport-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setError("");
                    try {
                      const f = new FormData(e.currentTarget);
                      const amount = String(f.get("amount"));
                      if (!/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(amount))
                        throw new Error(
                          "Use a positive amount with up to 6 decimals.",
                        );
                      const issuedAt = Math.floor(Date.now() / 1000);
                      setReview(
                        parseRequest({
                          version: 1,
                          id: `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("")}`,
                          owner: address,
                          vault: f.get("vault"),
                          token: PASSPORT_TOKEN,
                          chainId: 84532,
                          title: f.get("title"),
                          description: f.get("description") || "",
                          amount: parseUnits(amount, 6).toString(),
                          expectedPayer: f.get("payer") || zeroAddress,
                          issuedAt,
                          dueAt: f.get("due")
                            ? Math.floor(
                                new Date(
                                  `${f.get("due")}T23:59:59Z`,
                                ).getTime() / 1000,
                              )
                            : 0,
                          validUntil: 0,
                        }),
                      );
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : "Check your request.",
                      );
                    }
                  }}
                >
                  <label>
                    Job or project title
                    <input
                      name="title"
                      defaultValue={draft?.title}
                      maxLength={100}
                      required
                      placeholder="Website design · illustrative example"
                    />
                  </label>
                  <label>
                    Description (optional)
                    <textarea
                      name="description"
                      defaultValue={draft?.description}
                      maxLength={500}
                      rows={3}
                      placeholder="Keep private client details out of shareable links."
                    />
                  </label>
                  <label>
                    Amount requested (ifUSD)
                    <input
                      name="amount"
                      defaultValue={draft ? money(draft.amount) : ""}
                      inputMode="decimal"
                      required
                      placeholder="100"
                    />
                  </label>
                  <label>
                    Your IncomeFlow vault
                    <input
                      name="vault"
                      defaultValue={draft?.vault}
                      pattern="0x[a-fA-F0-9]{40}"
                      required
                      placeholder="0x…"
                      autoComplete="off"
                    />
                  </label>
                  <label>
                    Expected payer wallet (optional)
                    <input
                      name="payer"
                      defaultValue={
                        draft?.expectedPayer === zeroAddress
                          ? ""
                          : draft?.expectedPayer
                      }
                      pattern="0x[a-fA-F0-9]{40}"
                      placeholder="Any payer if left blank"
                      autoComplete="off"
                    />
                  </label>
                  <label>
                    Due date (optional, UTC)
                    <input
                      name="due"
                      type="date"
                      defaultValue={
                        draft?.dueAt
                          ? new Date(draft.dueAt * 1000)
                              .toISOString()
                              .slice(0, 10)
                          : ""
                      }
                    />
                  </label>
                  <p className="small muted">
                    The title, description, wallet addresses and dates are
                    readable by anyone with the link. A due date is a reminder,
                    not an expiry. Requests do not automatically collect unpaid
                    balances.
                  </p>
                  <button
                    className="button primary"
                    disabled={busy || !storageReady}
                  >
                    Review request
                  </button>
                </form>
              </section>
            )}
            {review && !selected && (
              <section className="panel">
                <h2>Review before signing</h2>
                <h3>{review.title}</h3>
                <p className="passport-amount">
                  {money(review.amount)} <span>ifUSD requested</span>
                </p>
                <RequestDetails r={review} />
                <p>
                  Verify the amount and full receiving address. Your wallet
                  signs the request; no tokens move and no approval is granted.
                </p>
                <div className="passport-toolbar">
                  <button
                    className="button primary"
                    disabled={
                      busy ||
                      address?.toLowerCase() !== review.owner.toLowerCase()
                    }
                    onClick={() =>
                      void action(async () => {
                        await switchChainAsync({ chainId: 84532 });
                        const signature = await signTypedDataAsync(
                          requestTypedData(review),
                        );
                        const p: Passport = {
                          version: 1,
                          request: review,
                          signature,
                          associations: [],
                        };
                        await verify(p);
                        store(p);
                        setReview(null);
                        setNotice(
                          "Owner signature and current on-chain ownership verified.",
                        );
                      })
                    }
                  >
                    {busy
                      ? "Waiting for verification…"
                      : "Sign and create request"}
                  </button>
                  <button
                    className="button subtle"
                    disabled={busy}
                    onClick={() => {
                      setDraft(review);
                      setReview(null);
                    }}
                  >
                    Edit request
                  </button>
                </div>
              </section>
            )}
            {selected && (
              <>
                <section className="panel passport-document">
                  <div className="passport-status" role="status">
                    {busy
                      ? "Checking signatures and chain evidence…"
                      : checked
                        ? "Owner-signed request verified"
                        : "Request not verified · do not pay"}
                  </div>
                  <h2>{selected.request.title}</h2>
                  <p className="passport-amount">
                    {money(selected.request.amount)}{" "}
                    <span>ifUSD requested</span>
                  </p>
                  {checked && (
                    <>
                      <div className="passport-summary">
                        <div>
                          <span>Verified received</span>
                          <strong>{money(checked.paid)} ifUSD</strong>
                        </div>
                        <div>
                          <span>Outstanding</span>
                          <strong>{money(checked.outstanding)} ifUSD</strong>
                        </div>
                        {checked.overpaid !== "0" && (
                          <div>
                            <span>Overpayment</span>
                            <strong>{money(checked.overpaid)} ifUSD</strong>
                          </div>
                        )}
                      </div>
                      <p className="small muted">
                        Amounts count only the verified transfers explicitly
                        associated by the vault owner. Other payments may remain
                        unlinked. Client identity is not verified.
                      </p>
                    </>
                  )}
                  <RequestDetails r={selected.request} />
                  <div className="passport-toolbar">
                    <CopyButton value={selected.request.vault} />
                    <ChainLink kind="address" value={selected.request.vault}>
                      View vault
                    </ChainLink>
                    <button
                      className="button subtle"
                      disabled={busy}
                      onClick={() => void refresh()}
                    >
                      Refresh evidence
                    </button>
                  </div>
                  {checked && (
                    <details className="passport-details">
                      <summary>Share request and client receipt</summary>
                      <p className="small">
                        Links include public request metadata and signed payment
                        references, never private keys. Send an updated link
                        after associating a payment; old links do not
                        synchronize.
                      </p>
                      <label>
                        Shareable link
                        <textarea readOnly rows={3} value={share} />
                      </label>
                      <CopyButton value={share} label="Copy request link" />
                      <a
                        className="button subtle"
                        href={share}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open client view
                      </a>
                      <a
                        className="button subtle"
                        href={`/passport#${encodePassport(selected)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open public allocation record
                      </a>
                      <button
                        className="button subtle"
                        onClick={() =>
                          download(
                            `client-receipt-${selected.request.id.slice(2, 10)}.json`,
                            {
                              request: selected,
                              verified: checked
                                ? {
                                    checkedAt: checked.checkedAt,
                                    paid: checked.paid,
                                    outstanding: checked.outstanding,
                                    overpaid: checked.overpaid,
                                    payments: checked.payments.map(
                                      ({
                                        transactionHash,
                                        logIndex,
                                        amount,
                                        paidAt,
                                      }) => ({
                                        transactionHash,
                                        logIndex,
                                        amount,
                                        paidAt,
                                      }),
                                    ),
                                    failures: checked.failures,
                                  }
                                : null,
                              notice:
                                "Owner-associated transfers; client identity not verified. Reverify on chain.",
                            },
                          )
                        }
                      >
                        Export client receipt
                      </button>
                    </details>
                  )}
                </section>
                {checked && (
                  <section className="panel">
                    <h2>
                      {publicView
                        ? checked.outstanding === "0"
                          ? "Payment record"
                          : "Pay this request"
                        : "Incoming payments and allocations"}
                    </h2>
                    {publicView ? (
                      <>
                        {checked.outstanding === "0" && !allowAdditional ? (
                          <>
                            <p className="notice">
                              Request paid in the associated record. No further
                              payment is requested. Other transfers may remain
                              unlinked.
                            </p>
                            <button
                              className="button subtle"
                              onClick={() => setAllowAdditional(true)}
                            >
                              Make an additional test payment
                            </button>
                          </>
                        ) : (
                          <>
                            <p>
                              Send only the supported valueless test token on
                              Base Sepolia. Gas requires test ETH. An ordinary
                              token transfer contains no request ID: share its
                              hash and log index with the owner for
                              confirmation.
                            </p>
                            <p className="small">
                              Token:{" "}
                              <ChainLink
                                kind="address"
                                value={PASSPORT_TOKEN}
                              />
                            </p>
                            <label>
                              Payment amount (ifUSD)
                              <input
                                inputMode="decimal"
                                value={paymentAmount}
                                onChange={(e) =>
                                  setPaymentAmount(e.target.value)
                                }
                              />
                            </label>
                            <label className="passport-checkbox">
                              <input
                                type="checkbox"
                                checked={allowAdditional}
                                onChange={(e) =>
                                  setAllowAdditional(e.target.checked)
                                }
                              />
                              Allow an additional payment above the associated
                              outstanding amount
                            </label>
                            {address &&
                              selected.request.expectedPayer !== zeroAddress &&
                              address.toLowerCase() !==
                                selected.request.expectedPayer.toLowerCase() && (
                                <p className="notice">
                                  Connect the expected payer wallet shown in
                                  this request before paying.
                                </p>
                              )}
                            <button
                              className="button primary"
                              disabled={
                                busy ||
                                !address ||
                                checked.failures.length > 0 ||
                                (selected.request.expectedPayer !==
                                  zeroAddress &&
                                  address.toLowerCase() !==
                                    selected.request.expectedPayer.toLowerCase())
                              }
                              onClick={() =>
                                void action(async () => {
                                  if (
                                    !/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(
                                      paymentAmount,
                                    ) ||
                                    parseUnits(paymentAmount, 6) <= 0n
                                  )
                                    throw new Error(
                                      "Enter a positive payment with up to 6 decimals.",
                                    );
                                  if (!wallet)
                                    throw new Error("Connect your wallet.");
                                  const latest = await verify(selected);
                                  if (
                                    !latest.verified ||
                                    latest.failures.length
                                  )
                                    throw new Error(
                                      "Payment evidence is incomplete. Refresh and resolve unverified references before paying.",
                                    );
                                  if (
                                    parseUnits(paymentAmount, 6) >
                                      BigInt(latest.outstanding) &&
                                    !allowAdditional
                                  )
                                    throw new Error(
                                      "This exceeds the associated outstanding amount. Explicitly allow an additional payment first.",
                                    );
                                  await switchChainAsync({ chainId: 84532 });
                                  const tx = await wallet.writeContract({
                                    chain: { ...baseClient.chain },
                                    account: address!,
                                    address: PASSPORT_TOKEN,
                                    abi: erc20Abi,
                                    functionName: "transfer",
                                    args: [
                                      selected.request.vault,
                                      parseUnits(paymentAmount, 6),
                                    ],
                                  });
                                  setNotice(
                                    `Payment broadcast: ${tx}. Waiting for its receipt.`,
                                  );
                                  const receipt =
                                    await baseClient.waitForTransactionReceipt({
                                      hash: tx,
                                    });
                                  if (receipt.status !== "success")
                                    throw new Error(
                                      "Payment reverted. No successful payment was recorded.",
                                    );
                                  setNotice(
                                    `Transfer confirmed: ${tx}. Share this hash and its Transfer log index with the owner. Association and allocation are checked separately.`,
                                  );
                                })
                              }
                            >
                              {!address
                                ? "Connect a wallet to pay"
                                : chainId !== 84532
                                  ? "Switch network and pay test ifUSD"
                                  : "Pay test ifUSD"}
                            </button>
                            <p className="small muted">
                              Paying does not automatically update the request’s
                              associated balance. The owner must confirm the
                              transfer reference. Additional payments may create
                              an overpayment after association.
                            </p>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <p>
                          Explicitly associate a transfer with this job. A
                          matching amount alone is never evidence of
                          attribution.
                        </p>
                        {owner ? (
                          <form
                            className="passport-form"
                            onSubmit={(e) => {
                              e.preventDefault();
                              setError("");
                              try {
                                const f = new FormData(e.currentTarget),
                                  index = String(f.get("logIndex"));
                                if (!/^\d{1,7}$/.test(index))
                                  throw new Error(
                                    "Enter the exact integer log index.",
                                  );
                                const a = {
                                  transactionHash: String(
                                    f.get("transactionHash"),
                                  ) as Hex,
                                  logIndex: Number(index),
                                  destinationHash: (f.get("destinationHash") ||
                                    zeroHash) as Hex,
                                  reactiveHash: (f.get("reactiveHash") ||
                                    zeroHash) as Hex,
                                };
                                parsePassport({
                                  ...selected,
                                  associations: [
                                    ...selected.associations,
                                    { ...a, signature: selected.signature },
                                  ],
                                });
                                setCandidate(a);
                              } catch (e) {
                                setError(
                                  e instanceof Error
                                    ? e.message
                                    : "Check payment references.",
                                );
                              }
                            }}
                          >
                            <label>
                              Origin transaction hash
                              <input
                                name="transactionHash"
                                required
                                placeholder="0x…"
                              />
                            </label>
                            <label>
                              Transfer log index
                              <input
                                name="logIndex"
                                required
                                inputMode="numeric"
                                placeholder="Exact receipt log index"
                              />
                            </label>
                            <details>
                              <summary>
                                Optional callback and Reactive evidence
                              </summary>
                              <label>
                                Destination callback transaction hash
                                <input
                                  name="destinationHash"
                                  placeholder="0x… (or discover within 2,000 blocks)"
                                />
                              </label>
                              <label>
                                Reactive transaction hash
                                <input
                                  name="reactiveHash"
                                  placeholder="0x… (leave blank if unknown)"
                                />
                              </label>
                            </details>
                            <button
                              className="button secondary"
                              disabled={busy}
                            >
                              Review payment association
                            </button>
                          </form>
                        ) : (
                          <p className="muted">
                            Connect the current owner wallet to associate a
                            payment. Read-only receipts remain available.
                          </p>
                        )}
                        {candidate && owner && (
                          <div className="notice">
                            <h3>Confirm the job association</h3>
                            <p>
                              You are explicitly asserting that log{" "}
                              {candidate.logIndex} of{" "}
                              <span className="mono">
                                {candidate.transactionHash}
                              </span>{" "}
                              belongs to this request. The signature does not
                              prove client identity. The server will verify the
                              actual transfer before counting it.
                            </p>
                            <button
                              className="button primary"
                              disabled={busy}
                              onClick={() =>
                                void action(async () => {
                                  await switchChainAsync({ chainId: 84532 });
                                  const signature = await signTypedDataAsync(
                                    associationTypedData(
                                      selected.request,
                                      candidate,
                                    ),
                                  );
                                  const p = {
                                    ...selected,
                                    associations: [
                                      ...selected.associations,
                                      { ...candidate, signature },
                                    ],
                                  };
                                  const data = await verify(p);
                                  const failure = data.failures.find(
                                    (f) => f.key === paymentKey(candidate),
                                  );
                                  if (failure) throw new Error(failure.error);
                                  store(p);
                                  setChecked(data);
                                  setCandidate(null);
                                  setNotice(
                                    "Owner association signed; transfer verified and counted once.",
                                  );
                                })
                              }
                            >
                              Sign association
                            </button>
                            <button
                              className="button subtle"
                              onClick={() => setCandidate(null)}
                            >
                              Cancel association
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    {checked.payments.length === 0 ? (
                      <p className="empty-state">
                        No verified associated payments. An unsigned claim,
                        pending transaction or unlinked deposit does not count.
                      </p>
                    ) : (
                      checked.payments.map((p) => (
                        <article key={p.id} className="passport-payment">
                          <div>
                            <h3>{money(p.amount)} ifUSD received</h3>
                            <p>{p.status}</p>
                          </div>
                          <p>
                            {new Date(p.paidAt * 1000).toLocaleString()}{" "}
                            <span className="muted">Log {p.logIndex}</span>
                          </p>
                          <ChainLink value={p.transactionHash}>
                            Verified origin transfer
                          </ChainLink>
                          {!publicView && (
                            <>
                              <p>
                                Request association: owner confirmed. Payer
                                identity: unverified.
                              </p>
                              {p.reactiveHash ? (
                                <ChainLink
                                  value={p.reactiveHash}
                                  chain={5318007}
                                >
                                  Verified Reactive execution
                                </ChainLink>
                              ) : (
                                <p className="small muted">
                                  Reactive transaction not supplied. A confirmed
                                  destination allocation is independently
                                  checked.
                                </p>
                              )}
                              {p.destinationHash && (
                                <ChainLink value={p.destinationHash}>
                                  Authenticated callback and payouts
                                </ChainLink>
                              )}
                              {p.version && (
                                <p>Policy at execution: version {p.version}</p>
                              )}
                              {p.allocations.map((a, i) => (
                                <p key={i}>
                                  {money(a.amount)} ifUSD →{" "}
                                  <ChainLink
                                    kind="address"
                                    value={a.recipient}
                                  />
                                </p>
                              ))}
                            </>
                          )}
                        </article>
                      ))
                    )}
                    {checked.failures.map((f) => (
                      <p className="notice error" key={f.key}>
                        Not counted: {f.error}{" "}
                        <span className="mono">{f.key}</span>
                      </p>
                    ))}
                    {!publicView && (
                      <div className="passport-toolbar">
                        <button
                          className="button secondary"
                          onClick={() =>
                            download(
                              `passport-${selected.request.id.slice(2, 10)}.json`,
                              {
                                passport: selected,
                                observed: checked,
                                notice:
                                  "Reverify signatures, current ownership and chain evidence. No client identity attestation.",
                              },
                            )
                          }
                        >
                          Export complete Passport
                        </button>
                        {checked.outstanding !== "0" && (
                          <CopyButton
                            label="Copy manual reminder"
                            value={`Payment reminder for ${selected.request.title}: ${money(checked.outstanding)} test ifUSD outstanding in the associated record. Please verify any unlinked transfers before paying again. ${share}`}
                          />
                        )}
                      </div>
                    )}
                    <p className="small muted">
                      Blockchain data is public. The client view omits internal
                      allocation details, but cannot hide them on chain. RPC
                      errors leave references uncounted until verification
                      succeeds.
                    </p>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
function RequestDetails({ r }: { r: PaymentRequest }) {
  return (
    <>
      <p>{r.description}</p>
      <dl className="passport-meta">
        <div>
          <dt>Request reference</dt>
          <dd className="mono">{r.id}</dd>
        </div>
        <div>
          <dt>Receiving vault</dt>
          <dd className="mono">{r.vault}</dd>
        </div>
        <div>
          <dt>Network and token</dt>
          <dd>Base Sepolia (84532) · ifUSD, 6 decimals</dd>
        </div>
        <div>
          <dt>Issued</dt>
          <dd>{new Date(r.issuedAt * 1000).toISOString().slice(0, 10)} UTC</dd>
        </div>
        {r.dueAt !== 0 && (
          <div>
            <dt>Due</dt>
            <dd>{new Date(r.dueAt * 1000).toISOString().slice(0, 10)} UTC</dd>
          </div>
        )}
        <div>
          <dt>Expected payer</dt>
          <dd className="mono">
            {r.expectedPayer === zeroAddress
              ? "Any address · identity unverified"
              : r.expectedPayer}
          </dd>
        </div>
      </dl>
    </>
  );
}
