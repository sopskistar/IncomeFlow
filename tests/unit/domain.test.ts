import { describe, it, expect } from "vitest";
import {
  allocate,
  amountText,
  percentageBps,
  validateRules,
  explorer,
} from "../../src/lib/domain";
import { scanLogs } from "../../src/lib/rpc-logs";
const rows = [
  {
    label: "Spending",
    recipient: "0x0000000000000000000000000000000000001001",
    percent: "50",
  },
  {
    label: "Savings",
    recipient: "0x0000000000000000000000000000000000001002",
    percent: "30",
  },
  {
    label: "Tax reserve",
    recipient: "0x0000000000000000000000000000000000001003",
    percent: "20",
  },
];
describe("allocation rules", () => {
  it("validates exact basis points without floating-point rounding", () => {
    expect(percentageBps("33.33")).toBe(3333);
    expect(percentageBps("0.01")).toBe(1);
    expect(percentageBps("100")).toBe(10000);
    for (const v of ["0", "NaN", "1e2", "33.333", "-2", "101", ""])
      expect(percentageBps(v)).toBeNull();
    expect(validateRules(rows).errors).toEqual([]);
  });
  it("rejects duplicate, reserved and invalid recipients and byte-long labels", () => {
    expect(
      validateRules([
        rows[0],
        { ...rows[1], recipient: rows[0].recipient },
        rows[2],
      ]).errors.join(),
    ).toContain("distinct");
    expect(validateRules(rows, [rows[1].recipient]).errors.join()).toContain(
      "distinct",
    );
    expect(
      validateRules([
        { ...rows[0], recipient: "bad" },
        rows[1],
        rows[2],
      ]).errors.join(),
    ).toContain("valid wallet");
    expect(
      validateRules([
        { ...rows[0], label: "🪙".repeat(9) },
        rows[1],
        rows[2],
      ]).errors.join(),
    ).toContain("1–32 bytes");
  });
  it("requires exactly 100% and preserves last-recipient rounding", () => {
    expect(
      validateRules([
        { ...rows[0], percent: "49.99" },
        rows[1],
        rows[2],
      ]).errors.join(),
    ).toContain("exactly");
    expect(allocate(100_000_000n, [5000, 3000, 2000])).toEqual([
      50_000_000n,
      30_000_000n,
      20_000_000n,
    ]);
    expect(allocate(1n, [5000, 3000, 2000])).toEqual([0n, 0n, 1n]);
    expect(() => allocate(1n, [5000, 3000, 1999])).toThrow();
  });
  it("formats fractional amounts without inserting fractional commas", () => {
    expect(amountText("1234567890")).toBe("1,234.56789");
    expect(amountText("2997528636600000", 18)).toBe("0.0029975286366");
  });
});
describe("chain evidence references", () => {
  it("links only supported networks and well-formed hashes", () => {
    expect(explorer(84532, "0x" + "1".repeat(64))).toContain(
      "sepolia.basescan.org/tx/",
    );
    expect(explorer(5318007, rows[0].recipient, "address")).toContain(
      "lasna.reactscan.net/address/",
    );
    expect(() => explorer(1, rows[0].recipient, "address")).toThrow();
    expect(() => explorer(84532, "javascript:alert(1)")).toThrow();
  });
  it("paginates a public RPC history range into at most 200 blocks", async () => {
    const ranges: bigint[][] = [];
    const result = await scanLogs(10n, 410n, async (a, b) => {
      ranges.push([a, b]);
      return [a];
    });
    expect(ranges).toEqual([
      [10n, 209n],
      [210n, 409n],
      [410n, 410n],
    ]);
    expect(result).toHaveLength(3);
    expect(ranges.every(([a, b]) => b - a < 200n)).toBe(true);
  });
  it("propagates RPC failures instead of returning invented empty history", async () => {
    await expect(
      scanLogs(0n, 20n, async () => {
        throw new Error("RPC unavailable");
      }),
    ).rejects.toThrow("RPC unavailable");
  });
});
