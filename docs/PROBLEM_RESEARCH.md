# Problem research

Checked 2026-11-26. The audience hypothesis is independent professionals receiving discrete crypto payments. No customer interviews or measured product time savings have been conducted.

## Primary evidence

[QuickBooks: 2026 Small Business Late Payments Report](https://quickbooks.intuit.com/r/small-business-data/small-business-late-payments-report-2026/). By Jamerlyn Brown and Myranda Mondry; the accessible publication-date label contains no date. It reports 59% with invoices overdue at least 30 days and 39% experiencing difficulty covering payroll or bills after a late payment. Manual processes also appear among internal contributors. Its cited sources include a roughly 5,000-person quarterly survey and a December 2025 online survey of 1,305 US owners of businesses with 0–250 employees. The page does not map every figure to an individual survey wave. These are small-business findings, not crypto-freelancer prevalence or proof of IncomeFlow effectiveness.

[Chaser: The 2026 accounts receivable report](https://www.chaserhq.com/the-2026-accounts-receivable-report). No precise publication date displayed. Reports 76% spending at least three hours weekly on receivables. The methodology specifies 163 validated responses collected late 2025–early 2026 through internal/external professional databases and partners, principally UK/Australia; the executive summary instead says 300+. This inconsistency, commercial sponsorship, self-selection and mixed business sizes limit generalization. Manual follow-up and reconciliation are described as burdens. No causal product benefit is inferred.

## Product interpretation

Getting paid does not finish financial administration. Our narrow design hypothesis connects a supported-token request, explicit transfer association, partial-payment record, automatic allocation and retained evidence. It does not solve late payment enforcement, bookkeeping, disputes or tax calculation. The illustrative designer is a narrative device, never a reported customer.

## Technical sources

[EIP-712](https://eips.ethereum.org/EIPS/eip-712), [Viem signTypedData](https://viem.sh/docs/actions/wallet/signTypedData), and the pinned official Omni library inform signing and execution boundaries. EIP-712 does not itself provide replay protection; unique request digests and exact chain/transaction/log keys identify records. Contract payout replay protection remains the existing authenticated payment ID mechanism.
