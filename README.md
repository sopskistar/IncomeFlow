# IncomeFlow

**Give every payment a purpose.** IncomeFlow organizes supported crypto income into owner-selected spending, savings and reserve wallets automatically. Configure percentages once; a regular ERC-20 payment to your vault triggers Reactive Omni and an authenticated allocation callback.

[Open IncomeFlow](https://incomeflow-gamma.vercel.app) · [Inspect on-chain proof](https://incomeflow-gamma.vercel.app/proof)

Built for freelancers and independent professionals in the Reactive Omni Buildathon’s **Set It and Forget It** track. This is a **testnet prototype**, using valueless **MockIncomeUSD (ifUSD)**. Tax reserve percentages are user choices, not tax advice or calculated liabilities.

## Verify the working automation

A genuine 100 ifUSD deposit produced **50 / 30 / 20 ifUSD** destination transfers. A second, real callback for the same event emitted `DuplicateIgnored` and transferred nothing. All three contracts have exact creation and runtime source matches on Sourcify. Full receipts, before/after balances and reproduction instructions: [on-chain proof](docs/ONCHAIN_PROOF.md).

| Component | Network | Address / evidence |
| --- | --- | --- |
| MockIncomeUSD | Base Sepolia · 84532 | [0x2d1045a2025d197Ee83723452B505bec38427CE9](https://sepolia.basescan.org/address/0x2d1045a2025d197Ee83723452B505bec38427CE9) |
| Demonstration vault | Base Sepolia · 84532 | [0x361890c8550548bB5c1A2C40e009470a259cf41E](https://sepolia.basescan.org/address/0x361890c8550548bB5c1A2C40e009470a259cf41E) |
| Reactive contract | Lasna · 5318007 | [0x07B1f3295A076e52403811B5128f4e479E4D0C3d](https://lasna.reactscan.net/address/0x07B1f3295A076e52403811B5128f4e479E4D0C3d) |
| Incoming payment | Base Sepolia | [Origin receipt](https://sepolia.basescan.org/tx/0x6ba488437a060f491d63346899298e7c5526703b7e03a393329e90ad0f5cf031) |
| Reactive execution | Lasna | [Execution receipt](https://lasna.reactscan.net/tx/0xfe0331a80d2d8e640964c486f0d3454616f6c5d004895c2a4d8ce22cdb1825bc) |
| Authenticated distribution | Base Sepolia | [Callback and payouts](https://sepolia.basescan.org/tx/0x65ce581bfe4ccb1524ce36a65129a6a00405d7500fa5fadb48942ef7cae8c030) |

The observed Base block timestamps differed by two seconds in this run. That is one observation, not a latency guarantee. See [deployment manifest](deployments/testnet.json) and [verification metadata](deployments/verification.json).

## Why Reactive is essential

An ERC-20 transfer emits its event from the **token**, and does not invoke a receiving vault. IncomeFlow subscribes narrowly to that token’s `Transfer` event and the exact indexed vault destination. Reactive Omni performs the event-to-callback work even while the recipient is offline. There is no backend payout wallet or cron job controlling custody.

```mermaid
sequenceDiagram
    participant P as Payer
    participant T as ifUSD / Base Sepolia
    participant R as IncomeFlowReactive / Lasna
    participant C as Official callback proxy
    participant V as User-owned vault
    participant D as Destination wallets
    P->>T: transfer(vault, amount)
    T-->>R: Transfer event, exact vault filter
    R->>C: requestCallbackV_1_0
    C->>V: Authenticated event identifier + amount
    V->>V: Replay check + current policy
    V->>D: Configured allocations
```

Each user creates an independent vault and Reactive contract. Only the vault owner can edit rules or recover funds. The vault authenticates both the official callback provider and its specific Reactive sender. A payment uses the rules active **when its callback executes**; receipts report that policy version. Integer basis points total 10,000; the final recipient receives the rounding remainder.

## Application

- Injected EVM wallet connection, disconnect and supported-network switching.
- Resumable independent vault/Reactive setup and subscription registration.
- Allocation editor with exact totals, address validation and saved browser drafts.
- Receiving address, explicitly labeled test-token faucet and genuine test payment.
- Chain-backed balances, paginated activity and downloadable receipts.
- Fee balances, subscription/debt diagnostics, pause/resume, callback retry and paused recovery.
- Public proof/help views; light/dark themes and reduced-motion support.

Disconnected visitors can inspect the verified demonstration vault or start with an empty workspace. The sample calculator on the landing page is labeled illustrative. Live balances and receipts come from RPC reads, never fixture transactions.

## Run locally

Requires Node.js 22.23+ or 24 and npm. No database or paid service is required.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open http://localhost:3000. Public RPC defaults work without API keys. See [.env.example](.env.example) for optional RPC overrides and deployment-only keystore paths. Never prefix signing secrets with `NEXT_PUBLIC_`.

For reliable browser QA, use the production server:

```sh
npm run build
npm run start -- --port 3098
# In a second terminal:
PLAYWRIGHT_BASE_URL=http://localhost:3098 npm run test:browser
```

## Contracts, tests and deployment

```sh
npm run contracts:bootstrap
npm run contracts:build
npm run contracts:test
npm run lint
npm run typecheck
npm test
npm run build
```

Foundry and Solidity 0.8.29 are required; the wrapper reuses local tools when available. Bootstrap pins the official current `reactive-lib-omni`, forge-std and OpenZeppelin. Contracts use Omni’s `onlySystem`, `LogRecord` and `requestCallbackV_1_0`; they do not use obsolete ReactVM assumptions.

Deployment is deliberately separate from CI. [Deployment guide](docs/DEPLOYMENT.md) explains encrypted disposable testnet accounts, funding, safe initialization order, exact subscriptions, source verification and resumable proof scripts. `npm run health` checks actual chains, funding and debt. Do not rerun funding or deployment blindly against the existing manifest.

See [testing](docs/TESTING.md), [security review](docs/SECURITY.md), [troubleshooting](docs/TROUBLESHOOTING.md), [architecture](docs/ARCHITECTURE.md), [research](docs/RESEARCH.md), [design system](docs/DESIGN_SYSTEM.md), and [current build status](docs/BUILD_STATUS.md).

## Engineering portfolio

**Cloud and deployment:** Deployed the Next.js frontend and read-only API to Vercel, separated public/server RPC configuration, and verified actual public HTTP responses, chain receipts and production viewport captures through GitHub Actions. No Neon database is needed.

**DevOps:** Preserved Git history, checkpoint commits, pinned dependencies, GitHub Actions for contract and web checks, reproducible deployment scripts and deployment manifests. CI never receives signing keys or automatically deploys financial contracts.

**Networking and APIs:** HTTPS JSON-RPC integration across two testnets; chain-ID validation; wallet authorization; event topic decoding; bounded event pagination; concurrent-request coalescing; explicit external-service errors and chain-backed receipt correlation.

**Reliability:** Fee/debt and subscription inspection, authenticated callback diagnostics, replay protection, owner-controlled pause/recovery and documented incident investigation. These are implemented diagnostics, not a claim of continuous production monitoring.

## Limitations and license

Supports only the deployed conventional demo ERC-20. Fee-on-transfer, rebasing and arbitrary tokens are excluded. Callback delivery can be delayed or fail; paused or recovered funds require the documented owner workflow. Public RPC history is bounded and paginated. The official callback query returned incomplete records in the verified run; raw receipts supply the evidence chain.

This is internally reviewed and tested, **not independently audited or ready for mainnet funds**. Original project code is [MIT](LICENSE). Fonts include their OFL notice. Pinned upstream Omni files have `UNLICENSED` SPDX identifiers; they are downloaded locally rather than vendored, and upstream licensing clarification is needed before redistribution or commercial use. No adoption, audited safety or production uptime is claimed.

## Demonstration film

The verified film is **150.0 seconds, 1920×1080 at 30 fps, H.264 with AAC narration**. It contains genuine moving signed-user setup/payment footage, actual 50/30/20 receipts and the separately labeled original M1 proof. Source, audio, captions and editorial cuts are in [video/](video/); the complete rendered file is kept outside Git history at `artifacts/video/incomeflow-demo.mp4`. [Verification report](deployments/video.json) · [timeline and reproduction](docs/VIDEO_TIMELINE.md). [Download the verified MP4](https://github.com/sopskistar/IncomeFlow/releases/download/incomeflow-testnet-demo/incomeflow-demo.mp4) · [release and captions](https://github.com/sopskistar/IncomeFlow/releases/tag/incomeflow-testnet-demo). The anonymous download was checked against the local SHA-256.
