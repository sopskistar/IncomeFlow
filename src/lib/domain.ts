import {
  formatUnits,
  getAddress,
  isAddress,
  isHash,
  parseUnits,
  type Address,
} from "viem";
export type RuleDraft = { recipient: string; percent: string; label: string };
export type Rule = { recipient: Address; bps: number; label: string };
export function percentageBps(value: string): number | null {
  if (!/^(?:0|[1-9]\d?)(?:\.\d{1,2})?$|^100(?:\.0{1,2})?$/.test(value))
    return null;
  const bps = Number(parseUnits(value, 2));
  return bps > 0 && bps <= 10_000 ? bps : null;
}
export function validateRules(
  rows: RuleDraft[],
  forbidden: string[] = [],
): { rules: Rule[]; errors: string[] } {
  const errors: string[] = [];
  const rules: Rule[] = [];
  const seen = new Set<string>();
  if (rows.length < 2 || rows.length > 8)
    errors.push("Use between 2 and 8 destinations.");
  rows.forEach((r, i) => {
    const name = `Destination ${i + 1}`;
    const bps = percentageBps(r.percent);
    if (!isAddress(r.recipient) || /^0x0{40}$/i.test(r.recipient))
      errors.push(`${name}: enter a valid wallet address.`);
    else if (
      seen.has(r.recipient.toLowerCase()) ||
      forbidden.some((a) => a.toLowerCase() === r.recipient.toLowerCase())
    )
      errors.push(
        `${name}: use a distinct recipient wallet, not the vault, token or callback service.`,
      );
    seen.add(r.recipient.toLowerCase());
    if (bps === null)
      errors.push(`${name}: enter a percentage above 0 with up to 2 decimals.`);
    if (!r.label.trim() || new TextEncoder().encode(r.label.trim()).length > 32)
      errors.push(`${name}: use a category of 1–32 bytes.`);
    if (isAddress(r.recipient) && bps !== null)
      rules.push({
        recipient: getAddress(r.recipient),
        bps,
        label: r.label.trim(),
      });
  });
  if (
    rows.reduce((sum, r) => sum + (percentageBps(r.percent) ?? 0), 0) !== 10_000
  )
    errors.push("Allocation percentages must total exactly 100%.");
  return { rules, errors };
}
export function allocate(amount: bigint, bps: number[]): bigint[] {
  if (
    amount < 0n ||
    bps.length < 2 ||
    bps.some((v) => !Number.isInteger(v) || v <= 0) ||
    bps.reduce((a, b) => a + b, 0) !== 10000
  )
    throw new Error("Invalid allocation");
  let remainder = amount;
  return bps.map((value, i) => {
    const share =
      i === bps.length - 1 ? remainder : (amount * BigInt(value)) / 10000n;
    remainder -= share;
    return share;
  });
}
export const shortAddress = (a: string) =>
  a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
export const amountText = (v: string | bigint, decimals = 6) => {
  const [whole, fraction] = formatUnits(BigInt(v), decimals).split(".");
  return (
    whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
    (fraction ? "." + fraction : "")
  );
};
export function explorer(
  chain: number,
  value: string,
  kind: "tx" | "address" = "tx",
) {
  if (chain !== 84532 && chain !== 5318007)
    throw new Error("Unsupported testnet");
  if (kind === "tx" ? !isHash(value) : !isAddress(value))
    throw new Error("Invalid explorer reference");
  return `${chain === 84532 ? "https://sepolia.basescan.org" : "https://lasna.reactscan.net"}/${kind}/${value}`;
}
