# Payment Passport

Payment Passport surrounds the existing Reactive vault with a request-to-record workflow. It adds no custody contract, backend signing key, database or payment bot. Original deployments and proof remain authoritative.

## Trust model

A version-1 EIP-712 PaymentRequest includes a random bytes32 ID, owner, vault, token, title/description, integer base-unit amount, optional payer, issue/due/expiry timestamps. The domain is `IncomeFlow Payment Passport`, version `1`, chain 84532, verifying contract equal to the receiving vault. The UI creates non-expiring requests; imported signed requests may specify expiry. A due date is not expiry. Only EOA owner signatures are supported; EIP-1271 contract-owner signatures are not implemented.

The public `/pay#…` fragment carries a base64url UTF-8 JSON envelope, including signatures. It is readable, not encrypted. Do not add private client details. The fragment avoids ordinary HTTP URL logging/referrers, but verification deliberately sends the envelope to this application's read-only API. Shared recipients and browser history can retain it. Ownership is checked against the current chain state on every verification; an ownership transfer invalidates the previous owner's request.

The verifier matches the compiled IncomeVault runtime after masking compiler-reported immutable positions, and separately checks supported token and official callback provider. An interface-compatible malicious contract is not enough. This attestation recognizes the pinned compiler/build, not future contract versions.

## Attribution and exact accounting

An ERC-20 transfer has no invoice ID. Nothing is matched by amount or timing. The owner signs a separate PaymentAssociation binding the request digest to origin hash, global receipt log index, and optional destination/Reactive hashes. Verification checks successful origin receipt, token-emitted Transfer, destination, positive amount, optional payer and that the transfer does not predate the request. Client identity remains unverified.

Only valid associated transfers count. Amounts are integer base units (6 decimals); outstanding is max(requested minus received, zero), overpayment is the reverse. The same hash/log index cannot count twice; different logs in one transaction are distinct. Local archives also reject allocating one transfer to multiple requests for the same vault. There is no global invoice registry: an owner can make conflicting independent signed associations outside their local archive. Do not treat a Passport as proof of exclusive legal debt settlement.

Transfer verification and allocation are separate. A destination hash is checked against a successful transaction to the official callback proxy, a matching PaymentAllocated event from the recognized vault, conserved AllocationPaid amounts, and actual corresponding token Transfers. The vault runtime enforces proxy plus configured Reactive sender authentication. Optional Reactive receipts must contain the matching PaymentObserved event from that specific Reactive contract. Unknown stages stay unknown.

Without an explicit destination hash, discovery scans at most 2,000 Base blocks following the origin. Supply the exact callback hash for later callbacks. Reactive history is not guessed; provide its exact hash. Failed references remain uncounted with an error; refresh after RPC recovery. Observations are current RPC receipt evidence, not a finality guarantee.

## Storage and recovery

Records use localStorage `incomeflow:passport:1:84532:<owner>`. Schema, owner, chain, size, dates and duplicates are validated; imported signatures and chain evidence are rechecked. A versioned JSON backup restores requests independently of the old browser. Import replaces that owner's local list after validation; export first to retain both sets. No automatic device synchronization or server persistence exists. Old shared links do not gain later associations: share an updated link or export.

Client receipts omit allocation details in the rendered view/export observation. Owner Passports include payout amounts, execution-policy version and evidence. Blockchain transactions remain public regardless of UI privacy. Manual reminders are copyable text only; nothing contacts a client automatically.

## Release state

See BUILD_STATUS.md and the latest recorded test results. Implementation is under verification on a feature branch; the prior production release remains the fallback until checks pass.

The linked Reactive runtime and its token/vault binding are also checked against the pinned build. This protects the automation-evidence label from lookalike contracts. Requests with zero associated outstanding amount do not solicit another payment; additional or excessive payments require explicit acknowledgment and are still counted only after owner association.

Signed issue/due dates are owner assertions, not a trusted timestamp service or on-chain request registry. The verifier rejects transfers older than the signed issue time; that alone cannot prove when a signature was physically created. The demonstrated ordering is supported by the genuine recorded acceptance workflow. Job completion, legal debt and named client identity are not attested by the signature.
