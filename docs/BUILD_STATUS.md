# Build status

Updated 2026-11-26. Preserved verified M1 commit `af46408` on `main`; application source checkpoint `747be04`; production QA checkpoint `546e51a`. Final media/docs commit follows this record.

| Phase | Status | Evidence / remaining work |
| --- | --- | --- |
| M0 | Implemented and verified, portal detail outstanding | Official rules and research recorded. Exact DoraHacks cutoff remains inaccessible (HTTP 405), requires portal check. |
| M1 | Implemented and verified | Genuine 100 -> 50/30/20, exact source matches and actual replay no-op. Original deployment unchanged. |
| M2 | Implemented and verified locally | 28 Foundry tests, 512-case fuzz and 4,096-call invariant; focused internal audit. Not independently audited. |
| M3 | Implemented and verified | Separate signed UI vault setup, subscription, policy, real payment/callback, pause/resume and returning-owner receipt. `deployments/browser-proof.json`. |
| M4 | Implemented and verified | Original identity; actual desktop/tablet/390/320 light/dark inspection. Independent nav finding resolved. Hallmark static 0 FAIL/REFLEX/WARN, 2 documented dismissals; renderer unavailable. |
| M5 | Implemented and verified | Frozen production build; lint/types/7 units/28 Foundry tests; 14 local and 14 public browser tests; 0 dependency vulnerabilities. Vercel verified through independent CI and ten inspected public screenshots, zero browser errors. |
| M6 | Implemented and verified locally | Final 150.0s 1080p30 H.264/AAC film, full decode, narration correlation, zero black intervals and reviewed frames. Portable source and submission draft complete; release/push closing steps below. |

## Signed acceptance recovery

No original M1 deployment or faucet was repeated. Initial provider permissions/tsx helper/Foundry argument-order errors were in the test harness. The genuine signed run exposed one application defect: stale render chain state during multi-step setup. Each write now confirms its target network. Confirmed deployments and payment hashes were reused across resumptions. Receipt selectors were scoped; historical inspection uses the saved payment block window. Seven necessary testnet transactions created one independent pair, configured/subscribed it, paid 100 ifUSD, paused and resumed. Details: ONCHAIN_PROOF.md.

## Audit and test evidence

`deployments/release-checks.json` and `artifacts/qa/` record actual sequential checks. All required commands exit 0. Solar lint exits 1 on inherited OpenZeppelin constructor parsing; documented separately, never called a passing scan. Final frozen local Playwright: 14 passed in 30.1 seconds. Signed acceptance: passed, including current on-chain total 100 ifUSD/count 1, exact transfers and paused false. No unresolved critical/high issue identified by the scoped internal review; not an external audit.

## Resources and deployment

Stopped only the stale IncomeFlow Remotion Studio. Unrelated host processes were preserved. Heavy local operations run sequentially, browser workers 1, Next build CPUs 1. Public app: https://incomeflow-gamma.vercel.app. Vercel initial deployment `dpl_7dWuHW1D4u5VB6LGWsWA2YCmyov9`; superseded by the verified deployment below. No database or paid service.

## Closing delivery steps

1. Publish the verified MP4, captions and verification JSON as a release artifact.
2. Push the final source/media documentation and inspect the closing CI run.
3. User checks exact authenticated portal cutoff/fields, reviews the package and manually submits to DoraHacks. No automatic submission.

Final movie: `artifacts/video/incomeflow-demo.mp4`, 5,281,055 bytes, SHA-256 `5a35aaadd5614c96f0a4da6f7c82ac645fe0abc5669cae92f313c9a7fbe1e530`. No new testnet transaction or faucet request was made during this final video resumption. Original recordings and superseded segments remain local. The initial browser renderer failed; the successful sequential native pipeline reused completed scenes and then repaired only setup/payment trims after frame review. Final source details: VIDEO_TIMELINE.md.

## Independent production verification

Public app: https://incomeflow-gamma.vercel.app. Final deployment `dpl_48RFxdBJ3Aeu5p1wXJXhEksmRxyc`. [CI 45754101739](https://github.com/sopskistar/IncomeFlow/actions/runs/45754101739) and [visual evidence CI 45756034510](https://github.com/sopskistar/IncomeFlow/actions/runs/45756034510) passed contracts, application, 14 local-build and 14 public-Vercel tests. The latter captured ten actual public screenshots with `browser-errors.json = []`; all were inspected. Public repository visibility confirmed. Local public-browser network failures are retained in PRODUCTION_QA.md and are not described as passes.
