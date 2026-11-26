# Testing and verification

Updated 2026-11-25. Local results are distinct from the independently recorded live chain proof.

## Contract checks

`npm run contracts:test`: 28 Foundry tests passed, including 512-case fuzz runs and a stateful accounting invariant exercised across 4,096 calls. Coverage includes allocation totals, rounding/conservation, ownership, callback provider and sender authentication, replay protection, pauses/recovery, wrong/malformed logs, failed transfers and concurrent deposits. `forge fmt --root contracts --check` is the formatting gate.

These tests use a local harness for the official system/callback service. They establish implementation behavior, not network delivery. The actual deposit -> Lasna execution -> Base callback -> token transfers and a real replay are separately documented in [ONCHAIN_PROOF.md](ONCHAIN_PROOF.md).

A separate Solar-based `forge lint --severity high --severity med` attempt could not parse the inherited `Ownable` constructor invocation through `Ownable2Step`. It is not reported as a passing static analysis scan. Compilation and executable tests succeeded. See the focused internal [security review](SECURITY.md); this is not an external audit.

## Web checks

- Production Webpack build: passed. CPU parallelism is limited to one to accommodate this host.
- TypeScript: passed.
- ESLint: final verification recorded in BUILD_STATUS.md.
- Vitest: 7 tests passed for basis-point validation, invalid recipients, exact integer rounding, decimal parsing and explorer links.
- Production-server Playwright: 14 tests passed. Includes real public vault API/receipts, navigation, empty/error states, draft navigation/reload/discard, validation, downloads, 1440/768/390/320 layouts, keyboard/reduced motion and a non-signing wallet fixture for switching/rejection/disconnect.
- Runtime captures: no browser errors in the final responsive screenshot pass.
- Dependency audit: no production vulnerabilities at the high-severity gate in the recorded local check.

The explicit unit/browser wallet fixture never broadcasts a transaction and is not live blockchain proof. The opt-in `scripts/live-browser.ts` uses the encrypted local Foundry signer through a named EIP-1193 test provider to verify actual UI writes. Its outcome and any transaction hashes are recorded separately; do not assume it passed from the fixture tests.

## Reproduce browser checks

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run start -- --port 3098
# another terminal
PLAYWRIGHT_BASE_URL=http://localhost:3098 npm run test:browser
node scripts/capture-qa.mjs
```

Use `npx playwright install chromium` if no compatible installed browser exists. The browser helper reuses an installed Chromium. Default Playwright webServer uses production in CI, Webpack development locally. Development compilation previously exceeded startup timeouts under memory pressure; a built production server removes that dependency from QA.

Actual desktop, tablet and phone screenshots were inspected, then refined. Hallmark static checks found no unresolved failures; its Puppeteer render tool was unavailable, so actual rendering was inspected through Playwright. Impeccable’s detector and independent visual/accessibility review informed fixes to mobile tabs, touch targets, draft persistence and form error placement. These are scoped product checks, not a WCAG certification.

## CI

`.github/workflows/ci.yml` runs independent contract and application jobs, including pinned dependency installation, build/tests, lint, TypeScript, production dependency audit and Chromium journeys. It receives no signing keys and performs no contract deployment. Actual remote-run status belongs in BUILD_STATUS.md once a pushed run is inspected.

Final remote check: commit `747be04` passed GitHub Actions contracts/application jobs and both **14-test local-build and public-Vercel suites**. Public suite: 12.8s, no retries. [Actual run](https://github.com/sopskistar/IncomeFlow/actions/runs/45754101739). Additional deterministic hydration and underfunding/API validation coverage is included. Local production network interruptions were preserved and are not reclassified as passes.

## Payment Passport extension

The preserved 18-test report is `/tmp/incomeflow-passport-browser-full.log`. After independent review fixes, `/tmp/incomeflow-passport-browser-final.log` reports **20 passed in 1.7 minutes**. New cases cover signing-review title/amount, Edit retaining payer/date, declined signing, genuine signed archive import/export/reconnection, malformed/oversized links, and actual two-payment client/full-owner receipts. No ordinary browser test signs or broadcasts.

The opt-in signed acceptance already passed and is guarded by `deployments/passport-proof.json`; do not rerun payments for QA. Exactly two transfers were made in the earlier run. 25 unit tests cover cryptography/domain tampering, schemas/expiry, duplicate association accounting, storage isolation and chain receipts including canonical vault/Reactive code and actual payouts. 28 unchanged-contract Foundry tests passed; Solar remains an incompatible parser result, not a passing scan. Final branch/public CI outcomes are recorded after execution in BUILD_STATUS.md and passport-checks.json.
