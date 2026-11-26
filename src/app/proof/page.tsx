import Link from "next/link";
import { Check, GitBranch, ArrowUpRight } from "lucide-react";
import { Header, Footer, ChainLink, CopyButton } from "@/components/shared";
import proof from "../../../deployments/evidence/m1.json";
import { deployment } from "@/lib/contracts";
export const metadata = { title: "Verified on-chain payment" };
export default function ProofPage() {
  return (
    <>
      <Header />
      <main className="container proof-page" id="main">
        <div className="proof-heading">
          <h1>
            A payment you can
            <br />
            follow all the way.
          </h1>
          <p>
            A genuine testnet payment, automatically allocated through Reactive
            Omni. Verified November 25, 2026.
          </p>
          <Link className="button primary" href="/app?vault=demo&view=activity">
            Open the live vault
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="proof-amounts">
          <div>
            <span>Received</span>
            <strong>
              100 <small>ifUSD</small>
            </strong>
          </div>
          <GitBranch size={32} aria-hidden="true" />
          <div>
            <span>Spending</span>
            <strong>50</strong>
          </div>
          <div>
            <span>Savings</span>
            <strong>30</strong>
          </div>
          <div>
            <span>Tax reserve</span>
            <strong>20</strong>
          </div>
        </div>
        <section className="proof-sequence">
          <h2>Three on-chain steps. One organized payment.</h2>
          <ol className="receipt-timeline">
            <li>
              <Check size={20} aria-hidden="true" />
              <div>
                <h3>The payment arrived</h3>
                <p>
                  100 ifUSD transferred directly to the vault on Base Sepolia.
                  The ERC-20 token emitted a real Transfer event.
                </p>
                <ChainLink value={proof.origin.hash}>
                  Inspect the origin transaction
                </ChainLink>
                <span>
                  Block {proof.origin.block}, log{" "}
                  {proof.origin.transferLogIndex}
                </span>
              </div>
            </li>
            <li>
              <Check size={20} aria-hidden="true" />
              <div>
                <h3>Reactive requested the allocation</h3>
                <p>
                  The exact destination subscription matched. SYSTEM called the
                  Lasna contract, which requested an authenticated callback.
                </p>
                <ChainLink value={proof.reactiveExecution.hash} chain={5318007}>
                  Inspect the Reactive transaction
                </ChainLink>
              </div>
            </li>
            <li>
              <Check size={20} aria-hidden="true" />
              <div>
                <h3>The vault paid all three destinations</h3>
                <p>
                  The official Base callback proxy delivered the request. The
                  vault verified the Reactive identity and transferred 50, 30
                  and 20 ifUSD.
                </p>
                <ChainLink value={proof.destination.hash}>
                  Inspect the callback and token transfers
                </ChainLink>
                <span>
                  Policy version 1. Recipient balances verified before and
                  after.
                </span>
              </div>
            </li>
          </ol>
        </section>
        <section className="proof-check">
          <div>
            <h2>
              Delivered twice.
              <br />
              Paid once.
            </h2>
            <p>
              A real authenticated retry reached the vault. It emitted
              DuplicateIgnored and transferred no additional tokens. Balances
              stayed 50/30/20.
            </p>
            <ChainLink value={proof.replay.destinationHash}>
              Inspect the replay receipt
            </ChainLink>
          </div>
          <div>
            <h3>What the measurement means</h3>
            <p>
              The origin and distribution Base block timestamps differ by{" "}
              {proof.latencySeconds} seconds for this run. This is a single
              observation, not a latency guarantee.
            </p>
            <p className="small muted">
              The system delivery-record query returned an empty array during
              verification. The linked receipts, authenticated payment ID and
              actual Transfers provide the evidence chain.
            </p>
          </div>
        </section>
        <details className="advanced">
          <summary>Contract addresses, source matches and raw evidence</summary>
          <dl className="key-values">
            <dt>Vault</dt>
            <dd>
              <ChainLink value={deployment.vault} kind="address" />
            </dd>
            <dt>Demo token</dt>
            <dd>
              <ChainLink value={deployment.token} kind="address" />
            </dd>
            <dt>Reactive contract</dt>
            <dd>
              <ChainLink
                value={deployment.reactive}
                kind="address"
                chain={5318007}
              />
            </dd>
            <dt>Payment ID</dt>
            <dd className="address-text">
              {proof.paymentId}
              <CopyButton value={proof.paymentId} label="Copy payment ID" />
            </dd>
          </dl>
          <a
            className="text-link"
            href="https://github.com/sopskistar/IncomeFlow/blob/main/docs/ONCHAIN_PROOF.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the reproducible proof and source-verification links
          </a>
        </details>
      </main>
      <Footer />
    </>
  );
}
