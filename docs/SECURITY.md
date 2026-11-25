# Security review

Internal engineering review, November 25, 2026. **Not an independent audit. Testnets only.**

## Boundaries reviewed

- `IncomeFlowReactive.react`: SYSTEM-only, strict Base/token/topic/destination/opcode/address/data checks. One authenticated event payload per chain/token/vault/tx/log ID. Owner retry cannot choose a new amount or destination; one-time vault binding cannot be redirected.
- `IncomeVault.allocate`: official proxy AND immutable RC identity; source chain/token metadata; nonzero amount/hash/block; source block cannot be future or recovered. Checks-effects-interactions, SafeERC20 and reentrancy guard. Duplicate delivery is a successful no-op, reducing unnecessary revert fees.
- `setRules`: owner-only, 2–8 unique destinations, exact 10,000 basis points, positive shares, 1–32-byte labels, zero/self/token/proxy rejection. Full-precision multiplication and deterministic final-recipient remainder. Current policy snapshot copied before external calls; executed version emitted.
- Ownership: two-step transfers; renunciation disabled. No deployer override or upgrade proxy. RC and vault ownership are separate and must be transferred separately if changing operators.
- Recovery: owner-only, paused full sweep to owner, monotonic source-block cutoff. Old pending callbacks cannot spend replacement deposits. Unsupported-token recovery cannot bypass supported-token recovery controls.
- Fees: inherited authenticated `pay`; public `coverDebt` can only pay the immutable service from the contract's balance. No caller-controlled native recipient. Fee funds cannot be withdrawn in this MVP.

## Findings and resolutions

| Finding | Resolution | Verification |
| --- | --- | --- |
| ERC-20 deposits execute no receiving-vault hook | Subscribe to token Transfer with exact indexed destination | Real live origin-to-callback run |
| One identity check would allow forged callbacks | Both official base modifiers | Unauthorized proxy/sender local tests; exact deployed source |
| Amount-only IDs collide | Domain-separated chain/token/vault/transaction/log ID | Same-transaction multiple-log and replay tests |
| Recovery could let an old callback consume new funds | Recovery block cutoff and full supported-token sweep | Regression test |
| Partial transfers could corrupt accounting | Atomic revert, safe transfers, event marking rollback | Failing-token and reentrancy tests |
| Unbounded recipient iteration | Maximum eight recipients | Validation tests |
| Rounding dust | Last destination receives remainder | 512 fuzz cases, tiny-amount regression, stateful invariant |
| Ownership renunciation strands recovery | Disabled | Regression test |
| Public RPC log range rejects broad scans | 200-block pagination | Observed HTTP 413; resumed live replay inspection successfully |
| Retry payment could repeat on interrupted scripts | Persist origin/retry hashes; refuse repeated faucet request | Actual replay resumed without another request |

## Remaining limits

Only the deployed conventional six-decimal ifUSD demo token is supported by the product. Fee-on-transfer, rebasing, malicious and arbitrary tokens are excluded. The immutable token check does not make a malicious token safe. Base source events are trusted through Reactive's network and callback service; this is not a destination-side light client. Owner rule changes affect pending callbacks. No promise of delivery during insufficient funding, service outage, source ingestion delay or subscription pause; pausing does not stop deposits. Recovery may be needed for missed events. Callback funding is spent even on failure.

Faucet is intentionally free and address-rate-limited, not Sybil-resistant or redeemable. Three demo recipient keystores are encrypted locally. Public metadata contains addresses and transaction hashes, never keys. CI must never deploy financial contracts from broad privileged credentials. Before mainnet use: independent audit, threat-model review, economic/funding analysis, conventional token integration tests and upstream Omni license clarification.
