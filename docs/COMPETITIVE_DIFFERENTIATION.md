# Competitive differentiation

Research date: 2026-11-26. Sources are project authors' public READMEs, reached through GitHub repository search and fetched directly. The DoraHacks submissions page was inaccessible through the available web tool. Names can collide: repository identity and official submission membership are not interchangeable. No competitor test suite, live payment or source audit was executed here; a published hash is documented evidence, not our independent transaction verification.

| Named project / inspected source | Stated problem and workflow | Reactive role / public evidence | Request-to-payment attribution in inspected material |
| --- | --- | --- | --- |
| PAYDAY SPLITTER / [backburner036-prog](https://github.com/backburner036-prog/payday-splitter) | Split a payday into savings/bills/fun after explicit ETH `payday()` | Lasna to Unichain; source/tests/scripts available; README addresses remain TBD | No signed job-request reconciliation described |
| Payday Split / [alchemist199](https://github.com/alchemist199/payday-splitter) | Salary buckets with threshold-dependent savings boost | Base/Lasna; published origin/callback hashes and deployment record | No signed job-request reconciliation described |
| Payday Autopilot / [tzy585443-beep](https://github.com/tzy585443-beep/payday-autopilot) | Trusted income senders trigger savings; optional recurring bill schedule | Token Transfer subscription plus CRON; public code and documentation | No signed job-request reconciliation described |
| Payday / [sandi215](https://github.com/sandi215/payday-reactive) | Escrow-funded recurring ETH payments | Lasna CRON to Base payer; published hashes, demo file and frontend | Scheduled outgoing payments, no request attribution described |
| PayWatch / [w1nter625](https://github.com/w1nter625/paywatch) | Large-transfer watchdog with threshold and alert board | ERC-20 log to authenticated alert callback; linked demo and proof file | Transfer alerts, no request attribution described |
| BillPilot / [Ajengayukusu](https://github.com/Ajengayukusu/billpilot) | Fixed-payee bill autopay on a deposit, with skip records | Base/Lasna; linked public dashboard, videos and detailed loop hashes | Outgoing bill execution, no signed job-request reconciliation described |
| PaySplit | Search returned several unrelated repositories and a candidate Pixora-PaySplit whose README fetch returned 404 | Exact official entry not established | Unknown; no absence claim |
| PrizeJar | Exact Reactive entry not identified in accessible primary results | Unknown | Unknown |
| AutoSave | Search located generic autosave projects and a reactive-autosaver candidate, insufficient to identify this named entry | Unknown | Unknown |
| Till | Exact Reactive entry not identified in accessible primary results | Unknown | Unknown |

The comparison is limited to these inspected materials, not a claim that a competitor lacks an unpublished feature. Their deployment and marketing claims were not used as our own verified engineering results. Some READMEs state a 20:00 UTC cutoff; this is not accepted as an official closing-time source.

## Established alternatives

[Splits](https://splits.org/) offers revenue and payment infrastructure, multisig accounts and financial operations. [Superfluid](https://docs.superfluid.org/) documents continuous money streaming. General invoicing and receivables software already handles broader records and collection workflows. IncomeFlow does not invent splitting, vaults, invoices or receipts, and is not a substitute for those complete services.

## Narrow, implemented distinction

The target is the independent professional's discrete payment journey: a signed supported-token request → an explicit owner association to exact successful token logs → exact partial/outstanding totals → authenticated event-triggered allocation → an exportable verifiable record. A normal token transfer is sufficient for the financial automation; metadata does not pretend to exist in the ERC-20 log. Client identity remains unverified, and browser-local records require backups.

This difference is meaningful only while the code and live evidence support it. Release/verification status is recorded in BUILD_STATUS.md. We make no first-ever, market-leading, faster-payment or measured time-saving claim.
