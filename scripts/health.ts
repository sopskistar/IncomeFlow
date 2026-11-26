import {
  base,
  reactive,
  payerAbi,
  system,
  proxy,
  loadManifest,
  prerequisites,
  stringify,
} from "./config";
import { formatEther, type Address } from "viem";
async function main() {
  await prerequisites();
  const m = loadManifest();
  const rows: Record<string, unknown> = {
    checkedAt: new Date().toISOString(),
    chains: [84532, 5318007],
    deployment: m.status,
  };
  if (m.owner)
    rows.deployer = {
      address: m.owner,
      baseETH: formatEther(await base.getBalance({ address: m.owner })),
      lasnaREACT: formatEther(await reactive.getBalance({ address: m.owner })),
    };
  for (const [name, client, service, target] of [
    ["vault", base, proxy, m.vault],
    ["reactive", reactive, system, m.reactive],
  ] as const) {
    if (!target) {
      rows[name] = { status: "not-deployed" };
      continue;
    }
    const address = target as Address;
    const [code, balance, debt, reserves] = await Promise.all([
      client.getCode({ address }),
      client.getBalance({ address }),
      client.readContract({
        address: service,
        abi: payerAbi,
        functionName: "debt",
        args: [address],
      }),
      client.readContract({
        address: service,
        abi: payerAbi,
        functionName: "reserves",
        args: [address],
      }),
    ]);
    rows[name] = {
      address,
      hasCode: !!code && code !== "0x",
      balance: formatEther(balance),
      debt: formatEther(debt),
      reserves: formatEther(reserves),
      status:
        debt > 0n
          ? "awaiting-funding"
          : balance + reserves === 0n
            ? "unfunded"
            : "funded-not-proof-of-delivery",
    };
  }
  if (m.reactive) {
    try {
      rows.subscriptions = await reactive.request({
        method: "rnk_getFilters" as never,
        params: [] as never,
      });
    } catch {
      rows.subscriptions =
        "Filter RPC unavailable; inspect Reactscan or Reactive MCP.";
    }
  }
  console.log(stringify(rows));
}
main().catch(() => {
  console.error(
    "Health check failed. Verify RPC connectivity and contract metadata; no healthy state inferred.",
  );
  process.exitCode = 1;
});
