# Narration script

Actual original copy used for the supplied synthetic en-US-AriaNeural narration. `video/narration.json` is the machine-readable source. Generated audio is already included; no paid API is required. This is explanatory narration, not a testimonial.

## Give every payment a purpose. (0–12s)

Getting paid in crypto is only part of the job. IncomeFlow automatically organizes each payment for spending, savings, and the reserves you choose.

## Your wallets. Your allocation. (12–36s)

Connect an EVM wallet and create an independent receiving vault. Choose destination wallets and percentages, then confirm the rules. Here, fifty percent goes to spending, thirty to savings, and twenty to a tax reserve. Only the owner can change this plan.

## A regular token payment. (36–58s)

Share the vault address like a normal receiving address. The demo supports only IncomeFlow's valueless test token on Base Sepolia. A regular token transfer starts the process. Submitting a payment is not the same as completing its allocations. The interface waits for real receipts.

## Reactive does the essential work. (58–82s)

An ordinary ERC twenty transfer does not execute the receiving vault. Reactive Omni watches the token's genuine Transfer event, filters the exact vault destination, and requests a callback from Lasna. The vault verifies both the official Base callback proxy and its specific Reactive contract before moving funds. No backend payout key is involved.

## Follow the actual result. (82–110s)

Open the payment receipt to follow what actually happened. The payment is allocated to the configured destinations, with exact integer amounts and its executed policy version. Public transaction links connect the deposit, Reactive execution, and destination token transfers. Unknown stages stay unconfirmed. Funding, pause, and recovery controls remain visible.

## Evidence, all the way through. (110–134s)

The original verified run received one hundred demo tokens and paid fifty, thirty, and twenty. Base block timestamps were two seconds apart for that run, not a latency guarantee. A real duplicate callback emitted Duplicate Ignored and paid nothing more. Exact source matches, raw receipts, and reproducible instructions are in the public repository.

## Set your plan once. (134–150s)

IncomeFlow is a testnet prototype for personal income automation. Tax reserves are user choices, and mainnet use would require independent security review. Set your plan once. Let supported payments find their purpose.
