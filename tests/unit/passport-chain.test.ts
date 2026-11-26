import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  encodeEventTopics,
  encodeAbiParameters,
  parseAbi,
  zeroHash,
  keccak256,
  type Hex,
} from "viem";
import manifest from "../../deployments/testnet.json";
import runtime from "../../src/generated/VaultRuntime.json";
import reactiveRuntime from "../../src/generated/ReactiveRuntime.json";
const mocks = vi.hoisted(() => ({
  base: {
    getChainId: vi.fn(),
    getCode: vi.fn(),
    readContract: vi.fn(),
    getTransactionReceipt: vi.fn(),
    getBlock: vi.fn(),
    getBlockNumber: vi.fn(),
    getLogs: vi.fn(),
  },
  reactive: {
    getChainId: vi.fn(),
    getTransactionReceipt: vi.fn(),
    getCode: vi.fn(),
    readContract: vi.fn(),
  },
}));
vi.mock("../../src/lib/contracts", () => ({
  baseClient: mocks.base,
  reactiveClient: mocks.reactive,
  vaultAbi: [],
  reactiveAbi: [],
  proxy: manifest.callbackProxy,
  supportedToken: manifest.token,
}));
import {
  matchesVaultCode,
  verifyPayment,
  verifyVault,
} from "../../src/lib/passport-chain";
import { parseRequest, type Association } from "../../src/lib/passport";
const origin = ("0x" + "1".repeat(64)) as Hex,
  destination = ("0x" + "2".repeat(64)) as Hex,
  rcHash = ("0x" + "3".repeat(64)) as Hex;
