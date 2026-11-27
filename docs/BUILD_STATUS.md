# Build status

Updated 2026-11-27. Enhancement integrated from `feat/payment-passport` into `main` by fast-forward; source/media checkpoint `bb032dd55cfd2fb31a41f551915c9b5ca74cb809`. Preserved baseline: `1fdbad7cc96ec426b435fb2126e0d881daa72984`, original production deployment `dpl_48RFxdBJ3Aeu5p1wXJXhEksmRxyc` and published `incomeflow-testnet-demo` film. No contracts were replaced.

## Current release gates

| Phase | Status | Evidence / remaining work |
| --- | --- | --- |
| M0 / problem research | Implemented and verified, portal detail outstanding | Qualified QuickBooks/Chaser evidence, competitor primary-source review, story and architecture documented. Exact authenticated DoraHacks closing clock remains unverified. |
| M1 / Reactive integration | Implemented and verified | Original genuine 100 → 50/30/20, actual duplicate no-op, exact Sourcify matches; ONCHAIN_PROOF.md. |
| M2 / security | Implemented and verified within internal scope | 28 Foundry tests, 512-case fuzz, 4,096-call invariant. No unresolved critical/high finding identified. Solar parser limitation remains; not an independent audit. |
| M3 / application + Passport | Implemented and verified locally and on-chain | Original signed-user setup/payment/pause/resume preserved. New owner-signed request, two exact owner-signed associations, 40/60 payments, real callbacks, returning-owner refresh; 100 received, zero outstanding. |
| M4 / visual craft | Implemented and verified locally and publicly | Desktop/tablet/390/320 light/dark captures inspected. Independent A/B findings fixed. Hallmark static 0 FAIL/REFLEX/WARN, four documented dismissals; renderer unavailable. |
| M5 / release | Implemented and verified | Source `237e535`: production build/types/lint, 25 unit, 28 contract and 20 browser tests. Promoted deployment verified through actual public HTTP/API reads, 20 independent public tests and inspected production captures. |
| M6 / revised video | Implemented and verified; published | Separate 150s 1080p30 H.264/AAC output, full decode and all seven narration alignment checks passed. Twelve decoded frames inspected; all scene activity/timestamp/black checks pass. Original film preserved unchanged. |

## Payment Passport evidence

`deployments/passport-proof.json` records live acceptance completed at 2026-11-26T16:41:50.566Z. Existing vault and Reactive contract reused. Exactly two new test transfers were needed in that earlier acceptance: 40 and 60 valueless ifUSD, allocated 20/12/8 and 30/18/12. Request signing preceded them; explicit signed associations authenticate exact transaction/log references. Owner and payer are one disposable test account, not commercial clients. No blockchain transaction, funding exchange or contract deployment occurred during this screenshot/video resumption.

Original M1, the earlier 100-token signed-user run and the two Passport payments are separate demonstrations. Read-only verification reuses their actual receipts; no old transfer is invented as a new job payment.

## Tests and audit

Final local browser regression: 20 passed in approximately 1.7 minutes; previous preserved run: 18 in approximately 1.8 minutes. Unit tests: 25 passed. Contracts: 28 passed including fuzz/invariant. Production build, TypeScript and lint passed. Web production dependency audit: zero vulnerabilities. Durable results: `deployments/passport-checks.json` and PASSPORT_QA.md.

