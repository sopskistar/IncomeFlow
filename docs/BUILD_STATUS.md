# Build status

Updated: 2026-11-25. Baseline: `12bcd18` on `main`. M1 checkpoint commit follows this record.

| Phase | Status | Evidence / next step |
| --- | --- | --- |
| M0: repository and research | Implemented and verified | Research and architecture recorded; portal cutoff still needs primary-source confirmation. |
| M1: real automation | Implemented and verified | Actual 100 ifUSD -> 50/30/20 callback, exact source matches and live replay no-op. See ONCHAIN_PROOF.md. |
| M2: security | Implemented and verified locally | 28 Foundry tests, 512-case fuzz tests and 4,096-call accounting invariant; internal review documented. Not externally audited. |
| M3: application | Not started | Must distinguish observed chain states from unavailable evidence. |
| M4: craft | Not started | Required installed design skills discovered and read; no design implementation yet. |
| M5: deployment and QA | Not started | Local GitHub CLI token reports invalid; Vercel authentication file exists but access is unverified. |
| M6: video / submission | Not started | Successful walkthrough and final video gated on actual M1 proof. |

## Verification ledger

- `eth_chainId`: Lasna `0x512577` (5318007); Base Sepolia `0x14a34` (84532).
- Three real deployed contracts, exact Sourcify matches, actual origin/Reactive/callback/payout receipts and live replay proof recorded in ONCHAIN_PROOF.md.
- Official organizer announcement confirms December 5 and video under three minutes. DoraHacks page fetch returned HTTP 405; exact cutoff is not yet independently verified from the primary page.
- No credentials have been printed or added to the repository.

## Work order

1. Pin official Omni library; establish Foundry; implement a narrowly subscribed per-vault automation and authenticated destination.
2. Test accounting, replay protection, ownership, recovery, malformed logs and failed transfers.
3. Deploy only with a disposable, funded testnet account; capture the complete evidence chain.
4. Build a chain-backed web interface, finish visual QA, CI, documentation and deployment.
5. Capture real moving footage and render the submission video only after verified automation exists.
