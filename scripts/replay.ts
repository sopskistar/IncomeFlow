import { readFileSync, writeFileSync } from "node:fs";
import { parseEventLogs, erc20Abi, parseAbi, type Abi, type Hash } from "viem";
import {
  artifact,
  base,
  reactive,
  system,
  callbackAbi,
  send,
  loadManifest,
  saveManifest,
  stringify,
} from "./config";
import { scanLogs } from "../src/lib/rpc-logs";
async function main() {
  const m = loadManifest();
  if (!m.token || !m.vault || !m.reactive || !m.recipients)
    throw new Error("No deployment");
  const path = "deployments/evidence/m1.json";
  const proof = JSON.parse(readFileSync(path, "utf8"));
  if (proof.replay?.status === "live-replay-confirmed") {
    console.log("Replay already verified; no additional request sent.");
    return;
  }
  const abi = artifact("IncomeVault").abi as Abi;
  const balances = () =>
    Promise.all(
      m.recipients!.map((address) =>
        base.readContract({
          address: m.token!,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        }),
      ),
    );
  const before = await balances();
  let tx = proof.replay?.requestHash as Hash | undefined;
  if (!tx) {
    const last = (await reactive.readContract({
      address: m.reactive,
      abi: artifact("IncomeFlowReactive").abi,
      functionName: "lastRequestedAt",
      args: [proof.paymentId],
    })) as bigint;
    const block = await reactive.getBlock();
    if (block.timestamp < last + 60n)
      throw new Error(
        `Retry cooldown active until ${last + 60n}; no request sent.`,
      );
    tx = send(reactive.transport.url!, m.reactive, "retry(bytes32)", [
      proof.paymentId,
    ]).transactionHash;
    proof.replay = {
      status: "request-confirmed-delivery-pending",
      requestHash: tx,
      before,
    };
    writeFileSync(path, stringify(proof) + "\n");
  }
  const end = Date.now() + 120_000;
  while (Date.now() < end) {
    const records = await reactive.readContract({
      address: system,
      abi: callbackAbi,
      functionName: "getCallbacks",
      args: [BigInt(tx!)],
    });
    const record = records.find(
      (r) =>
        r.sender.toLowerCase() === m.reactive!.toLowerCase() &&
        r.chainId === 84532n &&
        r.txHash !== 0n,
    );
    const head = await base.getBlockNumber();
    const duplicateEvent = parseAbi([
      "event DuplicateIgnored(bytes32 indexed paymentId)",
    ])[0];
    const events = record
      ? []
      : await scanLogs(head - 2000n, head, (fromBlock, toBlock) =>
          base.getLogs({
            address: m.vault!,
            event: duplicateEvent,
            args: { paymentId: proof.paymentId },
            fromBlock,
            toBlock,
          }),
        );
    const hash = record
      ? (("0x" + record.txHash.toString(16).padStart(64, "0")) as Hash)
      : events[0]?.transactionHash;
    if (hash) {
      if (record && record.err !== "0x")
        throw new Error(`Replay callback failed: ${record.err}`);
      const receipt = await base.getTransactionReceipt({ hash });
      const duplicates = parseEventLogs({
        abi: parseAbi(["event DuplicateIgnored(bytes32 indexed paymentId)"]),
        logs: receipt.logs,
      });
      const transfers = parseEventLogs({
        abi: erc20Abi,
        eventName: "Transfer",
        logs: receipt.logs,
      }).filter((l) => l.address.toLowerCase() === m.token!.toLowerCase());
      const after = await balances();
      if (
        receipt.status !== "success" ||
        duplicates.length !== 1 ||
        duplicates[0].args.paymentId !== proof.paymentId ||
        transfers.length !== 0 ||
        after.some((a, i) => a !== BigInt(proof.replay.before[i]))
      )
        throw new Error("Replay safety verification failed");
      const count = await base.readContract({
        address: m.vault,
        abi,
        functionName: "paymentCount",
      });
      proof.replay = {
        status: "live-replay-confirmed",
        requestHash: tx,
        destinationHash: hash,
        before: proof.replay.before,
        after,
        paymentCount: count,
        delivery: record || {
          status: "getCallbacks-record-not-yet-available",
          correlation:
            "Authenticated DuplicateIgnored event with identical payment ID; destination receipt independently verified.",
        },
      };
      writeFileSync(path, stringify(proof) + "\n");
      writeFileSync(
        "deployments/evidence/replay-receipt.json",
        stringify(receipt) + "\n",
      );
      m.status = "verified";
      saveManifest(m);
      console.log(
        "Live duplicate callback ignored with zero additional token transfers.",
        stringify(proof.replay),
      );
      return;
    }
    console.log("Replay delivery pending", tx);
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(
    "Replay delivery not observed; saved request may be resumed without paying again.",
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
