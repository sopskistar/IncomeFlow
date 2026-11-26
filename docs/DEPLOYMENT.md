# Deployment

## Prerequisites

Node 22+ (development used Node 24.22.2), npm, Foundry (used 1.10.0), Solidity 0.8.29. `npm ci`, then `bash scripts/bootstrap-contracts.sh` installs pinned Omni and forge-std sources into ignored dependency directories. OpenZeppelin 5.6.1 is pinned in package-lock. Copy `.env.example` to `.env` if customizing RPCs; scripts load `.env` with Node’s built-in env-file loader.

The checked-in `deployments/testnet.json` records the actual demo deployment. Do not rerun deployment as if no contracts exist. Deployment resumes from metadata and records each confirmed step. A new independent deployment needs a separate manifest/branch and new dedicated vault/RC pair.

## Keys and testnet funds

Use a disposable encrypted Foundry keystore. The existing local account uses `.secrets/deployer` with `.secrets/password` (both ignored and mode-restricted). Never print, export or commit its key. For your own setup: `cast wallet new .secrets deployer` prompts for encryption; securely create a mode-600 password file and set `DEPLOY_KEYSTORE` / `DEPLOY_PASSWORD_FILE`. These are file paths, not browser environment variables. Never use mainnet funds.

Verify `eth_chainId` before sending. Base Sepolia 84532 and Lasna 5318007 are enforced. Proxy and system code must exist. Fund the deployer with test ETH and lREACT. The official Base faucet `request(address)` at `0x2afaFD298b23b62760711756088F75B7409f5967` can exchange 0.02 Base test ETH for 2 lREACT at the documented rate. `npm run deploy -- --faucet` only requests when Lasna funds are absent and refuses a repeat once a faucet hash is saved. Requery the balance before any further funding.

## Order and execution

1. `npm run contracts:test`.
2. `npm run deploy`: token on Base, payable RC on Lasna, vault on Base with immutable proxy/RC, encrypted demo recipients, policy and one-time RC binding/subscription.
3. `npm run health`: code, RPC IDs, balances, debt, reserves and subscription diagnostics.
4. `npm run proof`: real faucet tokens if needed, then direct 100 ifUSD transfer; confirm origin event, Lasna receipt/request, Base receipt/payouts and actual balance deltas. Origin attempt is persisted for safe resumption.
5. `node --import tsx scripts/replay.ts`: retry only the saved authenticated ID after 60 seconds; confirm DuplicateIgnored and unchanged balances. No repeated request if a hash was saved.
6. `node --import tsx scripts/verify-contracts.ts`: submit source to Sourcify, then independently query `/server/v2/contract/<chain>/<address>` and retain exact-match results. A submission job ID alone is not verification proof.

Initial per-contract funding: 0.5 lREACT to RC, 0.003 Base test ETH to vault. These are starting amounts, not guaranteed operating reserves. Deployment key signs through Foundry keystore; private keys never appear in command arguments. Export web ABI/bytecode with `node --import tsx scripts/export-contracts.ts` after rebuilding. Do not silently change bytecode while continuing to claim an existing source match.

## Funding and debt

On Lasna call SYSTEM `depositTo(reactive)` with lREACT; on Base call proxy `depositTo(vault)` with test ETH. `depositTo` pays existing debt then credits fee reserves. Sending directly to a contract requires inherited `pay` or `coverDebt()` for settlement. Never send to SYSTEM without specifying the target. Run health again after payment. Native balance plus reserves greater than zero is a funding observation, not a delivery guarantee.

## Web hosting

Next.js targets Vercel with `npm ci && npm run build`; RPC env values and generated public deployment metadata contain no signing keys. The web frontend never uses the deployment keystore. A live URL will be added only after an actual deployment and browser inspection. No database is needed for core automation.

## Verified hosting record

Vercel project `sopskistars-projects/incomeflow` was created using the existing authenticated free account. Initial production deployment ID: `dpl_7dWuHW1D4u5VB6LGWsWA2YCmyov9`. Public alias: https://incomeflow-gamma.vercel.app. Independent unauthenticated homepage and vault API requests returned HTTP 200; actual API state matched M1, including zero debt and 50/30/20 transfers. Final browser inspection and post-fix deployment are tracked in BUILD_STATUS.md. No custom domain or paid infrastructure was purchased.

No signing secrets are required on Vercel. Public testnet RPC defaults are used unless explicitly overridden. `.vercelignore` excludes encrypted wallets, local tooling, video recordings, contract build artifacts and environment files. The core app uses on-chain state and needs no database. Production remains a testnet demonstration.

Final runtime source checkpoint: `747be04`. Verified deployment `dpl_48RFxdBJ3Aeu5p1wXJXhEksmRxyc`, immutable URL https://incomeflow-cpt6v6l13-sopskistars-projects.vercel.app. Both public browser assertions and production screenshots passed in GitHub Actions; see PRODUCTION_QA.md. No automatic Vercel-on-push integration is claimed: deployments were issued explicitly through the authenticated CLI, while GitHub Actions runs verification only.
