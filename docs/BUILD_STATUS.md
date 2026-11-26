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
| M6 | Implemented and verified | Final 150.0s 1080p30 H.264/AAC film decoded/inspected, published with captions and verified by anonymous download checksum. Portable source and submission package complete. |

## Signed acceptance recovery

No original M1 deployment or faucet was repeated. Initial provider permissions/tsx helper/Foundry argument-order errors were in the test harness. The genuine signed run exposed one application defect: stale render chain state during multi-step setup. Each write now confirms its target network. Confirmed deployments and payment hashes were reused across resumptions. Receipt selectors were scoped; historical inspection uses the saved payment block window. Seven necessary testnet transactions created one independent pair, configured/subscribed it, paid 100 ifUSD, paused and resumed. Details: ONCHAIN_PROOF.md.

## Audit and test evidence

`deployments/release-checks.json` and `artifacts/qa/` record actual sequential checks. All required commands exit 0. Solar lint exits 1 on inherited OpenZeppelin constructor parsing; documented separately, never called a passing scan. Final frozen local Playwright: 14 passed in 30.1 seconds. Signed acceptance: passed, including current on-chain total 100 ifUSD/count 1, exact transfers and paused false. No unresolved critical/high issue identified by the scoped internal review; not an external audit.

## Resources and deployment

Stopped only the stale IncomeFlow Remotion Studio. Unrelated host processes were preserved. Heavy local operations run sequentially, browser workers 1, Next build CPUs 1. Public app: https://incomeflow-gamma.vercel.app. Vercel initial deployment `dpl_7dWuHW1D4u5VB6LGWsWA2YCmyov9`; superseded by the verified deployment below. No database or paid service.

## Delivery and remaining user actions

Verified source/media milestone: `b7b25e3129d0fac333d9004ee3fd11a785d6132d`, pushed to `main`. [Public testnet demo release](https://github.com/sopskistar/IncomeFlow/releases/tag/incomeflow-testnet-demo); [direct MP4](https://github.com/sopskistar/IncomeFlow/releases/download/incomeflow-testnet-demo/incomeflow-demo.mp4). Anonymous download matched SHA-256 `5a35aaadd5614c96f0a4da6f7c82ac645fe0abc5669cae92f313c9a7fbe1e530`, 5,281,055 bytes. Release assets include captions and verification JSON. Source, narration and edited genuine footage are committed; large originals/rendered output remain outside Git history.

The closing documentation commit records these verified links. Latest main CI is visible at [IncomeFlow checks](https://github.com/sopskistar/IncomeFlow/actions/workflows/ci.yml); its actual closing result is checked before delivery. Application/contract files are unchanged from the passing QA checkpoint. No manual repeat of passed core tests, blockchain transaction or faucet request was used in this video resumption.

Overall submission disposition: **CONDITIONAL PASS**. Technical deliverables pass; the exact authenticated DoraHacks cutoff and portal-specific fields remain user-only checks. Review the package and manually submit. No DoraHacks submission was performed automatically.

Original recordings and superseded segments are preserved locally. The initial full-browser render failed; the successful native pipeline reused all motion scenes and repaired only setup/payment trims after visual inspection. Final media report: `deployments/video.json`; reproduction: VIDEO_TIMELINE.md.

## Independent production verification

Public app: https://incomeflow-gamma.vercel.app. Final deployment `dpl_48RFxdBJ3Aeu5p1wXJXhEksmRxyc`. [CI 45754101739](https://github.com/sopskistar/IncomeFlow/actions/runs/45754101739) and [visual evidence CI 45756034510](https://github.com/sopskistar/IncomeFlow/actions/runs/45756034510) passed contracts, application, 14 local-build and 14 public-Vercel tests. The latter captured ten actual public screenshots with `browser-errors.json = []`; all were inspected. Public repository visibility confirmed. Local public-browser network failures are retained in PRODUCTION_QA.md and are not described as passes.

## Payment Passport extension — in progress

Baseline preserved: main `1fdbad7cc96ec426b435fb2126e0d881daa72984`, public release `incomeflow-testnet-demo`, original production deployment unchanged. Work isolated on `feat/payment-passport`.

Implemented but not release-verified: EIP-712 request/association schema, current-owner and compiled-vault checks, integer partial-payment accounting, client/owner pages, owner-scoped archive import/export, explicit callback proof. First 25 unit tests pass; browser acceptance/build/audit/new film remain pending. No new contract deployment or blockchain transaction has occurred for this extension. Prior phase results above describe the preserved release, not this feature branch.

Payment Passport live acceptance: **implemented and verified** on 2026-11-26T16:41:50.566Z. Existing user vault reused. New 40/60 ifUSD transfers, exact owner-signed associations, actual allocations, returning-owner refresh and fresh receipt verification passed. See deployments/passport-proof.json and PASSPORT_QA.md. Full browser/visual/public release checks and revised film are still pending.

Reviewed extension checkpoint: production build/typecheck, lint and 25 unit tests pass; 20 browser tests pass in1.7 minutes after fixes. The two independent critiques scored listed UI defects resolved; Hallmark scoped static clearance is 0 FAIL/REFLEX/WARN with four documented dismissals. Fresh public/owner screenshots have zero capture errors. Genuine signed acceptance and exact receipts remain unchanged. Internal security review includes canonical Reactive runtime/binding, owner signatures and explicit attribution; no unresolved critical/high finding identified. Source checkpoint/CI, production promotion and revised film remain pending.
