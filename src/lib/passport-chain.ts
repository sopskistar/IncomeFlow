import {
  decodeEventLog,
  encodeAbiParameters,
  parseAbi,
  keccak256,
  type Hex,
} from "viem";
import runtime from "../generated/VaultRuntime.json";
import reactiveRuntime from "../generated/ReactiveRuntime.json";
import {
  baseClient as base,
  reactiveClient as reactive,
  vaultAbi,
  reactiveAbi,
  proxy,
  supportedToken,
} from "./contracts";
import { scanLogs } from "./rpc-logs";
import {
  passportDigest,
  parsePassport,
  verifySignatures,
  totals,
  type Association,
  type PaymentRequest,
} from "./passport";
const events = parseAbi([
  "event Transfer(address indexed from,address indexed to,uint256 value)",
  "event PaymentAllocated(bytes32 indexed paymentId,uint256 indexed originTxHash,address indexed payer,uint256 originLogIndex,uint256 amount,uint256 version)",
  "event AllocationPaid(bytes32 indexed paymentId,address indexed recipient,uint256 amount,uint256 ruleIndex)",
  "event PaymentObserved(bytes32 indexed paymentId,uint256 indexed originTxHash,address indexed payer,uint256 logIndex,uint256 originBlock,uint256 amount)",
]);
export function matchesCompiledCode(
  code: string,
  template: {
    object: string;
    immutableReferences: Record<string, { start: number; length: number }[]>;
  } = runtime,
) {
  if (code.length !== template.object.length) return false;
  let masked = code.toLowerCase();
  for (const refs of Object.values(template.immutableReferences))
    for (const ref of refs)
      masked =
        masked.slice(0, 2 + ref.start * 2) +
        "0".repeat(ref.length * 2) +
        masked.slice(2 + (ref.start + ref.length) * 2);
  return masked === template.object.toLowerCase();
}
export const matchesVaultCode = (code: string) => matchesCompiledCode(code);
export async function verifyVault(r: PaymentRequest) {
  if ((await base.getChainId()) !== 84532)
    throw new Error("Base RPC network mismatch.");
  const [code, owner, token, provider, rc] = await Promise.all([
    base.getCode({ address: r.vault }),
    base.readContract({
      address: r.vault,
      abi: vaultAbi,
      functionName: "owner",
    }),
    base.readContract({
      address: r.vault,
      abi: vaultAbi,
      functionName: "token",
    }),
    base.readContract({
      address: r.vault,
      abi: vaultAbi,
      functionName: "_SERVICE_PROVIDER",
    }),
    base.readContract({
      address: r.vault,
      abi: vaultAbi,
      functionName: "_CALLBACK_SENDER",
    }),
  ]);
  if (
    !code ||
    !matchesVaultCode(code) ||
    String(token).toLowerCase() !== supportedToken.toLowerCase() ||
    String(provider).toLowerCase() !== proxy.toLowerCase()
  )
    throw new Error(
      "This request does not target a recognized IncomeFlow vault and supported token.",
    );
  if ((await reactive.getChainId()) !== 5318007)
    throw new Error("Reactive RPC network mismatch.");
  const rcAddress = String(rc) as `0x${string}`;
  const [rcCode, rcToken, rcVault] = await Promise.all([
    reactive.getCode({ address: rcAddress }),
    reactive.readContract({
      address: rcAddress,
      abi: reactiveAbi,
      functionName: "token",
    }),
    reactive.readContract({
      address: rcAddress,
      abi: reactiveAbi,
      functionName: "vault",
    }),
  ]);
  if (
    !rcCode ||
    !matchesCompiledCode(rcCode, reactiveRuntime) ||
    String(rcToken).toLowerCase() !== r.token.toLowerCase() ||
    String(rcVault).toLowerCase() !== r.vault.toLowerCase()
  )
    throw new Error(
      "Vault automation is not the recognized Reactive contract bound to this vault and token.",
    );
  return { owner: String(owner), reactive: String(rc) };
}
function decoded(log: { data: Hex; topics: readonly Hex[] }) {
  try {
    return decodeEventLog({
      abi: events,
      data: log.data,
      topics: log.topics as [Hex, ...Hex[]],
    });
  } catch {
    return null;
  }
}
export async function verifyPayment(
  r: PaymentRequest,
  a: Association,
  rc: string,
) {
  const receipt = await base.getTransactionReceipt({ hash: a.transactionHash });
  if (receipt.status !== "success")
    throw new Error("Payment transaction failed.");
  const log = receipt.logs.find((l) => l.logIndex === a.logIndex);
  const event = log && decoded(log);
  if (
    !log ||
    log.address.toLowerCase() !== r.token.toLowerCase() ||
    !event ||
    event.eventName !== "Transfer" ||
    event.args.to.toLowerCase() !== r.vault.toLowerCase() ||
    event.args.value === 0n
  )
    throw new Error(
      "Selected log is not a supported incoming transfer to this vault.",
    );
  const { from: payer, value: amount } = event.args;
  if (
    r.expectedPayer !== "0x0000000000000000000000000000000000000000" &&
    payer.toLowerCase() !== r.expectedPayer.toLowerCase()
  )
    throw new Error("Payment was not sent by the expected payer address.");
  const block = await base.getBlock({ blockHash: receipt.blockHash });
  if (block.timestamp < BigInt(r.issuedAt))
    throw new Error("Payment predates this request; it cannot be counted.");
  const id = keccak256(
    encodeAbiParameters(
      [
        { type: "uint256" },
        { type: "address" },
        { type: "address" },
        { type: "uint256" },
        { type: "uint256" },
      ],
      [84532n, r.token, r.vault, BigInt(a.transactionHash), BigInt(a.logIndex)],
    ),
  );
  let destinationHash: string | undefined,
    reactiveHash: string | undefined,
    version: string | undefined;
  let allocations: { recipient: string; amount: string }[] = [];
  let destinationLogs = [] as typeof receipt.logs;
  if (a.destinationHash !== "0x" + "0".repeat(64)) {
    const dest = await base.getTransactionReceipt({ hash: a.destinationHash });
    if (
      dest.status !== "success" ||
      dest.to?.toLowerCase() !== proxy.toLowerCase()
    )
      throw new Error(
        "Destination receipt is not a successful callback from the official provider.",
      );
    destinationLogs = dest.logs;
  } else {
    // Bounded discovery. Older callbacks can always be supplied by exact transaction hash.
    const latest = await base.getBlockNumber();
    const to =
      latest < receipt.blockNumber + 2000n
        ? latest
        : receipt.blockNumber + 2000n;
    const found = await scanLogs(
      receipt.blockNumber,
      to,
      (fromBlock, toBlock) =>
        base.getLogs({
          address: r.vault,
          event: events[1],
          args: { paymentId: id },
          fromBlock,
          toBlock,
        }),
    );
    if (found.length) {
      const dest = await base.getTransactionReceipt({
        hash: found[0].transactionHash!,
      });
      if (
        dest.status === "success" &&
        dest.to?.toLowerCase() === proxy.toLowerCase()
      )
        destinationLogs = dest.logs;
    }
  }
  const payout = destinationLogs
    .map((l) => ({ log: l, event: decoded(l) }))
    .find(
      ({ log, event }) =>
        log.address.toLowerCase() === r.vault.toLowerCase() &&
        event?.eventName === "PaymentAllocated" &&
        event.args.paymentId === id,
    );
  if (payout?.event?.eventName === "PaymentAllocated") {
    const p = payout.event.args;
    if (
      p.amount !== amount ||
      p.payer.toLowerCase() !== payer.toLowerCase() ||
      p.originLogIndex !== BigInt(a.logIndex) ||
      p.originTxHash !== BigInt(a.transactionHash)
    )
      throw new Error("Callback does not match the origin payment.");
    destinationHash = payout.log.transactionHash;
    version = p.version.toString();
    allocations = destinationLogs.flatMap((l) => {
      const e = decoded(l);
      return l.address.toLowerCase() === r.vault.toLowerCase() &&
        e?.eventName === "AllocationPaid" &&
        e.args.paymentId === id
        ? [{ recipient: e.args.recipient, amount: e.args.amount.toString() }]
        : [];
    });
    if (allocations.reduce((s, a) => s + BigInt(a.amount), 0n) !== amount)
      throw new Error(
        "Allocation receipt does not conserve the incoming amount.",
      );
    // Check actual token transfers in the same authenticated destination receipt, in order.
    const transfers = destinationLogs.flatMap((l) => {
      const e = decoded(l);
      return l.address.toLowerCase() === r.token.toLowerCase() &&
        e?.eventName === "Transfer" &&
        e.args.from.toLowerCase() === r.vault.toLowerCase()
        ? [e.args]
        : [];
    });
    if (
      allocations.length !== transfers.length ||
      allocations.some(
        (a, i) =>
          a.recipient.toLowerCase() !== transfers[i].to.toLowerCase() ||
          BigInt(a.amount) !== transfers[i].value,
      )
    )
      throw new Error("Actual token payouts do not match allocation events.");
  } else if (a.destinationHash !== "0x" + "0".repeat(64))
    throw new Error("No matching allocation in the supplied callback.");
  if (a.reactiveHash !== "0x" + "0".repeat(64)) {
    if ((await reactive.getChainId()) !== 5318007)
      throw new Error("Reactive RPC network mismatch.");
    const rr = await reactive.getTransactionReceipt({ hash: a.reactiveHash });
    const observation = rr.logs.find((l) => {
      const e = decoded(l);
      return (
        l.address.toLowerCase() === rc.toLowerCase() &&
        e?.eventName === "PaymentObserved" &&
        e.args.paymentId === id &&
        e.args.originTxHash === BigInt(a.transactionHash) &&
        e.args.logIndex === BigInt(a.logIndex) &&
        e.args.amount === amount &&
        e.args.payer.toLowerCase() === payer.toLowerCase()
      );
    });
    if (rr.status !== "success" || !observation)
      throw new Error("Reactive execution does not match this payment.");
    reactiveHash = a.reactiveHash;
  }
  return {
    transactionHash: a.transactionHash,
    logIndex: a.logIndex,
    id,
    amount: amount.toString(),
    payer,
    paidAt: Number(block.timestamp),
    status: destinationHash
      ? "Allocation confirmed"
      : "Transfer verified · allocation not observed",
    destinationHash,
    reactiveHash,
    version,
    allocations,
  };
}
export type VerifiedPayment = Awaited<ReturnType<typeof verifyPayment>>;
export async function verifyPassport(value: unknown) {
  const passport = parsePassport(value);
  // Reject tampered envelopes before spending public RPC resources.
  await verifySignatures(passport, passport.request.owner);
  const vault = await verifyVault(passport.request);
  if (vault.owner.toLowerCase() !== passport.request.owner.toLowerCase())
    throw new Error(
      "Vault ownership changed. Ask the current owner for a new request.",
    );
  const payments: VerifiedPayment[] = [];
  const failures: { key: string; error: string }[] = [];
  for (let offset = 0; offset < passport.associations.length; offset += 3) {
    const batch = passport.associations.slice(offset, offset + 3);
    const results = await Promise.allSettled(
      batch.map((a) => verifyPayment(passport.request, a, vault.reactive)),
    );
    results.forEach((result, index) => {
      if (result.status === "fulfilled") payments.push(result.value);
      else
        failures.push({
          key: `${batch[index].transactionHash}:${batch[index].logIndex}`,
          error:
            result.reason instanceof Error
              ? result.reason.message.split("\n")[0].slice(0, 250)
              : "Chain verification unavailable.",
        });
    });
  }
  return {
    verified: true,
    digest: passportDigest(passport),
    owner: vault.owner,
    reactive: vault.reactive,
    payments,
    failures,
    ...totals(
      passport.request.amount,
      payments.map((p) => p.amount),
    ),
    checkedAt: new Date().toISOString(),
  };
}
export type VerifiedPassport = Awaited<ReturnType<typeof verifyPassport>>;
