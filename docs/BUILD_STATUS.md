# Build status

Updated 2026-11-26. Preserved verified M1 commit `af46408` on `main`; frontend checkpoint commit follows this record.

| Phase | Status | Evidence / remaining work |
| --- | --- | --- |
| M0 | Implemented and verified, portal detail outstanding | Official rules and research recorded. Exact DoraHacks cutoff remains inaccessible (HTTP 405), requires portal check. |
| M1 | Implemented and verified | Genuine 100 -> 50/30/20, exact source matches and actual replay no-op. Original deployment unchanged. |
| M2 | Implemented and verified locally | 28 Foundry tests, 512-case fuzz and 4,096-call invariant; focused internal audit. Not independently audited. |
| M3 | Implemented and verified | Separate signed UI vault setup, subscription, policy, real payment/callback, pause/resume and returning-owner receipt. `deployments/browser-proof.json`. |
| M4 | Implemented and verified | Original identity; actual desktop/tablet/390/320 light/dark inspection. Independent nav finding resolved. Hallmark static 0 FAIL/REFLEX/WARN, 2 documented dismissals; renderer unavailable. |
| M5 | Partially implemented | Production build, lint 0 warnings, TypeScript, 7 units, 13 browser tests passed. Dependency audit 0 vulnerabilities. Initial Vercel homepage/API HTTP 200. Post-fix production redeploy/browser review and remote CI still pending. |
| M6 | Partially implemented | Storyboard, script, narration, real raw moving footage and composition exist. Style frame inspected. Final playable MP4 and submission package pending. |

## Signed acceptance recovery

No original M1 deployment or faucet was repeated. Initial provider permissions/tsx helper/Foundry argument-order errors were in the test harness. The genuine signed run exposed one application defect: stale render chain state during multi-step setup. Each write now confirms its target network. Confirmed deployments and payment hashes were reused across resumptions. Receipt selectors were scoped; historical inspection uses the saved payment block window. Seven necessary testnet transactions created one independent pair, configured/subscribed it, paid 100 ifUSD, paused and resumed. Details: ONCHAIN_PROOF.md.

## Audit and test evidence

`deployments/release-checks.json` and `artifacts/qa/` record actual sequential checks. All required commands exit 0. Solar lint exits 1 on inherited OpenZeppelin constructor parsing; documented separately, never called a passing scan. Final local Playwright: 13 passed in 47.9 seconds. Signed acceptance: passed, including current on-chain total 100 ifUSD/count 1, exact transfers and paused false. No unresolved critical/high issue identified by the scoped internal review; not an external audit.

## Resources and deployment

Stopped only the stale IncomeFlow Remotion Studio. Unrelated host processes were preserved. Heavy local operations run sequentially, browser workers 1, Next build CPUs 1. Initial public app: https://incomeflow-gamma.vercel.app. Vercel initial deployment `dpl_7dWuHW1D4u5VB6LGWsWA2YCmyov9`; final post-fix deployment pending. No database or paid service.

## Remaining gates

1. Redeploy network-switch fix; verify unauthenticated production browser, API, wallet fixture and mobile views.
2. Push checkpoint and inspect actual GitHub Actions runs.
3. Complete real footage edits, render/inspect/decode final narrated 1080p MP4 under 3 minutes.
4. Complete submission evidence/checklist and final checkpoint. User performs final portal review and manual submission.
