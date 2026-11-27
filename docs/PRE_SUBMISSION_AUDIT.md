# Pre-submission audit

This is a factual release gate, not an independent security certification. Original M1 remains verified and unchanged. Later frontend acceptance, hosting and video results are recorded separately below and in BUILD_STATUS.md.

## Preserved original release evidence

| Requirement | Current evidence |
| --- | --- |
| Genuine source event | Successful Base token Transfer, exact vault destination; raw M1 receipt |
| Essential Reactive execution | Successful Lasna transaction with PaymentObserved and callback request |
| Successful destination | Official proxy -> authorized vault; actual token transfers 50/30/20 |
| Replay prevention | Real second callback emits DuplicateIgnored, no extra transfers |
| Source verification | Exact creation/runtime Sourcify matches for original three contracts |
| Source reproducibility | Pinned compiler/library/dependencies, deployment manifest and receipt files |
| Public app | PASS: actual public HTTP/API, 14 public tests and ten inspected production captures; PRODUCTION_QA.md |
| Signed frontend acceptance | PASS: independent pair, real policy/payment/callback, pause/resume and returning owner; browser-proof.json |
| Internal audit | PASS within internal scope: 28 Foundry tests, 7 units, lint/types/audit passed; Solar parser limitation disclosed |
| Browser/responsive | PASS: 14 local + 14 independent public tests; responsive captures and zero browser errors |
| Video | PASS locally: 150.0s MP4, full decode, H.264/AAC, 1080p30, aligned narration, zero black intervals and inspected frames; deployments/video.json |
| Submission | Manual DoraHacks submission only; exact portal cutoff still unverified |

## Acceptance coverage map

The verification mode matters. Local mocks are never substituted for live delivery.

| Behavior | Appropriate gate |
| --- | --- |
| New connection, wrong network, rejected request, disconnect | Explicit non-signing EIP-1193 browser fixture plus signed connection |
| Vault creation/resume, own policy save, payment, receipt, pause/resume | Opt-in encrypted-signer browser journey and confirmed receipts |
| Reconnection and refresh | Browser state regression plus returning public vault read; no duplicate sends |
| Ownership attacks, invalid totals/recipients, failed token, paused callback | Foundry negative tests against real contract code |
| Rule updates and current-policy behavior | Foundry configuration/race regression; UI draft and validation checks |
| Incoming payment, Reactive, distribution | Original live M1 and later signed frontend journey where recorded |
| Duplicate callback | Original actual live replay plus local regression |
| Underfunded callback/debt | Actual fee reads, explicit failure-state display and local/service-boundary checks; no claim of deliberately exhausting live reserves |
| History/receipts | Real public RPC and production API, archived receipt references and pagination |
| Desktop/mobile/accessibility | Real screenshot inspection and browser assertions at 1440/768/390/320 |

## Release conditions

No unresolved critical or high finding may be hidden by a passing test summary. A signed-user workflow failure, failed production read or missing playable video blocks submission readiness. Exact deadlines and portal-required metadata must be checked in the authenticated competition portal before the user submits. No submission will be made automatically.

## Known operational limits

Public RPC throttling/history windows, incomplete callback-list responses, independent-owner administration across two contracts, current-policy execution and funding requirements remain disclosed. Fee funding is not a delivery guarantee. Testnet availability is not production uptime. Upstream license clarification and independent review remain requirements before commercial/mainnet use.

## Preserved original release disposition

Technical evidence gates pass for the testnet prototype. Release publication and anonymous download checksum passed; source/media milestone b7b25e3 is pushed. Closing main CI and delivery are recorded in BUILD_STATUS.md and the final report. Overall submission remains **CONDITIONAL PASS** until the user checks the authenticated DoraHacks cutoff/required portal fields and reviews the prepared package. No automated DoraHacks submission is performed. Internal review is not an independent professional audit.

## Payment Passport release gate — 2026-11-26

The baseline remains reproducible and its published film is preserved. The enhancement source checkpoint is `237e53530b882e1995e3ca9c6daa35c67cc9a00c`; [feature CI 45882361535](https://github.com/sopskistar/IncomeFlow/actions/runs/45882361535) passed both jobs. Existing Solidity/deployments are unchanged.

| Gate | Actual evidence |
| --- | --- |
| Signed user acceptance | PASS: request created before the two 40/60 transfers, exact signed associations, real callbacks and payouts, returning-owner refresh; passport-proof.json. |
| Exact accounting | PASS: 100 ifUSD received, 0 outstanding, allocations 20/12/8 + 30/18/12. Same disposable owner/payer, not a real commercial client. |
| Local and feature CI | PASS: 28 contract, 25 unit and 20 browser tests; lint/types/production build. No new transaction is sent by the regression suite. |
| Internal security | No unresolved critical/high finding identified in scoped review. PP findings resolved and limitations accepted in SECURITY_AUDIT.md. Solar parser failure remains, not passed. |
| Visual critique | Local desktop/tablet/phone captures inspected; A/B findings fixed. Final public narrow-confirmation and production captures pending. Hallmark static clearance is not a renderer pass. |
| Staged hosting | READY with skip-domain; authenticated API verifies signatures, current deployed code and all existing receipts. Protected immutable URL is not public verification. |
| Enhanced public release | Pending promotion and explicit independent public browser suite. Prior public QA refers to the original release. |
| Revised film | PASS locally: 150s 1080p30 H.264/AAC, full decode without logged errors, timestamp/activity/black scans, all narration aligned, 12 decoded frames inspected; separate publication pending. |
| Submission | Draft and proof links prepared. User must review the authenticated cutoff/portal fields and manually submit; no automatic submission. |

No additional blockchain transaction, faucet request or contract deployment occurred during this capture/video resumption. The previous local host's ERR_NETWORK_CHANGED failures remain disclosed in PRODUCTION_QA.md, separately from independent GitHub Actions passes. Technical readiness is only confirmed after the pending gates above have actual evidence. Internal review is not an independent professional audit.
