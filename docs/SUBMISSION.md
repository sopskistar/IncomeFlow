# DoraHacks submission draft

**Title:** IncomeFlow — give every payment a purpose

**Track:** Set It and Forget It

**Public application:** https://incomeflow-gamma.vercel.app

**Repository:** https://github.com/sopskistar/IncomeFlow (MIT original code; dependency licensing caveat below)

## Short description

IncomeFlow automatically organizes supported crypto income into spending, savings and user-selected reserves. Independent professionals configure wallet destinations and percentages once. A normal ERC-20 payment to their own receiving vault triggers Reactive Omni and an authenticated callback, with public receipts for the actual allocations.

## Problem and usefulness

A freelancer receiving cryptocurrency still needs to move each payment into the wallets used for daily spending, saving and reserves. A manual splitter reduces transfer calls but still requires someone to initiate each distribution. IncomeFlow focuses on the recurring income workflow: a no-code allocation plan, a shareable receiving address and event-driven execution while the recipient is offline. Tax reserve percentages remain the user's choice, not an estimate of tax liability.

## What Reactive does

The supported token emits a genuine `Transfer` event; a regular ERC-20 transfer does not execute the receiving vault. An independent `IncomeFlowReactive` contract on Lasna subscribes to the emitting token and exact indexed vault destination. It validates the normalized `LogRecord` and calls `requestCallbackV_1_0`. The Base vault checks the official callback provider and specific Reactive sender, then allocates using current on-chain rules. No backend payout signer or cron job controls funds.

## Technical achievements

- A real 100 ifUSD origin payment -> Lasna execution -> authenticated Base callback -> 50/30/20 token distribution.
- A separate signed frontend user journey created its own pair, saved policy, paid and inspected actual receipts; pause/resume and returning-owner checks passed.
- A real duplicate callback emitted `DuplicateIgnored` without extra payouts.
- Exact creation/runtime Sourcify matches for the original deployed contracts.
- Integer-conserving allocations, domain-separated replay IDs, two-step ownership, bounded rules, pause/recovery cutoff and owner-only stored-event retry.
- Chain-backed Next.js interface, wallet switching, resumable setup, policy drafts, paginated history and service fee/debt diagnostics.
- Foundry unit/fuzz/invariant checks, browser regression and GitHub Actions. Internal security review is disclosed separately from a professional audit.

## Judge verification path

1. Open the app and choose **Explore the verified vault**.
2. Read the 50/30/20 allocation and its confirmed 100 ifUSD receipt.
3. Expand the receipt and follow actual origin, Reactive and destination explorer links.
4. Open `/proof` for the qualified two-second original-run observation, actual replay and source-verification references.
5. Read [ONCHAIN_PROOF.md](ONCHAIN_PROOF.md) for raw receipts, balance deltas, original and signed-frontend addresses and all transaction links.
6. Reproduce with the deployment/test guides. Additional transfers require testnet gas and the explicitly labeled ifUSD demo token; never send real assets.

## Addresses and evidence

The authoritative original deployment is [deployments/testnet.json](../deployments/testnet.json). The original proof and seven signed frontend transactions are linked in [ONCHAIN_PROOF.md](ONCHAIN_PROOF.md); [browser-proof.json](../deployments/browser-proof.json) records the independent user pair and actual receipt state. Do not substitute a requested callback for a successful destination receipt.

## Honest limitations

This prototype supports only its conventional valueless demo token on Base Sepolia, with Lasna automation. Public RPCs have rate/history limitations; unknown delivery stages remain unconfirmed. Policies apply when callbacks execute. Owners must maintain funding on both sides; pauses, failures and service delays may require recovery/retry. Original measured latency is a single observation, not a guarantee. Mainnet/commercial use requires independent review and clarification of the upstream Omni library's UNLICENSED SPDX status; downloaded dependencies are not presented as original event work. No adoption, audited safety or uptime claim is made.

## Submission checklist

- [x] Original project built during the November 5–December 5 event window.
- [x] Public repository with original MIT code and preserved history.
- [x] Actual origin/Reactive/callback/payout proof and real replay.
- [x] Deployed addresses, network/explorer details and exact source matches.
- [x] Signed frontend workflow and internal security audit.
- [ ] Final post-fix production browser recheck.
- [ ] Final narrated MP4 under three minutes, inspected and publicly linked.
- [ ] Final CI/commit and evidence ledger reconciled.
- [ ] User checks exact DoraHacks closing time and any authenticated portal fields.
- [ ] User reviews and manually submits; no automatic submission authorized.

Official announcement confirms December 5, equal execution/integration/usefulness/craft scoring and video under three minutes. The [DoraHacks event page](https://dorahacks.io/hackathon/reactive-omni-buildathon/detail) repeatedly returned HTTP 405 to automated access. Exact cutoff/timezone is **not verified**; do not infer it from a third-party listing. [Official organizer announcement](https://blog.reactive.network/reactive-omni-buildathon-thirty-days-to-find-out-what-one-second-buys/).
