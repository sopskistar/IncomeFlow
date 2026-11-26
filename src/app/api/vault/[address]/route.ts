import { NextResponse } from "next/server";
import { isAddress, erc20Abi, parseAbi, type Address } from "viem";
import {
  baseClient as base,
  reactiveClient as reactive,
  vaultAbi,
  reactiveAbi,
  supportedToken,
  proxy,
  system,
  demoVault,
  deployment,
} from "@/lib/contracts";
import { scanLogs } from "@/lib/rpc-logs";
import type { VaultData, Payment, Allocation } from "@/lib/vault-data";
import savedProof from "../../../../../deployments/evidence/m1.json";
export const runtime = "nodejs";
export const maxDuration = 60;
const payerAbi = parseAbi([
  "function debt(address) view returns(uint256)",
  "function reserves(address) view returns(uint256)",
]);
const callbackAbi = parseAbi([
  "function getCallbacks(uint256) view returns ((uint256 blockNumber,address sender,uint256 index,uint256 chainId,uint256 txHash,bytes err)[])",
]);
const observed = parseAbi([
  "event PaymentObserved(bytes32 indexed paymentId,uint256 indexed originTxHash,address indexed payer,uint256 logIndex,uint256 originBlock,uint256 amount)",
])[0];
const paid = parseAbi([
  "event PaymentAllocated(bytes32 indexed paymentId,uint256 indexed originTxHash,address indexed payer,uint256 originLogIndex,uint256 amount,uint256 version)",
])[0];
const allocations = parseAbi([
  "event AllocationPaid(bytes32 indexed paymentId,address indexed recipient,uint256 amount,uint256 ruleIndex)",
])[0];
const hash = (n: bigint) => "0x" + n.toString(16).padStart(64, "0");
const cache = new Map<string, { at: number; data: VaultData }>();
const pending = new Map<string, Promise<NextResponse>>();
export async function GET(
  request: Request,
  context: { params: Promise<{ address: string }> },
) {
  const { address: raw } = await context.params;
  if (!isAddress(raw))
    return NextResponse.json(
      { error: "Enter a valid EVM vault address." },
      { status: 400 },
    );
  const address = raw as Address;
  const url = new URL(request.url);
  const cursor = url.searchParams.get("before");
  if (cursor && !/^\d{1,20}$/.test(cursor))
    return NextResponse.json(
      { error: "Invalid history cursor." },
      { status: 400 },
    );
  const key = raw.toLowerCase() + ":" + (cursor || "latest");
  const fresh = url.searchParams.get("fresh") === "1";
  if (fresh) cache.delete(key);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 20_000)
    return NextResponse.json(hit.data, {
      headers: { "Cache-Control": "no-store" },
    });
  const requestKey = fresh ? key + ":fresh" : key;
  const existing = pending.get(requestKey);
  if (existing) return (await existing).clone();
  const task = readVault(address, cursor, key).finally(() =>
    pending.delete(requestKey),
  );
  pending.set(requestKey, task);
  return (await task).clone();
}

