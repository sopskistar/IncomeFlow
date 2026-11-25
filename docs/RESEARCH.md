# IncomeFlow research

Research date: November 25, 2026. Product hypotheses below are not customer-validation claims.

## Competition and evidence gate

The [organizer announcement](https://blog.reactive.network/reactive-omni-buildathon-thirty-days-to-find-out-what-one-second-buys/) (Nov 4, 2026) establishes November 5–December 5, Set It and Forget It personal automation, $2,000 / $250 prizes paid in REACT, equal execution/integration/usefulness/craft scores, and a public repository, deployed addresses, full-loop hashes and a video under three minutes. Entries without reactive transactions and callbacks are not scored further. Original implementation began November 25; pre-existing libraries remain dependencies.

The [official DoraHacks page](https://dorahacks.io/hackathon/reactive-omni-buildathon/detail) returns HTTP 405 through both web retrieval and direct HTTPS. Search surfaced third-party claims of December 5 at 20:00 UTC, but **the exact cutoff and additional portal rules remain unverified from the primary source**. Treat December 4 as an internal completion target and check the authenticated portal before submission. Public submission listings could not be reliably inspected; no claim that IncomeFlow is unique among current entries.

## Current Omni implementation

- [Getting started](https://dev.reactive.network/): Omni has one EVM state, no RVM deployment, `vmOnly` or dual constructor branch. System address is `0x8888888888888888888888888888888888888888`.
- [Reactive contracts](https://dev.reactive.network/reactive-contracts): use `AbstractReactive`, `react(LogRecord memory) external onlySystem`, `SYSTEM.subscribe` and typed `requestCallbackV_1_0`. `opCode` is original topic count; transfer is LOG3. `txHash` is uint256. Filter exact origin chain, token, signature and topic2 destination; wildcard topic1/topic3 using `REACTIVE_IGNORE`, never zero. Reserve payload argument one as address(0) for injection. One-time bind after vault deployment resolves address dependencies.
- [Callback contracts](https://dev.reactive.network/callback-contracts): `AbstractCallback(proxy, reactive)` provides immutable provider/sender. Both `onlyServiceProvider` and `onlyCallbackSender` are required. Never accept an EOA-provided identity as proof.
- [Origins and destinations](https://dev.reactive.network/origins-and-destinations): Base Sepolia 84532 supports both roles; proxy `0x476F44b11F5C942c58f4c8E3d0300E5710743585`. Testnets must not be mixed with mainnets.
- [Lasna](https://dev.reactive.network/reactive-mainnet): 5318007, `https://lasna-rpc.rnk.dev/`, lREACT. Base Sepolia faucet `0x2afaFD298b23b62760711756088F75B7409f5967` accepts test ETH at documented 1:100 exchange. Both RPC chain IDs were independently queried.
- [Economy](https://dev.reactive.network/economy): destination pays native ETH; Lasna RC pays lREACT. `depositTo(target)` settles debt then reserves; direct balance needs inherited `pay()` or exposed `coverDebt()`. Query `debt`, `reserves`, native balance. `getCallbacks(reactiveTxHash)` records destination hashes and errors after delivery. A request alone proves no payout.
- [Diagnostics](https://dev.reactive.network/debugging) and [RPC methods](https://dev.reactive.network/rnk-rpc-methods): inspect filter registration, origin receipt, reactive revert, destination debt, callback errors and token transfers. Some RPC documentation retains legacy field names: do not infer old execution semantics from them.
- [Reactive MCP](https://dev.reactive.network/reactive-mcp): public read-only endpoint `https://mcp.rnk.dev/mcp`, source checks and live tracing available. No configured Reactive MCP tool found in this session; direct RPC and Foundry are the baseline, not an optional installation dependency.
- [Official Omni library](https://github.com/Reactive-Network/reactive-lib-omni): default branch `master`, pinned commit `3ade0dcf1d27e67e5783ef807e73a1b9e0c0cce8`. Interfaces and base implementations inspected directly. Upstream sources carry `UNLICENSED` SPDX labels and no root license was found: original IncomeFlow code is MIT; upstream licensing needs clarification before redistributing or mainnet commercialization. Dependency fetched separately, not relicensed or vendored into Git.
- [Official demos](https://github.com/Reactive-Network/reactive-smart-contract-demos): repository structure inspected. Legacy examples are not used as the implementation basis; current Omni library and docs define interfaces.

## Problem, evidence and competitors

| Source, accessed Nov 25 | What it establishes | Implication |
| --- | --- | --- |
| [Request Finance capabilities](https://help.request.finance/en/articles/8643029-what-can-i-do-with-request), [invoice API](https://docs.request.finance/invoices) | Existing crypto invoicing, salary and expense workflows; invoice denomination can differ from payment token. | Crypto payment administration is a real product category. This is evidence of the category, not proof users want IncomeFlow. |
| [Zero Hash freelancer survey](https://zerohash.com/wp-content/uploads/2024/06/ZH233-Freelancers-Survey-Report-AW.pdf) | Vendor-sponsored freelancer research covers payment friction and crypto familiarity. | Directional audience evidence; no causal adoption claims or invented survey statistics. |
| [Splits core contracts](https://splits.org/protocol/docs/core/) | Established reusable split primitives and permissionless distribution with potential distributor incentives. | IncomeFlow does not invent splitting. |
| [Splits changelog](https://splits.org/changelog/), [scheduled transactions](https://splits.org/changelog/splits-changelog-scheduled-transactions/) | Splits already offers automatic distributions and scheduled payments. | Never claim competitors require all payouts manually. Differentiate the personal income workflow and event receipt chain, not automation alone. |
| [Superfluid Super Tokens](https://tokens.superfluid.org/), [protocol explanation](https://superfluid.gitbook.io/superfluid/protocol-overview/in-depth-overview/super-tokens) | Streaming, programmable hooks and pooled distribution; wrappers add protocol capabilities to conventional tokens. | Strong solution for continuous income. IncomeFlow targets ordinary discrete ERC-20 payments without changing payer transfer semantics. |
| [KeeperHub migration guidance](https://docs.keeperhub.com/guides/gelato-migration) | No-code and developer automation alternatives exist; legacy Gelato Functions status changed in 2026. | Do not use obsolete comparisons or pretend automation alternatives do not exist. Provider-specific current status needs direct verification before recommendations. |
| [Reactive prior winners](https://blog.reactive.network/buidl-with-react-the-winners/) (Nov 6, 2025) | Working cross-chain integrations such as GoBridge recognized. | Demonstrate actual callback outcomes; do not reuse prior submissions as original event work. |

## Eight product questions

1. **Who?** Independent professionals already receiving conventional ERC-20 payments who use separate spending, savings and reserve wallets. No claim of universal suitability or observed customers.
2. **Evidence?** Existing invoicing, splitting and streaming products establish adjacent demand. No interviews, testimonials, traction or measured time savings exist for IncomeFlow; willingness to fund ongoing callback fees remains a hypothesis.
3. **Solved already?** Splits handles revenue shares and automation; Superfluid continuous payment; Request invoicing/accounting. IncomeFlow combines a narrow personal allocation interface with publicly traceable asynchronous event execution.
4. **Remaining friction?** Recipients still need destinations, token compatibility, fee funding and recovery understanding. Cross-chain asynchronous failures complicate ordinary splitter UX. We make these explicit instead of concealing them.
5. **Why choose it?** Set percentages once, share a normal vault receiving address, keep custody under owner-controlled contracts and inspect exact per-payment allocations. Familiar financial categories; no custom contract writing.
6. **Why Reactive?** A conventional ERC-20 transfer does not execute receiving-vault code. A frontend cannot act while offline. A cron bot can achieve similar results but needs a hosted watcher and funded signer. Reactive is the event-driven on-chain executor; the frontend never owns a payout key. Claims concern architecture, not guaranteed speed or lower cost.
7. **Reproducible result?** A 100 ifUSD direct transfer triggers a recorded Lasna execution and authenticated Base Sepolia callback yielding 50/30/20 tokens. This remains a target until `ONCHAIN_PROOF.md` contains real linked receipts and balance deltas.
8. **After the event?** Validate freelancer demand, obtain independent contract review and upstream licensing clarity, model per-vault fees, add proven token support, improve history indexing and funding UX. The MVP is testnet software; tax reserve percentages are user choices, not tax advice or liability calculations.

## Architecture decision

One independent Reactive contract and one independent vault per user; one demo token, two networks, no shared custody, no database or paid API. A first dedicated demonstration pair minimizes the live integration surface. Add a factory only after the primary loop is reliable. Current-policy-at-execution is explicit, the last recipient receives rounding remainder, and recovery invalidates pre-recovery event blocks.
