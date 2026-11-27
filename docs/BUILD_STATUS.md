# Build status

Updated 2026-11-27. Current enhancement branch: `feat/payment-passport`. Preserved baseline: `1fdbad7cc96ec426b435fb2126e0d881daa72984`, original production deployment `dpl_48RFxdBJ3Aeu5p1wXJXhEksmRxyc` and published `incomeflow-testnet-demo` film. No contracts were replaced.

## Current release gates

| Phase | Status | Evidence / remaining work |
| --- | --- | --- |
| M0 / problem research | Implemented and verified, portal detail outstanding | Qualified QuickBooks/Chaser evidence, competitor primary-source review, story and architecture documented. Exact authenticated DoraHacks closing clock remains unverified. |
| M1 / Reactive integration | Implemented and verified | Original genuine 100 → 50/30/20, actual duplicate no-op, exact Sourcify matches; ONCHAIN_PROOF.md. |
| M2 / security | Implemented and verified within internal scope | 28 Foundry tests, 512-case fuzz, 4,096-call invariant. No unresolved critical/high finding identified. Solar parser limitation remains; not an independent audit. |
| M3 / application + Passport | Implemented and verified locally and on-chain | Original signed-user setup/payment/pause/resume preserved. New owner-signed request, two exact owner-signed associations, 40/60 payments, real callbacks, returning-owner refresh; 100 received, zero outstanding. |
| M4 / visual craft | Implemented and verified locally; final public capture pending | Desktop/tablet/390/320 light/dark captures inspected. Independent A/B findings fixed. Hallmark static 0 FAIL/REFLEX/WARN, four documented dismissals; renderer unavailable. |
| M5 / release | Feature CI passed; public promotion pending | Source `237e535`: production build/types/lint, 25 unit, 28 contract and 20 browser tests. Staged READY deployment verifies the signed record through authenticated API; production alias still preserved. |
| M6 / revised video | Implemented and verified locally; publication pending | Separate 150s 1080p30 H.264/AAC output, full decode and all seven narration alignment checks passed. Twelve decoded frames inspected; all scene activity/timestamp/black checks pass. Original film preserved unchanged. |

## Payment Passport evidence

`deployments/passport-proof.json` records live acceptance completed at 2026-11-26T16:41:50.566Z. Existing vault and Reactive contract reused. Exactly two new test transfers were needed in that earlier acceptance: 40 and 60 valueless ifUSD, allocated 20/12/8 and 30/18/12. Request signing preceded them; explicit signed associations authenticate exact transaction/log references. Owner and payer are one disposable test account, not commercial clients. No blockchain transaction, funding exchange or contract deployment occurred during this screenshot/video resumption.

Original M1, the earlier 100-token signed-user run and the two Passport payments are separate demonstrations. Read-only verification reuses their actual receipts; no old transfer is invented as a new job payment.

## Tests and audit

Final local browser regression: 20 passed in approximately 1.7 minutes; previous preserved run: 18 in approximately 1.8 minutes. Unit tests: 25 passed. Contracts: 28 passed including fuzz/invariant. Production build, TypeScript and lint passed. Web production dependency audit: zero vulnerabilities. Durable results: `deployments/passport-checks.json` and PASSPORT_QA.md.

Feature CI [45882361535](https://github.com/sopskistar/IncomeFlow/actions/runs/45882361535) passed application and contract jobs at `237e53530b882e1995e3ca9c6daa35c67cc9a00c`. Subsequent changes are offline video tools/assets and documentation; web/contract behavior is unchanged. Closing main CI and explicit post-deployment public QA are recorded after completion.

Internal review includes complete signed payload/domain separation, current owner and canonical vault/Reactive runtime binding, exact transfer/callback/payout validation, integer accounting, owner-scoped import recovery and truthful unknown states. Signed issue time is an owner assertion, not an independent timestamp authority. Solar did not pass because of inherited OpenZeppelin constructor parser incompatibility. See SECURITY_AUDIT.md and PRE_SUBMISSION_AUDIT.md.

## Visual recovery

The interrupted screenshot command actually completed after its tool response stopped. Its eight screenshots, genuine recording and zero-error manifest were preserved. Real inspection and independent critiques identified layout, signing-intent, edit-default and settled-payment issues; fixes and regression coverage followed. Fresh local public/owner captures report zero browser errors. A final narrow association-confirmation capture against the promoted source remains required. No screenshot helper can sign or submit a transaction.

## Deployment and fallback

Public baseline: https://incomeflow-gamma.vercel.app. Enhancement artifact `dpl_2NJf3SQUrKuZs1gUFBDLAEnF1fwF` is READY, staged with `--prod --skip-domain`; its immutable URL is protected by Vercel Authentication and is not claimed publicly accessible. Authenticated API inspection verified 100000000 received / 0 outstanding with no failures. Deployment metadata: `deployments/passport-release.json`. No database or new application environment variable is needed.

The old deployment, original MP4, raw recordings and Git history remain fallback assets. Resource-heavy operations run sequentially; unrelated host processes are preserved. Final video and raw recordings stay out of Git history; edited genuine clips, narration, render source and verification metadata are versioned.

## Remaining gates

Publish the verified revised film, promote the tested enhancement, run independent public QA, inspect production captures and record clean pushed main/CI. No automatic DoraHacks submission. Overall readiness remains pending these gates and the user's authenticated cutoff/portal-field check.
