# Narration script

Planned synthetic narration: free Edge TTS, en-US-AriaNeural. This is explanatory narration, not a customer testimonial. Spoken copy below is the authoritative input for the editable video; final audio duration and synchronization must be verified after rendering.

## Opening

Getting paid in crypto is only part of the job. You still need to organize each payment for spending, savings, and the reserves you choose. IncomeFlow gives every payment a purpose.

## Setup

Connect an EVM wallet and create an independent receiving vault. Choose your destination wallets and percentages, then confirm your allocation rules. This example uses fifty percent for spending, thirty for savings, and twenty for a tax reserve. Only the owner can change the plan.

## Payment

Share the vault address like a normal receiving address. The demo supports only IncomeFlow's valueless test token on Base Sepolia. A regular token transfer starts the process. Submitting a payment is not the same as completing its allocations: the interface waits for real receipts.

## Automation

An ordinary ERC twenty transfer does not execute the receiving vault. Reactive Omni watches the token's genuine Transfer event, filters the exact vault destination, and requests a callback from Lasna. The vault verifies both the official Base callback proxy and its specific Reactive contract before moving funds. No backend payout key is involved.

## Result

Open the payment receipt to follow what actually happened. The supported payment is allocated to the configured destinations, with exact integer amounts and its executed policy version. Public transaction links connect the deposit, Reactive execution, and destination token transfers. Unknown stages stay unconfirmed; funding and pause controls remain visible.

## Proof

The original verified run received one hundred demo tokens and paid fifty, thirty, and twenty. Base block timestamps were two seconds apart for that run, not a latency guarantee. A real duplicate callback emitted DuplicateIgnored and paid nothing more. Exact source matches, raw receipts, and reproducible instructions are in the public repository.

## Closing

IncomeFlow is a testnet prototype for personal income automation. Tax reserves are user choices, and mainnet use would require independent security review. Set your plan once. Let supported payments find their purpose.
