# Internal security audit

Review started 2026-11-25; release reconciliation 2026-11-26. Scope: the original Solidity sources, pinned Omni/OpenZeppelin boundaries, Next.js frontend/API, wallet bridge, deployment scripts and dependency configuration. This is an internal engineering assessment, **not an independent professional audit**. Testnet assets only.

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

Existing-address reads validate contract interfaces, supported token and official provider, but are not a source-code attestation for an arbitrary address. Use the verified deployment manifest or the application’s known-bytecode creation workflow; independently inspect source before depositing into a third-party address. The original three contracts have exact source matches; no source-verification claim is made for every arbitrary address a visitor enters.

## Original release reconciliation

Application/contract/test/workflow files remain unchanged from the passing `546e51a` checkpoint. Recorded evidence: 28 Foundry tests (including fuzz/invariant), 7 unit tests, 14 local-build and 14 independent public browser tests, ten inspected production captures and zero production browser errors. No new blockchain transaction was used for media completion. No unresolved critical/high project finding was identified; Solar remains an unresolved parser/tool compatibility limitation and was not marked passed.

The initial video audit followed the reused shared node_modules symlink and reported one moderate minimatch glob-amplification advisory in the shared installation. That installation was not modified. The video project now has an independent portable registry lockfile, audited with zero vulnerabilities. Rendering used trusted project paths only; these offline tools are excluded from the deployed application. The web application's separate production dependency audit was also clean.

Final publication check: the release MP4 was anonymously downloaded and matched the validated local SHA-256. Secrets/keystores, raw temporary recordings, caches and the shared dependency symlink are excluded from Git. Final application/contract source did not change during media finalization, so no additional live transaction or manual full-suite rerun was necessary. The normal main-branch CI remains the closing regression gate.

## Payment Passport extension review — 2026-11-26

Scope adds `passport.ts`, `passport-chain.ts`, bounded read-only verification route, request/client pages, local archives and opt-in encrypted acceptance harness. Existing Solidity is unchanged; 28 Foundry regressions passed again. The preserved release's audit result above does not automatically attest to this extension.

Reviewed boundaries: domain-separated EIP-712 EOA signatures; all metadata included in the signed request; current owner read; pinned compiled vault runtime with immutable masking; fixed chain/token/proxy; explicit owner association bound to full request digest and exact origin hash/log; integer arithmetic; duplicates within/across local requests; receipt status/token/to/payer/time; callback-to-proxy transaction with matching canonical-vault events and actual token payouts; optional exact Reactive receipt; schema/version/date/size/control-text validation; escaped rendering; namespaced validated archives; no signing service in production.

| ID | Severity / disposition | Finding and resolution |
| --- | --- | --- |
| PP-01 | Medium, resolved before release | Initial callback verifier assumed a top-level transaction from proxy to vault. Actual historical receipt showed relayer → proxy → vault. Verifier now checks proxy target plus exact canonical-vault logs, conserved allocations and actual transfers; regression cases reject wrong targets and fabricated payouts. |
| PP-02 | Low, resolved before release | Old verification results were keyed only by request metadata while association sets could change. Results now fingerprint the entire validated envelope, and an already verified saved association avoids a redundant loading/reset cycle. |
| PP-03 | Low, resolved before release | Unbounded chunked JSON bodies could be buffered before size checking. Verification now reads a stream with a 50,000-byte limit and cancels excess input. |
| PP-04 | Low, mitigated | Receipt verification consumes public RPC resources. Association count is capped at 20, discovery at 2,000 blocks, concurrency at 3 and UI verification at 55 seconds. Public infrastructure quotas and transient RPC failures remain operational limits. |
| PP-05 | Informational, accepted | There is no global invoice registry or exclusive cross-device attribution. An owner can issue conflicting independent associations. Local duplicate prevention and explicit disclosure avoid implying legally exclusive settlement. |
| PP-06 | Informational, accepted | EOA signatures only; no EIP-1271 support or cryptographic client-identity attestation. Ownership changes invalidate earlier requests; signed links are public, non-expiring by default and do not auto-sync. |

The genuine new request and two test-token payments are recorded independently in ONCHAIN_PROOF.md. No old transfer was relabeled as a newly issued invoice. The production API has no keystore access; the opt-in Node harness restricts signatures to this domain/vault and permits only 40+60 ifUSD payments, persists every hash and refuses further sends. Returning-owner test harness selector/initialization failures and RPC limitations are retained in the QA ledger.

No unresolved critical/high issue has been identified in this internal scope so far. Final regression, screenshot critique and public deployment checks remain the extension's release gates. Solar still has the documented inherited-constructor parser limitation and is not reported as passed. This is not an independent professional audit.

### Final review corrections

Independent UI/source review found that Review → Edit dropped the expected payer and due date, and the signing review omitted title/amount. Both are corrected and covered by a non-signing browser regression. A settled request now clearly states no further payment is requested; any amount above the verified associated outstanding balance requires explicit additional-payment acknowledgment, rechecked immediately before signing a transfer. Verification failures block payment.

The verifier now also attests the compiled IncomeFlowReactive runtime and checks its token/vault binding on Lasna. A malicious contract emitting a lookalike PaymentObserved event is insufficient. Invalid request/association signatures are rejected before RPC reads, followed by a fresh current-owner check. This strengthens evidence authentication without changing deployed contracts or repeating payments. Final regression outcomes are recorded in PASSPORT_QA.md.

Signed timestamps are owner assertions rather than trusted issuance-time proofs. No global request registry or legal invoice attestation is claimed. The actual demonstration signs first and then sends the two payments; recorded workflow evidence supports that specific ordering. This is an accepted informational limitation, distinct from authenticated on-chain block timestamps.

Release source checkpoint `237e535` passed feature CI (28 contract, 25 unit, 20 browser tests plus build/types/lint). Subsequent media tools are offline and excluded from Vercel. Revised-film repairs sent no blockchain transactions. Temporary render/cache files, encrypted wallets and signing credentials remain excluded from Git; public signatures and illustrative metadata are intentionally included proof. Final public verification is recorded separately after promotion.

## Enhanced production reconciliation — 2026-11-27

The source/main CI and independent public 20-test suite passed. Public API freshly authenticated the two original signed associations and exact origin/Reactive/callback/payout evidence. No new financial action was performed for verification. Owner-only UI review used a read-only account connector with signing/sending disabled; eight inspected screenshots and empty request/page diagnostics are preserved. The scoped independent visual reviewer cleared the final narrow controls.

No unresolved critical/high issue was identified within this internal review. Existing accepted RPC/funding, EOA-only signature, owner-asserted metadata, local-storage recovery, current-policy and upstream license limitations remain. Solar was not passed. This release remains a testnet prototype and is not independently professionally audited. Final delivery changes only documentation and capture diagnostics; production code remains the tested 237e535 snapshot.
