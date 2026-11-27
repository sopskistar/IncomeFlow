# Payment Passport QA ledger

Extension baseline: `1fdbad7`, branch `feat/payment-passport`. Earlier release evidence remains valid for unchanged contracts; new application claims require new checks.

## Historical check sequence

- 2026-11-26: 25 Vitest tests passed (7 existing, 9 request/signature/storage/accounting, 9 chain-proof checks). Test fixtures are explicitly synthetic and never live payment evidence.
- 2026-11-26: 28 Foundry tests passed, including existing fuzz/invariant regression; no Solidity change or deployment.
- 2026-11-26: ESLint clean after replacing synchronous effect updates with guarded external-state callbacks. TypeScript succeeded before final harness/UX adjustments; final build is the release gate.
- 2026-11-26: two new browser checks passed on the isolated production build (empty/malformed/oversized requests, navigation and viewport overflow). Initial failures were an overly broad `role=alert` selector colliding with Next's hidden route announcer; scoped assertions fixed it without weakening expected application behavior.
- 2026-11-26: production dependency audit reports zero vulnerabilities.

## Live test recovery

No signing or payment occurred in the first two attempts. One hit the known tsx `__name` browser-realm helper issue; the next stopped during read-only RPC preflight on a network timeout. Node's proxy-aware test returned the correct chain IDs for both official RPCs. The guarded harness persists a signed request and every broadcast hash before continuing; it permits exactly two transfers, 40 and 60 ifUSD, to the existing owned vault. No faucet or deployment path is present.

Final acceptance, screenshot critiques, public deployment checks and revised video remain pending until the corresponding evidence is recorded below. This ledger does not convert prior results into passes for the extension.

## Live acceptance completed

Passed 2026-11-26T16:41:50.566Z. A new owner-signed request preceded two real supported-token transfers. Both exact associations, their Reactive/callback/payout evidence, browser refresh and returning-owner inspection passed. Final verified totals: 100 ifUSD received, zero outstanding; two allocations under policy version 1. Exactly two new transactions, no deployment/faucet/policy changes. The owner and payer are one disposable test account, not separate real customers.

The returning-owner harness now waits for restored wallet state and completed evidence verification, instead of clicking a stale Connect button or asserting totals during loading. Read-only resumption uses saved exact receipts rather than requiring payments to remain inside the recent dashboard history window. Earlier attempts and raw recordings remain preserved.

## Capture recovery and independent critique

The original capture completed after the interrupted tool response: capture.json records all eight viewport/theme screenshots, zero browser errors and a finished genuine read-only recording. No successful footage was discarded. Actual images exposed a disconnected desktop owner record squeezed into the missing sidebar track, a clipped tablet wallet control, and financial totals below metadata.

Independent Impeccable A/B review also found missing title/amount on signing review, dropped payer/date defaults after editing, and payment solicitation on a settled record. These release findings were fixed together, with payer/date/signing-review and archive recovery browser regressions. Selection semantics, textarea focus, unavailable import styling and established spacing tokens were corrected. The unchanged brand/design files remain authoritative. Final recapture and reviewer verdict follow below.

Final scoped critique: Assessment A scored its listed findings resolved and returned `ship`; Assessment B cleared its listed findings and static lint with 0 FAIL / 0 REFLEX / 0 WARN (four documented nowrap dismissals), while reserving the unshown narrow association-confirmation state. That button is shortened to “Sign association” using its existing explanatory context. A final production capture verifies the candidate state without signing. This label change does not alter financial behavior; the final CI build/browser suite covers the released source.

## Final release verification — 2026-11-27

Main CI 45946880326 passed at bb032dd: 28 Foundry, 25 units, production build/types/lint and 20 local-build browser tests. Public workflow 45948544775 passed 20/20 in 27.3s against the promoted alias, then captured 19 screenshots; all inspected, error manifests empty. Eight additional owner captures passed with no page/request failures. The final reviewer cleared the previously reserved 320px association controls. Durable images: .impeccable/passport-production/ and .impeccable/passport-production-owner/.

One earlier local owner capture failed with a fetch transport error after four successful returning-owner images. Exact network cause was not recorded. Preserved log/screens are under artifacts/qa/passport-production-owner-initial/. Diagnostic capture retry passed the same assertions; no timeout increase, skipped assertion, signing method or new transaction was introduced. The independent public suite is a separate pass, not a reinterpretation of that failure.

Fresh production API verification confirms both saved associations and payouts, exactly 100 ifUSD paid and 0 outstanding. Current vault owner/binding/funding reads remain correct. No additional live payment, deployment or faucet request occurred. Revised film passed decode, valid timestamps, all-scene activity, black scan, audio alignment and actual frame inspection, then its published anonymous download matched. See deployments/passport-release.json, passport-checks.json and video-passport.json.
