# Product story

## Target user
An independent professional already receiving supported cryptocurrency payments. Adoption and willingness to pay remain hypotheses.

## Real-world problem
The work is finished. The financial admin is not: request, identify, reconcile, organize and retain a record of each payment.

## Evidence
[PROBLEM_RESEARCH.md](PROBLEM_RESEARCH.md) records primary small-business/receivables reports, their scope and methodological caveats. These support the wider problem, not product effectiveness.

## Illustrative scenario
Imagine a designer delivering a website. A payment request is still needed. A partial transfer arrives; the remaining balance needs tracking. Received income needs organizing. This designer and job are illustrative, not a customer or commercial transaction.

## Product insight
An incoming payment belongs to a larger story: completed work, a request, verified money received, automatic allocation and evidence retained.

## Alternatives
Splits provides established revenue/payment infrastructure; Superfluid provides money streaming. Invoicing and receivables services already manage broad business workflows. Our narrow prototype joins explicit supported-token payment associations to event-triggered personal allocations. See COMPETITIVE_DIFFERENTIATION.md; no claim of category invention.

## Solution
Payment Passport signs a shareable request, records exact partial payments explicitly confirmed by the owner, and retains independently checked allocation receipts. The smart vault allocates supported deposits using the owner's rules.

## Why Reactive Omni
A plain ERC-20 Transfer updates token state; it does not call the recipient vault's allocation logic. The exact token/vault event subscription triggers an authenticated destination callback without an always-online user or server payout key. Request metadata and associations remain application features, not Reactive actions.

## Working proof
The original M1 and later signed-wallet acceptance each prove real 100 ifUSD → 50/30/20 distributions. They are testnet engineering demonstrations, not freelance income or historical invoices. New Passport-specific evidence belongs in ONCHAIN_PROOF.md only after actual verification.

## Limitations
One valueless test token on Base Sepolia; funded Lasna/callback services required. No debt enforcement, accounting replacement, tax assessment, identity verification, global attribution registry or automatic cross-device sync. Internal review is not an independent audit.

## Website narrative
Give every payment a purpose. From payment requested to income organized. Imagine finishing the client work, then having a clear record from request through verified transfer to automatic allocation.

## README narrative
Lead with the remaining financial workload after delivery; cite qualified primary research, then explain the narrower implemented workflow. Preserve exact reproduction instructions and live proof.

## Video narrative
Person → problem → evidence → request → explicit transfer → Reactive allocation → retained record. Label illustrative context. Film real interactions; distinguish old M1 proof from new Passport evidence. Keep the previous verified video until the revised film passes.

## DoraHacks narrative
Personal automation joins a relatable workflow to an essential event-triggered contract action. Judges can follow actual token logs, Reactive execution, callback and payouts. Payment-request management itself is off chain.

## Public social narrative
The work is finished. The financial admin isn't. IncomeFlow connects supported crypto payment requests, explicitly verified transfers and automatic income allocations. Testnet prototype; public proof and open-source code available. No adoption or savings claims.