async function readVault(address: Address, cursor: string | null, key: string) {
  try {
    if ((await base.getChainId()) !== 84532)
      throw new Error("Base RPC returned the wrong network.");
    const read = (functionName: string) =>
      base.readContract({ address, abi: vaultAbi, functionName });
    const [
      owner,
      token,
      provider,
      rc,
      paused,
      policyVersion,
      recoveryBlock,
      totalDistributed,
      paymentCount,
      rules,
      balance,
      vaultBalance,
      vaultDebt,
      vaultReserves,
      head,
    ] = await Promise.all([
      read("owner"),
      read("token"),
      read("_SERVICE_PROVIDER"),
      read("_CALLBACK_SENDER"),
      read("paused"),
      read("policyVersion"),
      read("recoveryBlock"),
      read("totalDistributed"),
      read("paymentCount"),
      read("rules"),
      base.readContract({
        address: supportedToken,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      }),
      base.getBalance({ address }),
      base.readContract({
        address: proxy,
        abi: payerAbi,
        functionName: "debt",
        args: [address],
      }),
      base.readContract({
        address: proxy,
        abi: payerAbi,
        functionName: "reserves",
        args: [address],
      }),
      base.getBlockNumber(),
    ]);
    if (
      String(token).toLowerCase() !== supportedToken.toLowerCase() ||
      String(provider).toLowerCase() !== proxy.toLowerCase() ||
      !isAddress(String(rc))
    )
      return NextResponse.json(
        {
          error: "This address is not a supported IncomeFlow test-token vault.",
        },
        { status: 422 },
      );
    const rcAddress = rc as Address;
    const to = cursor ? (BigInt(cursor) < head ? BigInt(cursor) : head) : head;
    const start = BigInt(deployment.baseStartBlock);
    const from = to > 399n && to - 399n > start ? to - 399n : start;
    const [incoming, completed, payouts] = await Promise.all([
      scanLogs(from, to, (fromBlock, toBlock) =>
        base.getLogs({
          address: supportedToken,
          event: erc20Abi.find(
            (x) => x.type === "event" && x.name === "Transfer",
          )!,
          args: { to: address },
          fromBlock,
          toBlock,
        }),
      ),
      scanLogs(from, to, (fromBlock, toBlock) =>
        base.getLogs({ address, event: paid, fromBlock, toBlock }),
      ),
      scanLogs(from, to, (fromBlock, toBlock) =>
        base.getLogs({ address, event: allocations, fromBlock, toBlock }),
      ),
    ]);
    // The verified demo's saved transaction references are re-read from chain, never used as fabricated history.
    if (address.toLowerCase() === demoVault.toLowerCase() && !cursor) {
      const [originReceipt, destReceipt] = await Promise.all([
        base.getTransactionReceipt({
          hash: savedProof.origin.hash as `0x${string}`,
        }),
        base.getTransactionReceipt({
          hash: savedProof.destination.hash as `0x${string}`,
        }),
      ]);
      const { parseEventLogs } = await import("viem");
      for (const l of parseEventLogs({
        abi: erc20Abi,
        eventName: "Transfer",
        logs: originReceipt.logs,
      }))
        if (
          l.address.toLowerCase() === supportedToken.toLowerCase() &&
          l.args.to.toLowerCase() === address.toLowerCase() &&
          !incoming.some(
            (x) =>
              x.transactionHash === l.transactionHash &&
              x.logIndex === l.logIndex,
          )
        )
          incoming.push(l);
      for (const l of parseEventLogs({ abi: [paid], logs: destReceipt.logs }))
        if (
          !completed.some(
            (x) =>
              x.transactionHash === l.transactionHash &&
              x.logIndex === l.logIndex,
          )
        )
          completed.push(l);
      for (const l of parseEventLogs({
        abi: [allocations],
        logs: destReceipt.logs,
      }))
        if (
          !payouts.some(
            (x) =>
              x.transactionHash === l.transactionHash &&
              x.logIndex === l.logIndex,
          )
        )
          payouts.push(l);
    }
    const health: VaultData["health"] = {
      vaultBalance: String(vaultBalance),
      vaultDebt: String(vaultDebt),
      vaultReserves: String(vaultReserves),
    };
    const observations = new Map<string, string>();
    try {
      if ((await reactive.getChainId()) !== 5318007)
        throw new Error("Wrong Lasna network");
      const [native, debt, reserves, subscribed, rHead] = await Promise.all([
        reactive.getBalance({ address: rcAddress }),
        reactive.readContract({
          address: system,
          abi: payerAbi,
          functionName: "debt",
          args: [rcAddress],
        }),
        reactive.readContract({
          address: system,
          abi: payerAbi,
          functionName: "reserves",
          args: [rcAddress],
        }),
        reactive.readContract({
          address: rcAddress,
          abi: reactiveAbi,
          functionName: "subscribed",
        }),
        reactive.getBlockNumber(),
      ]);
      Object.assign(health, {
        reactiveBalance: String(native),
        reactiveDebt: String(debt),
        reactiveReserves: String(reserves),
        subscribed: Boolean(subscribed),
      });
      const logs = await reactive.getLogs({
        address: rcAddress,
        event: observed,
        fromBlock: rHead > 2000n ? rHead - 2000n : 0n,
        toBlock: rHead,
      });
      for (const l of logs)
        observations.set(
          `${l.args.originTxHash}:${l.args.logIndex}`,
          l.transactionHash!,
        );
      if (address.toLowerCase() === demoVault.toLowerCase()) {
        const r = await reactive.getTransactionReceipt({
          hash: savedProof.reactiveExecution.hash as `0x${string}`,
        });
        if (r.status === "success")
          observations.set(
            `${BigInt(savedProof.origin.hash)}:${savedProof.origin.transferLogIndex}`,
            r.transactionHash,
          );
      }
    } catch {
      health.error =
        "Lasna RPC could not be synchronized. Reactive stages and fee health are unavailable.";
    }
    const payments: Payment[] = await Promise.all(
      incoming.map(async (l) => {
        const tx = l.transactionHash!;
        const index = l.logIndex!;
        const source = BigInt(tx);
        const done = completed.find(
          (p) =>
            p.args.originTxHash === source &&
            p.args.originLogIndex === BigInt(index),
        );
        const id = (done?.args.paymentId ||
          (await base.readContract({
            address,
            abi: vaultAbi,
            functionName: "paymentId",
            args: [source, BigInt(index)],
          }))) as string;
        const parts: Allocation[] = payouts
          .filter((p) => p.args.paymentId === id)
          .map((p) => ({
            recipient: p.args.recipient!,
            amount: String(p.args.amount),
            ruleIndex: Number(p.args.ruleIndex),
          }));
        const reactiveHash = observations.get(`${source}:${index}`);
        let callbackFailure: string | undefined;
        let failedDestination: string | undefined;
        if (!done && reactiveHash) {
          try {
            const deliveries = await reactive.readContract({
              address: system,
              abi: callbackAbi,
              functionName: "getCallbacks",
              args: [BigInt(reactiveHash)],
            });
            const failed = deliveries.find(
              (d) =>
                d.sender.toLowerCase() === rcAddress.toLowerCase() &&
                d.chainId === 84532n &&
                d.err !== "0x",
            );
            if (failed) {
              callbackFailure = `The callback service recorded a failed allocation (${failed.err.slice(0, 10)}). Check pause state, rules, balances and fee funding, then retry this payment ID.`;
              if (failed.txHash !== 0n) failedDestination = hash(failed.txHash);
            }
          } catch {
            /* Missing delivery records do not prove failure or success. */
          }
        }
        const recovered =
          BigInt(l.blockNumber!) <= BigInt(recoveryBlock as bigint);
        const needsFunding =
          vaultDebt > 0n ||
          (health.reactiveDebt !== undefined &&
            BigInt(health.reactiveDebt) > 0n);
        return {
          id,
          originHash: tx,
          logIndex: index,
          block: String(l.blockNumber),
          amount: String(l.args.value),
          payer: l.args.from!,
          status: done
            ? "Distribution confirmed"
            : recovered
              ? "Recovered"
              : callbackFailure
                ? "Failed"
                : needsFunding
                  ? "Awaiting funding"
                  : reactiveHash
                    ? "Callback requested"
                    : "Payment detected",
          reactiveHash,
          destinationHash: done?.transactionHash || failedDestination,
          failure: callbackFailure,
          version: done ? String(done.args.version) : undefined,
          allocations: parts,
        };
      }),
    );
    // Include distributions whose original deposit falls outside this page's history window.
    for (const done of completed)
      if (!payments.some((p) => p.id === done.args.paymentId))
        payments.push({
          id: done.args.paymentId!,
          originHash: hash(done.args.originTxHash!),
          logIndex: Number(done.args.originLogIndex),
          block: String(done.blockNumber),
          amount: String(done.args.amount),
          payer: done.args.payer!,
          status: "Distribution confirmed",
          destinationHash: done.transactionHash!,
          version: String(done.args.version),
          allocations: payouts
            .filter((p) => p.args.paymentId === done.args.paymentId)
            .map((p) => ({
              recipient: p.args.recipient!,
              amount: String(p.args.amount),
              ruleIndex: Number(p.args.ruleIndex),
            })),
        });
    const data: VaultData = {
      address,
      owner: String(owner),
      reactive: rcAddress,
      token: String(token),
      paused: Boolean(paused),
      policyVersion: String(policyVersion),
      recoveryBlock: String(recoveryBlock),
      balance: String(balance),
      totalDistributed: String(totalDistributed),
      paymentCount: String(paymentCount),
      rules: (rules as { recipient: string; bps: number; label: string }[]).map(
        (r) => ({ ...r, bps: Number(r.bps) }),
      ),
      health,
      payments: payments.sort((a, b) =>
        BigInt(a.block) > BigInt(b.block) ? -1 : 1,
      ),
      history: {
        from: String(from),
        to: String(to),
        nextBefore: from > start ? String(from - 1n) : null,
        partial: from > start,
      },
      checkedAt: new Date().toISOString(),
    };
    if (cache.size > 100) cache.clear();
    cache.set(key, { at: Date.now(), data });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Chain data could not be synchronized. Check the vault address and RPC connectivity, then refresh. No balances or transaction states have been inferred.",
      },
      { status: 503 },
    );
  }
}
