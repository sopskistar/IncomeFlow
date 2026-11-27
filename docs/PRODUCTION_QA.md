# Public deployment QA ledger

Public alias: https://incomeflow-gamma.vercel.app. Preserved original frontend deployment: `dpl_48RFxdBJ3Aeu5p1wXJXhEksmRxyc`, immutable URL https://incomeflow-cpt6v6l13-sopskistars-projects.vercel.app.

Unauthenticated homepage and genuine vault API returned HTTP 200. The original vault returned paymentCount 1, totalDistributed 100 ifUSD, actual origin/Reactive/destination references, three 50/30/20 transfers, active subscription and zero service debt. No Vercel signing credentials are configured; public testnet RPC defaults are used. No database is needed.

The first public browser run passed 10 and failed 3: one cold-load calculator hydration issue and two browser-level ERR_NETWORK_CHANGED navigation failures. The calculator was fixed by disabling edits until handlers hydrate, with a deterministic delayed-JavaScript regression. Original failure traces are preserved locally under `artifacts/qa/production-initial/`.

The frozen local production build passed all 14 browser tests. A later public run again encountered host network changes; its complete output is retained as an environment failure, not reported as a passing run. Independent public-URL browser verification is added to GitHub Actions so all assertions run outside the affected host. Its actual outcome is recorded below when inspected.

The actual signed local-production journey independently proved wallet connection, resumable network changes, vault creation, policy, payment/callback, pause/resume and returning owner. It uses an explicit encrypted Node test signer, not a vendor wallet extension; no claim of a separately tested Rabby popup is made.

## Independent result: PASS

[GitHub Actions run 45754101739](https://github.com/sopskistar/IncomeFlow/actions/runs/45754101739), commit `747be04`, passed contracts and application jobs. Both local-build and public-Vercel browser suites passed **14/14**. The public suite completed in 12.8 seconds without retries or skipped assertions. Raw CI logs are retained in `artifacts/qa/github-final.log`. This independently verified homepage, calculator hydration, workspace, actual receipt/API, rule drafts, wallet switching/rejection/disconnect, 1440/768/390/320 navigation and explicit failure states. Production fixture tests never broadcast transactions; signed live acceptance remains separately evidenced.

## Production screenshot inspection: PASS

[Run 45756034510](https://github.com/sopskistar/IncomeFlow/actions/runs/45756034510) also passed both 14-test suites and the real public screenshot capture. Ten production PNGs were downloaded and visually inspected: landing desktop/phone, workspace 1440/768/390/320, narrow rules, dark phone, expanded receipt and fee health. All five phone tabs remain visible; no horizontal clipping, overlapping controls or broken logo was observed in these captures. Actual receipt links and funded/zero-debt states were legible. `browser-errors.json` contains `[]` for page exceptions and browser console errors. These are point-in-time checks, not continuous monitoring or accessibility certification.

Durable copies and source metadata: `.impeccable/production/`. They are captured from the public deployment, not a disconnected prototype.

## Payment Passport production release — 2026-11-27

New deployment `dpl_2NJf3SQUrKuZs1gUFBDLAEnF1fwF` was staged with skip-domain, verified through authenticated API, then promoted after source/main CI and film checks passed. Its app source is 237e535; bb032dd adds offline video/docs only. No new application environment secret, database, contract deployment or paid service was introduced.

Public homepage, /passport and signed-record API return HTTP 200. Fresh verification checks current ownership, canonical runtime, exact two token logs, owner associations, both Reactive receipts and actual callback payouts: 100 ifUSD associated, zero outstanding, no failures. The existing original vault/receipt and workspace remain accessible.

[Public CI 45948544775](https://github.com/sopskistar/IncomeFlow/actions/runs/45948544775) passed 20 tests in 27.3s and captured 19 public screenshots; page/console error manifests are empty. All screenshots were inspected at desktop/tablet/390/320, including partial/settled records, light/dark owner receipts, original vault health/rules and navigation. Eight separate read-only owner captures verify restored records, request review and narrow candidate association. The final reviewer cleared its narrow controls. Durable captures and run metadata are in .impeccable/passport-production/ and .impeccable/passport-production-owner/.

A local owner capture first passed restored-owner views, then showed Failed to fetch on the next signed-link verification. That run is preserved as failed; exact transport cause is unknown. Same assertions passed on the diagnostic retry, with no request/page failures. It is distinct from both the older ERR_NETWORK_CHANGED errors above and the successful independent public CI. No signing or blockchain transaction was performed for capture.