const r = parseRequest({
  version: 1,
  id: origin,
  owner: manifest.owner,
  vault: manifest.vault,
  token: manifest.token,
  chainId: 84532,
  title: "Unit test fixture",
  description: "",
  amount: "100000000",
  expectedPayer: manifest.owner,
  issuedAt: 1700000000,
  dueAt: 0,
  validUntil: 0,
});
const a: Association = {
  transactionHash: origin,
  logIndex: 12,
  destinationHash: destination,
  reactiveHash: zeroHash,
  signature: ("0x" + "1".repeat(130)) as Hex,
};
const id = keccak256(
  encodeAbiParameters(
    [
      { type: "uint256" },
      { type: "address" },
      { type: "address" },
      { type: "uint256" },
      { type: "uint256" },
    ],
    [84532n, r.token, r.vault, BigInt(origin), 12n],
  ),
);
const abi = parseAbi([
  "event Transfer(address indexed from,address indexed to,uint256 value)",
  "event PaymentAllocated(bytes32 indexed paymentId,uint256 indexed originTxHash,address indexed payer,uint256 originLogIndex,uint256 amount,uint256 version)",
  "event AllocationPaid(bytes32 indexed paymentId,address indexed recipient,uint256 amount,uint256 ruleIndex)",
]);
function transfer(
  from: string,
  to: string,
  amount: bigint,
  index = 12,
  tx = origin,
) {
  return {
    address: manifest.token,
    transactionHash: tx,
    logIndex: index,
    topics: encodeEventTopics({
      abi,
      eventName: "Transfer",
      args: { from: from as Hex, to: to as Hex },
    }),
    data: encodeAbiParameters([{ type: "uint256" }], [amount]),
  };
}
function fixtures() {
  const receipt = {
    status: "success",
    blockHash: origin,
    blockNumber: 100n,
    logs: [transfer(r.owner, r.vault, 40000000n)],
  };
  const dest = {
    status: "success",
    from: r.owner,
    to: manifest.callbackProxy,
    logs: [
      {
        address: r.vault,
        transactionHash: destination,
        topics: encodeEventTopics({
          abi,
          eventName: "PaymentAllocated",
          args: { paymentId: id, originTxHash: BigInt(origin), payer: r.owner },
        }),
        data: encodeAbiParameters(
          [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }],
          [12n, 40000000n, 1n],
        ),
      },
      {
        address: r.vault,
        transactionHash: destination,
        topics: encodeEventTopics({
          abi,
          eventName: "AllocationPaid",
          args: { paymentId: id, recipient: r.owner },
        }),
        data: encodeAbiParameters(
          [{ type: "uint256" }, { type: "uint256" }],
          [40000000n, 0n],
        ),
      },
      transfer(r.vault, r.owner, 40000000n, 2, destination),
    ],
  };
  return { receipt, dest };
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.base.getBlock.mockResolvedValue({ timestamp: 1700000010n });
});
function setReceipts(f = fixtures()) {
  mocks.base.getTransactionReceipt.mockImplementation(
    async ({ hash }: { hash: Hex }) => (hash === origin ? f.receipt : f.dest),
  );
  return f;
}
describe("chain-backed Passport verification", () => {
  it("recognizes exact runtime with immutable fields masked, and rejects unrelated code", () => {
    expect(matchesVaultCode(runtime.object)).toBe(true);
    expect(matchesVaultCode("0x00")).toBe(false);
    expect(matchesVaultCode(runtime.object.slice(0, -2) + "00")).toBe(false);
  });
  it("checks chain, compiled vault runtime, supported token and callback provider", async () => {
    mocks.reactive.getChainId.mockResolvedValue(5318007);
    mocks.reactive.getCode.mockResolvedValue(reactiveRuntime.object);
    mocks.reactive.readContract.mockImplementation(async ({ functionName }) =>
      functionName === "token" ? r.token : r.vault,
    );
    mocks.base.getChainId.mockResolvedValue(84532);
    mocks.base.getCode.mockResolvedValue(runtime.object);
    mocks.base.readContract.mockImplementation(
      async ({ functionName }) =>
        ({
          owner: r.owner,
          token: r.token,
          _SERVICE_PROVIDER: manifest.callbackProxy,
          _CALLBACK_SENDER: manifest.reactive,
        })[functionName as "owner"],
    );
    await expect(verifyVault(r)).resolves.toEqual({
      owner: r.owner,
      reactive: manifest.reactive,
    });
    mocks.reactive.getCode.mockResolvedValue("0x00");
    await expect(verifyVault(r)).rejects.toThrow("recognized Reactive");
    mocks.reactive.getCode.mockResolvedValue(reactiveRuntime.object);
    mocks.base.getChainId.mockResolvedValue(1);
    await expect(verifyVault(r)).rejects.toThrow("network");
  });
  it("proves origin, authenticated callback, policy, amount conservation and actual token payouts", async () => {
    setReceipts();
    const p = await verifyPayment(r, a, manifest.reactive);
    expect(p.amount).toBe("40000000");
    expect(p.status).toBe("Allocation confirmed");
    expect(p.version).toBe("1");
    expect(p.allocations).toEqual([{ recipient: r.owner, amount: "40000000" }]);
    expect(p.reactiveHash).toBeUndefined();
  });
  it("keeps incoming transfer separate when allocation has not been observed", async () => {
    setReceipts();
    mocks.base.getBlockNumber.mockResolvedValue(110n);
    mocks.base.getLogs.mockResolvedValue([]);
    const p = await verifyPayment(
      r,
      { ...a, destinationHash: zeroHash },
      manifest.reactive,
    );
    expect(p.status).toContain("allocation not observed");
    expect(p.allocations).toEqual([]);
  });
  it("rejects reverted transfers, wrong token, vault, log index and expected payer", async () => {
    for (const change of ["revert", "token", "vault", "index", "payer"]) {
      const f = fixtures();
      if (change === "revert") f.receipt.status = "reverted";
      if (change === "token") f.receipt.logs[0].address = r.vault;
      if (change === "vault")
        f.receipt.logs[0] = transfer(r.owner, r.owner, 40000000n);
      if (change === "index") f.receipt.logs[0].logIndex = 1;
      if (change === "payer")
        f.receipt.logs[0] = transfer(r.vault, r.vault, 40000000n);
      setReceipts(f);
      await expect(verifyPayment(r, a, manifest.reactive)).rejects.toThrow();
    }
  });
  it("rejects payments older than the request", async () => {
    setReceipts();
    mocks.base.getBlock.mockResolvedValue({ timestamp: 1699999999n });
    await expect(verifyPayment(r, a, manifest.reactive)).rejects.toThrow(
      "predates",
    );
  });
  it("rejects fake callback sender, wrong destination and reverted callback", async () => {
    for (const change of ["sender", "vault", "status"]) {
      const f = fixtures();
      if (change === "sender") f.dest.to = r.owner;
      if (change === "vault") f.dest.to = r.owner;
      if (change === "status") f.dest.status = "reverted";
      setReceipts(f);
      await expect(verifyPayment(r, a, manifest.reactive)).rejects.toThrow(
        "provider",
      );
    }
  });
  it("rejects missing payouts, wrong actual amount and mismatched destination proof", async () => {
    for (const change of ["missing", "amount", "unrelated"]) {
      const f = fixtures();
      if (change === "missing") f.dest.logs.splice(1, 1);
      if (change === "amount")
        f.dest.logs[2] = transfer(r.vault, r.owner, 1n, 2, destination);
      if (change === "unrelated") f.dest.logs = [];
      setReceipts(f);
      await expect(verifyPayment(r, a, manifest.reactive)).rejects.toThrow();
    }
  });
  it("rejects uncorrelated or failed Reactive evidence", async () => {
    setReceipts();
    mocks.reactive.getChainId.mockResolvedValue(5318007);
    mocks.reactive.getTransactionReceipt.mockResolvedValue({
      status: "success",
      logs: [],
    });
    await expect(
      verifyPayment(r, { ...a, reactiveHash: rcHash }, manifest.reactive),
    ).rejects.toThrow("Reactive execution");
  });
});
