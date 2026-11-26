# Internal security audit

Date: 2026-11-25. Scope: the original Solidity sources, pinned Omni/OpenZeppelin boundaries, Next.js frontend/API, wallet bridge, deployment scripts and dependency configuration. This is an internal engineering assessment, **not an independent professional audit**. Testnet assets only.

## Threat model and custody

A payer may send ordinary supported ERC-20 transfers. Untrusted parties may call every external function, forge callback arguments, replay events, submit malformed API input or refuse wallet requests. Owners are trusted to select destinations and may deliberately update their own plan. Reactive SYSTEM and the official callback provider are trusted infrastructure, not independently verified by a destination light client. Only a conventional immutable demo token is supported.

There is no shared administrator-controlled custody wallet, upgrade key, backend payout key or database authorization. An independently deployed vault and Reactive contract have their own two-step owners. RC and vault ownership must be transferred separately. The original deployer’s ownership of its demonstration pair gives no privilege over someone else’s independently deployed pair.

## Manual fund-path review

| Path | Checks and result |
| --- | --- |
| `react(LogRecord)` | SYSTEM-only; exact chain, emitting token, Transfer signature, indexed vault, topic/address normalization, opcode/topic count and 32-byte amount. Zero/unrecognized events are ignored. IDs include chain, token, vault, transaction and log index. |
| Callback request/retry | Payload originates from an authenticated event and is stored before requesting. Owner retry selects an existing ID only, with a timestamp cooldown; it cannot forge an amount or destination. One-time vault binding prevents redirection. |
| `allocate` | Official provider **and** immutable Reactive sender; correct source chain/token, nonzero source identifiers and amount, nonfuture block, recovery cutoff, active policy and sufficient balance. Replay becomes an explicit no-op. |
| Allocation transfers | Reentrancy guard, effects before interactions, current policy copied to memory, SafeERC20, full-precision integer math, bounded 2–8 destinations. Final recipient receives remainder. Any transfer failure rolls back all accounting and transfers. |
| Rule updates | Owner-only; positive basis points, total exactly 10,000, unique/nonzero recipients, excludes vault/token/provider, bounded labels. Pending callbacks intentionally use the policy current at execution. |
| Recovery | Supported-token sweep requires paused owner and records source-block cutoff before transfer. Old callbacks cannot spend replacement deposits. Unsupported recovery explicitly rejects the supported token. Renouncing ownership is disabled. |
| Fees/native value | Inherited payable-service boundaries reviewed. Public debt covering can pay only the immutable service. No caller-chosen withdrawal recipient; fee funds cannot be withdrawn in this MVP. |
| Demo faucet | Valueless testnet-only token; per-address timestamp cooldown. Not Sybil resistant and never represented as official USDC. |

No unresolved critical/high-severity defect was identified in this scoped manual review. This conclusion does not establish absence of vulnerabilities.

## Findings and disposition

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| IF-01 | High, resolved during implementation | A recovered old payment could otherwise consume later deposits. | Full sweep plus monotonic recovery block cutoff; regression test. |
| IF-02 | High, resolved during implementation | Callback provider authentication alone does not identify the originating automation. | Both official provider and configured Reactive sender checked; negative tests. |
| IF-03 | Medium, resolved | Amount-only replay identifiers would collide. | Domain-separated source transaction/log identifiers; local and real replay proof. |
| IF-04 | Low, resolved | Interrupted deploy/payment scripts could repeat operations. | Persist confirmed addresses/hashes, verify receipts, refuse repeated faucet; signed browser runner separately records transactions. |
| IF-08 | Medium, resolved | Multi-step setup compared against a stale render chain ID after its first network switch. | Every write now confirms the target network through the connector; actual resumable signed journey is the regression gate. |
| IF-09 | Low, resolved | SSR calculator accepted edits before hydration and could show stale preview amounts on a cold load. | Inputs remain disabled until hydration; deterministic delayed-JavaScript browser regression. Illustrative only, no custody impact. |
| IF-10 | Low, resolved | Confirmed rule save cleared fields to stale pre-save values before refreshed policy arrived. | Retain submitted values during refresh and clear validation state; no financial state change. |
| IF-05 | Low, accepted | Public read API can consume RPC resources; in-memory cache is per instance. | Bounded 400-block windows, 200-block requests, input validation and coalescing. Public hosting/RPC quotas remain an operational limit; no custody consequence. |
| IF-06 | Informational | Rule updates affect pending payments; native fee funds have no withdrawal path. | Explicit product disclosure. Owner can pause/recover token funds. |
| IF-07 | Informational | Upstream Omni source has UNLICENSED SPDX identifiers. | Not vendored; pinned local download. Licensing clarification required before redistribution/commercial use. |

## Frontend, API and wallet review

React escapes text; no user-controlled HTML rendering or executable asset injection is used. Input addresses, percentages, duplicate destinations, token restrictions and API cursors are validated. Contract checks remain authoritative even if client validation is bypassed. Explorer links use fixed supported-network hosts. RPC endpoints come from configuration rather than request input. Signing credentials are server-tool-only, ignored by Git and excluded from Vercel uploads; the production API never accesses a keystore.

Wallet writes use the selected account and explicit testnet chains. A broadcast hash is not displayed as distribution success. Real receipts control confirmed state; unknown callback stages stay unknown. Rejected signatures, network mismatch, loading/RPC errors, pauses, debt and recovery acknowledgment have explicit states. Session rule drafts are noncustodial and cannot authorize payments.

The opt-in Node test signer is test infrastructure, not shipped browser wallet code. It restricts chain IDs, account, known targets, recognized deployment bytecode and per-call value. No key is exported into the page. A malicious locally controlled test page would remain outside the production threat boundary; run this harness only against the trusted build.

## Evidence and tooling limits

Foundry unit/fuzz/invariant outcomes, lint/typecheck/unit/browser results, dependency audit and deployed evidence are recorded in [TESTING.md](TESTING.md), [PRE_SUBMISSION_AUDIT.md](PRE_SUBMISSION_AUDIT.md) and [ONCHAIN_PROOF.md](ONCHAIN_PROOF.md). Passing local harness tests alone is not proof of live network execution.

Solar linter rejected an inherited `Ownable(owner_)` constructor invocation through `Ownable2Step` although pinned solc successfully compiles it and executable tests exercise deployment. This is a parser/tool compatibility limitation, not evidence of a Solidity initialization defect. No verified deployed source was modified to hide the warning. No Slither or Semgrep pass is claimed if those tools are unavailable.

Before mainnet: independent audit, upstream licensing resolution, realistic service/funding failure tests, token-specific integration review, economic analysis and longer operational observation are required.
