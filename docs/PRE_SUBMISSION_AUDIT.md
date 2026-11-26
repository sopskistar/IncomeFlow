# Pre-submission audit

This is a factual release gate, not an independent security certification. Original M1 remains verified and unchanged. Later frontend acceptance, hosting and video results are recorded separately below and in BUILD_STATUS.md.

## Evidence requirements

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

## Readiness disposition

Technical evidence gates pass for the testnet prototype. Release artifact publication and the final source push/CI are recorded separately in BUILD_STATUS.md. Overall submission remains **CONDITIONAL PASS** until the user checks the authenticated DoraHacks cutoff/required portal fields and reviews the prepared package. No automated DoraHacks submission is performed. Internal review is not an independent professional audit.
