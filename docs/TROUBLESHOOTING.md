# Troubleshooting

## Wallet and network

Open IncomeFlow in an injected EVM wallet browser or install a supported browser wallet. Connect from the header. Use Base Sepolia for vault/token actions and Reactive Lasna for automation actions. A rejected connection or signature remains an error; reconnect and retry deliberately. Never provide a seed phrase to the application.

A creation consists of three confirmations: Lasna Reactive deployment, Base vault deployment and Lasna binding/subscription. Public confirmed addresses remain in browser storage, so **Create or resume setup** continues an interrupted sequence. Do not clear this storage before recording the addresses. Never repeat an existing deployment merely because the UI was closed.

## A payment has not distributed

1. Open the origin transaction and verify successful ERC-20 `Transfer` from the supported token, indexed destination equal to the vault and nonzero amount.
2. Inspect Health: exact subscription, Reactive balance/debt, callback ETH/debt, pause state and current policy. Configuration must total 10,000 basis points.
3. Inspect the Lasna transaction and its callback request. A requested callback alone does not prove distribution.
4. Inspect the Base callback receipt and token transfers. Unknown records remain unconfirmed. Public callback-query endpoints may return incomplete records; use raw receipt correlation described in ONCHAIN_PROOF.md.
5. If a request failed, correct funding/policy/pause state, then use the owner-only stored-event retry after its 60-second cooldown. Do not create a replacement payment to repair a callback.

Top up automation and callback funding separately through Health using testnet assets only. A positive balance does not guarantee future delivery. `npm run health` and [deployment instructions](DEPLOYMENT.md) expose current debt and reserves. Pay outstanding debt using the contract’s documented debt-cover path; recheck after confirmation.

## Paused or recovered funds

The owner may pause allocations. Resume only after confirming the intended rules. Recovery of supported tokens requires a paused vault and explicit acknowledgment; it sets a block cutoff that rejects older callbacks. After recovery, do not retry the recovered payment. No deployer/backend can withdraw another owner’s vault.

## History or RPC unavailable

Refresh after a confirmed transaction. The API queries bounded recent windows in 200-block chunks to respect public Base RPC limits. Use **Load earlier payments** for older ranges; archived demonstration references remain independently checked from actual receipts. Rate limiting, endpoint errors or delayed indexing can postpone visible data. An error is not evidence that a transaction failed. Inspect its receipt before resending.

RPC URLs may be overridden in `.env`; restart the server after changes. Server and public wallet RPCs must point to the same intended testnets. `eth_chainId` must be 84532 / 5318007. Never silently switch to mainnet.

## Local browser startup timeout

Stop only conflicting IncomeFlow dev/build processes. Build once with Webpack, run the production server on port 3098 and set `PLAYWRIGHT_BASE_URL=http://localhost:3098`. Do not run concurrent Next builds against the same `.next` directory. Unrelated host processes must be left intact.

## Security reports

Do not include wallet keys, password files or unrestricted environment dumps. Provide chain IDs, public addresses, transaction hashes, decoded error and the minimal reproduction. The prototype is not independently audited; use valueless test assets only.

## Older receipt has no Reactive execution link

The Base history cursor and recent Lasna observation window are separate. Lasna observations are queried over the last 2,000 blocks; an older user receipt can retain a confirmed destination payout while its Reactive stage is unavailable in this bounded read. That is an indexing limitation, not proof that no Reactive execution occurred. Keep the downloaded receipt/transaction references and inspect Reactscan. The original demonstration has explicit archived references that are revalidated from real receipts. The signed frontend run's complete references remain in `deployments/browser-proof.json`.
