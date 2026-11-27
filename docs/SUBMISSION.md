# IncomeFlow — Give Every Payment a Purpose

Track: **Set It and Forget It**, Reactive Omni Buildathon. Public repository: https://github.com/sopskistar/IncomeFlow. Application: https://incomeflow-gamma.vercel.app. Do not submit automatically.

## Description

Imagine a freelance designer delivering a website. The work is finished. The financial admin isn't: request payment, identify transfers, track outstanding amounts, organize income and retain the record. This is an illustrative scenario, not a customer testimonial.

Broader small-business and receivables research supports that administrative problem. [QuickBooks' 2026 report](https://quickbooks.intuit.com/r/small-business-data/small-business-late-payments-report-2026/) reports 59% with invoices overdue at least 30 days and 39% experiencing payroll/bill difficulty after a late payment. These findings are not statistics about crypto freelancers or proof of IncomeFlow's effectiveness. [Research methodology and Chaser caveats](PROBLEM_RESEARCH.md).

IncomeFlow addresses a narrow supported-crypto workflow. **Payment Passport** creates an owner-signed request, connects explicitly associated verified transfers to its outstanding balance, and retains allocation evidence. An ERC-20 transfer contains no invoice ID; the owner signs the exact transaction/log association. Client identity remains unverified.

When supported ifUSD reaches the user's existing smart vault, Reactive Omni observes the token's narrowly filtered Transfer event and requests an authenticated callback. The vault checks the official provider and its specific Reactive sender, prevents duplicate payouts and distributes according to owner-controlled rules. No online freelancer or backend payout bot initiates each allocation. Request metadata and associations are application features; Reactive performs the financial action.

A newly signed 100 ifUSD request preceded genuine 40 and 60 token payments. Their allocations were 20/12/8 and 30/18/12, totaling 50/30/20. Both associations and callback receipts were verified; outstanding is zero. These are valueless testnet engineering payments using one disposable owner/payer account, not real client income. The original M1 and earlier 100-token signed-user demonstration remain separate evidence.

## Judge verification

1. Open [the full Payment Passport](https://incomeflow-gamma.vercel.app/passport-demo?view=owner) or [client receipt](https://incomeflow-gamma.vercel.app/passport-demo).
2. Confirm the request, exact associated amounts and zero outstanding. Follow each origin, Reactive and callback link; inspect actual payouts and policy version 1.
3. Read [ONCHAIN_PROOF.md](ONCHAIN_PROOF.md) and [the signed manifest](../deployments/passport-proof.json) for exact hashes/logs/signatures.
4. Open the original [/proof](https://incomeflow-gamma.vercel.app/proof) for the separate M1 loop, successful replay no-op and exact Sourcify source matches.
5. Reproduce from README, deployment guide and tests. Inspection needs no new payment; creating an independent vault or paying requires only testnet funds.

## Evidence links

| Payment | Origin | Reactive | Destination |
| --- | --- | --- | --- |
|40 ifUSD|[log10](https://sepolia.basescan.org/tx/0xdc6f6488ac482b330b5e26eaec5e4aebd8f2acd9b7137164fa99dc07104fe964)|[execution](https://lasna.reactscan.net/tx/0x7dc8bb4d7775d2a7d22989de6b35338bf696a873ce22b411dd6deb002e3e4b10)|[20/12/8](https://sepolia.basescan.org/tx/0xdff7ee7715f54a4a119001cbee4965b6cde358317d1d14ec2ac497a4812590b9)|
|60 ifUSD|[log29](https://sepolia.basescan.org/tx/0xc038b2871e76c59fa9e1c12721f3734b24b1d9231340e86804f71be5aea9e8da)|[execution](https://lasna.reactscan.net/tx/0x0807477dab0eac199dfa65eba7416097c593b718dc8cab89d985f80de590077a)|[30/18/12](https://sepolia.basescan.org/tx/0xb1f4ee25f1c47cb6d3f3f1330160b06f57392b7f0639fb5e220ab9bd5684dc91)|

Existing user vault: `0xd70db6249b22cb72a463cc26849e85fa699d37c1` on Base Sepolia 84532. Reactive: `0x30fc195918738aBf90BA5B626Dfa98F99d5Ca200` on Lasna 5318007. Token: `0x2d1045a2025d197Ee83723452B505bec38427CE9`, 6 decimals. Original deployment addresses and verification references remain in deployments/testnet.json and ONCHAIN_PROOF.md.

## Judging criteria

- **Execution:** genuine ordinary token payments, actual Reactive executions, authenticated destination receipts and conserved payouts; no simulation substituted for proof.
- **Integration:** a normal ERC-20 transfer does not execute receiving-vault logic. The Reactive event-to-callback action is essential to unattended allocation.
- **Usefulness:** a coherent freelancer request-to-organized-income record, beyond manually invoking a splitter.
- **Craft:** reproducible source, explicit trust boundaries, owner controls, internal review, tests/CI, responsive interface and genuine recorded footage.

## Limitations

Testnet prototype for one conventional valueless token on Base Sepolia, with funded Lasna/callback services. No collection enforcement, cash-flow guarantee, tax calculation, comprehensive accounting, disputes or verified client identity. Rules apply at callback execution. Browser records require backups; shared links do not automatically receive later associations. No global exclusive invoice-attribution registry exists. EOA signatures only. RPC history/availability and upstream Omni licensing remain documented limits. Internal engineering review is not an independent professional audit.

## Media and submission checklist

Recommended demo: [Payment Passport — 150 seconds](https://github.com/sopskistar/IncomeFlow/releases/download/incomeflow-payment-passport/incomeflow-passport-demo.mp4), 1920×1080p30 H.264/AAC, full decode/audio/timestamp/visual review and anonymous download checksum passed. [Captions and report](https://github.com/sopskistar/IncomeFlow/releases/tag/incomeflow-payment-passport). The [original film remains preserved](https://github.com/sopskistar/IncomeFlow/releases/tag/incomeflow-testnet-demo).
- [x] Public original MIT repository and preserved history.
- [x] Real original and Passport event → Reactive → callback → payout proof.
- [x] Signed request, explicit associations, partial records and recovery workflow.
- [x] Local tests, security review and responsive critique; exact final CI/public outcomes in BUILD_STATUS.md.
- [x] Enhanced production version independently verified after promotion: 20 public browser tests, actual API reads and inspected screenshots.
- [x] Revised MP4 rendered, decoded, inspected, published and anonymously checksum-verified.
- [ ] Exact official DoraHacks closing clock/timezone and portal-specific fields checked. The public event page remains inaccessible to available tools; competitor README times are not official authority.
- [ ] User reviews and manually submits through DoraHacks. No automatic submission performed.
