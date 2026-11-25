# On-chain proof

Last checked: November 25, 2026. **M1 implemented and verified on live testnets, including replay protection.**

## Networks and infrastructure

| Role | Network | Chain ID | Infrastructure |
| --- | --- | --- | --- |
| Origin and destination | Base Sepolia | 84532 | [Callback proxy](https://sepolia.basescan.org/address/0x476F44b11F5C942c58f4c8E3d0300E5710743585) |
| Reactive execution | Reactive Lasna | 5318007 | [System contract](https://lasna.reactscan.net/address/0x8888888888888888888888888888888888888888) |

Disposable testnet deployer: `0x732400B210BCd79ACD0BBb8a760CAcd511f7e09a`. Its encrypted keystore and password file are ignored, local and never part of evidence.

## Confirmed funding

Both incoming transfers were discovered through the public explorer and independently confirmed through Base Sepolia JSON-RPC receipts and transaction data:

| Transfer | Amount | Base block | Receipt |
| --- | --- | --- | --- |
| [First funding](https://sepolia.basescan.org/tx/0x5ff371b7fffb5f8570dc2486f3e1a0fa04c383ab28fd3da2cda4f03227fffce9) | 1 test ETH | 63407026 | Success |
| [Second funding](https://sepolia.basescan.org/tx/0x45328422c3b96e9c988dbd7a10f7ee4df5483d2a13c6a5e24b9fa3445f059e96) | 1 test ETH | 63408404 | Success |
| [Reactive faucet request](https://sepolia.basescan.org/tx/0x0c5e5362d64f2d23f1fb78019e24e2ad9e4fc0cb8f2b6ad6992cd6984e252ddb) | Exactly 0.02 test ETH | 63408849 | Success |

Decoded faucet call: `request(0x732400B210BCd79ACD0BBb8a760CAcd511f7e09a)` on official Base Sepolia faucet `0x2afaFD298b23b62760711756088F75B7409f5967`. Contract code exists. At `2026-11-25T10:48:27.203Z`, the independently queried Lasna balance was exactly **2 lREACT**, and the remaining Base balance was `1.979999846489984657` test ETH. These are a point-in-time reading before deployments, not promised current balances.

Machine-readable evidence: [funding.json](../deployments/evidence/funding.json). No duplicate faucet request was made; the deployment script refuses another request when an earlier faucet hash exists.

## Verified contracts

| Contract | Network | Address / explorer | Source verification |
| --- | --- | --- | --- |
| MockIncomeUSD | 84532 | [0x2d1045a2025d197Ee83723452B505bec38427CE9](https://sepolia.basescan.org/address/0x2d1045a2025d197Ee83723452B505bec38427CE9) | [Sourcify exact match](https://repo.sourcify.dev/contracts/full_match/84532/0x2d1045a2025d197Ee83723452B505bec38427CE9/) |
| IncomeVault | 84532 | [0x361890c8550548bB5c1A2C40e009470a259cf41E](https://sepolia.basescan.org/address/0x361890c8550548bB5c1A2C40e009470a259cf41E) | [Sourcify exact match](https://repo.sourcify.dev/contracts/full_match/84532/0x361890c8550548bB5c1A2C40e009470a259cf41E/) |
| IncomeFlowReactive | 5318007 | [0x07B1f3295A076e52403811B5128f4e479E4D0C3d](https://lasna.reactscan.net/address/0x07B1f3295A076e52403811B5128f4e479E4D0C3d) | [Sourcify exact match](https://repo.sourcify.dev/contracts/full_match/5318007/0x07B1f3295A076e52403811B5128f4e479E4D0C3d/) |

All three Sourcify API results confirm exact creation and runtime matches, saved in [verification.json](../deployments/verification.json). The exact active subscription is saved in [subscription.json](../deployments/evidence/subscription.json): token Transfer topic0, exact vault topic2, wildcard sender/topic3. No all-token-transfer subscription.

## Complete real automation loop

1. [Origin transfer](https://sepolia.basescan.org/tx/0x6ba488437a060f491d63346899298e7c5526703b7e03a393329e90ad0f5cf031) at Base block 63409763, log index 1: 100 ifUSD transferred directly to the vault. The token emits the event.
2. [Reactive execution](https://lasna.reactscan.net/tx/0xfe0331a80d2d8e640964c486f0d3454616f6c5d004895c2a4d8ce22cdb1825bc): successful `react()` and SYSTEM `CallbackRequest`, chain 84532, sender 0x07B1f3295A076e52403811B5128f4e479E4D0C3d, destination 0x361890c8550548bB5c1A2C40e009470a259cf41E.
3. [Destination callback and distribution](https://sepolia.basescan.org/tx/0x65ce581bfe4ccb1524ce36a65129a6a00405d7500fa5fadb48942ef7cae8c030): successful official-proxy delivery, three actual token Transfers and three `AllocationPaid` events, followed by `PaymentAllocated` with policy version 1.

Payment ID: `0xeec6d561b42b08b72520179c0ac6ae30c938ef8b798d920437e2440137406698`.

| Category | Recipient | Before | After | Delta |
| --- | --- | --- | --- | --- |
| Spending | `0xA96B637E0Dc2F17937700B18010723AD1f4e3079` | 0 | 50 | 50 ifUSD |
| Savings | `0x93b79B2E31Fb33E11C11d4067C3A3820E5Cf2AEB` | 0 | 30 | 30 ifUSD |
| Tax reserve | `0x0B4ad4CEDEC75bc9577Afc9D75C75b1101875713` | 0 | 20 | 20 ifUSD |

Six token decimals. Exact raw amounts are stored in [m1.json](../deployments/evidence/m1.json). Origin Base timestamp 1795603821; destination Base timestamp 1795603823. Measured Base block-timestamp difference: **2 seconds** for this one run, not a performance guarantee or frontend stopwatch measurement.

## Live replay test

[Authenticated retry request](https://lasna.reactscan.net/tx/0x823761d9d3fa36d736b33bc626a49aa086a15b247d7d1a763b51406620ad5451) delivered [this destination transaction](https://sepolia.basescan.org/tx/0xc3fd327c14530665951b790338c27d3901a6e86a95ee826e59b2382d75db5a69). The vault emitted `DuplicateIgnored` for the same payment ID; receipt contains no ifUSD Transfer; recipient balances remained 50/30/20 and `paymentCount` remained 1. Raw receipt: [replay-receipt.json](../deployments/evidence/replay-receipt.json).

## Evidence limits and independent inspection

The system `getCallbacks(uint256)` read returned an empty array during verification, including after delivery. We therefore do not claim a populated network delivery record. Correlation is independently reproducible through the authenticated vault payment ID, exact source transaction/log index in RC and vault events, matching CallbackRequest, successful destination receipt and actual token Transfers. Replay correlation uses the identical authenticated payment ID and `DuplicateIgnored`. No off-chain payer or simulated event was used.

Raw [origin](../deployments/evidence/origin-receipt.json), [Reactive](../deployments/evidence/reactive-receipt.json), [destination](../deployments/evidence/destination-receipt.json) and replay receipts are retained. `npm run proof` resumes an existing attempt rather than paying again. Broader adversarial cases are Foundry tests, not falsely described as live failure transactions.

Fee balances before proof: vault 0.003 Base test ETH; RC 0.5 lREACT; both debts zero. Read current funding with `npm run health`; those initial values are not current-balance promises. Callback authentication is implemented by the verified official base contract modifiers checking immutable proxy AND immutable RC sender.

## Reproduce

1. Follow [deployment instructions](DEPLOYMENT.md) using a disposable testnet keystore.
2. Run `npm run health` to check network IDs, deployed code, balances, debt and reserves.
3. Run `npm run proof` to send a real 100 ifUSD transfer and observe the real callback. Interrupted attempts resume the same origin transaction instead of making another payment.
4. Inspect raw receipts under `deployments/evidence/` and linked explorers; confirm token Transfer logs, not just callback requests.
5. Retry the authenticated payment after the cooldown and confirm `DuplicateIgnored` without further payouts.

Local Foundry system/proxy doubles are test fixtures and never live-network proof.
