# Public deployment QA ledger

Public alias: https://incomeflow-gamma.vercel.app. Final frontend deployment: `dpl_48RFxdBJ3Aeu5p1wXJXhEksmRxyc`, immutable URL https://incomeflow-cpt6v6l13-sopskistars-projects.vercel.app.

Unauthenticated homepage and genuine vault API returned HTTP 200. The original vault returned paymentCount 1, totalDistributed 100 ifUSD, actual origin/Reactive/destination references, three 50/30/20 transfers, active subscription and zero service debt. No Vercel signing credentials are configured; public testnet RPC defaults are used. No database is needed.

The first public browser run passed 10 and failed 3: one cold-load calculator hydration issue and two browser-level ERR_NETWORK_CHANGED navigation failures. The calculator was fixed by disabling edits until handlers hydrate, with a deterministic delayed-JavaScript regression. Original failure traces are preserved locally under `artifacts/qa/production-initial/`.

The frozen local production build passed all 14 browser tests. A later public run again encountered host network changes; its complete output is retained as an environment failure, not reported as a passing run. Independent public-URL browser verification is added to GitHub Actions so all assertions run outside the affected host. Its actual outcome is recorded below when inspected.

The actual signed local-production journey independently proved wallet connection, resumable network changes, vault creation, policy, payment/callback, pause/resume and returning owner. It uses an explicit encrypted Node test signer, not a vendor wallet extension; no claim of a separately tested Rabby popup is made.