Feature CI [45882361535](https://github.com/sopskistar/IncomeFlow/actions/runs/45882361535) passed application and contract jobs at `237e53530b882e1995e3ca9c6daa35c67cc9a00c`. Subsequent changes are offline video tools/assets and documentation; web/contract behavior is unchanged. Closing main CI and explicit post-deployment public QA are recorded after completion.

Internal review includes complete signed payload/domain separation, current owner and canonical vault/Reactive runtime binding, exact transfer/callback/payout validation, integer accounting, owner-scoped import recovery and truthful unknown states. Signed issue time is an owner assertion, not an independent timestamp authority. Solar did not pass because of inherited OpenZeppelin constructor parser incompatibility. See SECURITY_AUDIT.md and PRE_SUBMISSION_AUDIT.md.

## Visual recovery

The interrupted screenshot command actually completed after its tool response stopped. Its eight screenshots, genuine recording and zero-error manifest were preserved. Real inspection and independent critiques identified layout, signing-intent, edit-default and settled-payment issues; fixes and regression coverage followed. Fresh local public/owner captures report zero browser errors. The final narrow association-confirmation capture against the promoted source passed and the reserved reviewer concern was cleared. No screenshot helper can sign or submit a transaction.

## Deployment history and fallback

Public baseline: https://incomeflow-gamma.vercel.app. Enhancement artifact `dpl_2NJf3SQUrKuZs1gUFBDLAEnF1fwF` is READY, staged with `--prod --skip-domain`; its immutable URL is protected by Vercel Authentication and is not claimed publicly accessible. Authenticated API inspection verified 100000000 received / 0 outstanding with no failures. Deployment metadata: `deployments/passport-release.json`. No database or new application environment variable is needed.

The old deployment, original MP4, raw recordings and Git history remain fallback assets. Resource-heavy operations run sequentially; unrelated host processes are preserved. Final video and raw recordings stay out of Git history; edited genuine clips, narration, render source and verification metadata are versioned.

## Remaining gates

Technical deliverables are verified. No automatic DoraHacks submission. Overall readiness is **CONDITIONAL PASS**: technical gates pass; the authenticated DoraHacks cutoff/portal fields and manual submission remain user-only actions.

## Final public and media release — 2026-11-27

Main checkpoint `bb032dd` passed [CI 45946880326](https://github.com/sopskistar/IncomeFlow/actions/runs/45946880326): application and contracts, including 25 units, 28 Foundry and 20 local-build browser tests. [Independent public QA 45948544775](https://github.com/sopskistar/IncomeFlow/actions/runs/45948544775) passed all 20 tests in 27.3s. It captured 19 real public screenshots with empty browser-error manifests; all were inspected. Eight additional read-only encrypted-account owner captures cover creation/review, returning owner at 1440/768/390/320 and the candidate association panel. They passed with no page/request errors. The final reviewer cleared the narrow controls. These are point-in-time checks, not accessibility certification or continuous monitoring.

Deployment `dpl_2NJf3SQUrKuZs1gUFBDLAEnF1fwF` was promoted to https://incomeflow-gamma.vercel.app. Homepage/Passport/API returned HTTP 200; fresh verification confirms both allocations, 100 ifUSD associated and 0 outstanding. The existing user vault is active/subscribed, with 0.0029959873518 test ETH and 0.3926294 lREACT native funding and zero debt on both services at inspection. Its lifetime 200 ifUSD/3 payments includes the separate earlier 100-token run, not another job payment. Metadata: deployments/passport-release.json and passport-public-proof.json.

The initial local public-owner capture passed four returning-owner screens, then failed with “Failed to fetch” while verifying the original association-free link version. It was preserved, not called passed. The exact transport cause was not captured. A retry with request diagnostics and the same assertions passed; diagnostics were empty. Older ERR_NETWORK_CHANGED host failures remain separately documented in PRODUCTION_QA.md. The capture helper now closes the browser on failure and retains diagnostics; application source was unchanged.

Recommended [Payment Passport MP4](https://github.com/sopskistar/IncomeFlow/releases/download/incomeflow-payment-passport/incomeflow-passport-demo.mp4): 150.0s, 1080p30 H.264/AAC, 5,682,102 bytes. Full decode/timestamp/activity/black checks, seven audio comparisons and twelve decoded-frame inspections passed. The public anonymous download matched SHA-256 `a760d67f1390c97c036694d1eaf01f16ad2c40d8e6082ae002e29f36a7a19ede`. Captions and measured report are published separately. Original film hash remains unchanged. No blockchain transaction or faucet request occurred during this resumption.

Closing documentation/capture-diagnostics commit follows these tested source checkpoints; the closing main CI is checked before delivery. No automatic DoraHacks submission was performed.
