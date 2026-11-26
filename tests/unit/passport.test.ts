import { describe, it, expect } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { zeroAddress, zeroHash, type Hex } from "viem";
import {
  parseRequest,
  parsePassport,
  requestTypedData,
  associationTypedData,
  verifySignatures,
  encodePassport,
  decodePassport,
  totals,
  parseArchive,
  PASSPORT_TOKEN,
  type Passport,
} from "../../src/lib/passport";
const account = privateKeyToAccount(
  "0x0000000000000000000000000000000000000000000000000000000000000001",
); // Public test vector; never funded or used live.
const other = privateKeyToAccount(
  "0x0000000000000000000000000000000000000000000000000000000000000002",
);
const request = () =>
  parseRequest({
    version: 1,
    id: "0x" + "1".repeat(64),
    owner: account.address,
    vault: "0x361890c8550548bB5c1A2C40e009470a259cf41E",
    chainId: 84532,
    token: PASSPORT_TOKEN,
    title: "Website design — illustrative",
    description: "",
    amount: "100000000",
    expectedPayer: zeroAddress,
    issuedAt: 1700000000,
    dueAt: 1700001000,
    validUntil: 0,
  });
async function signed(): Promise<Passport> {
  const r = request();
  return {
    version: 1,
    request: r,
    signature: await account.signTypedData(requestTypedData(r)),
    associations: [],
  };
}
describe("Payment Passport trust boundaries", () => {
  it("round trips independent signed UTF-8 links and verifies owner", async () => {
    const p = await signed();
    expect(decodePassport(encodePassport(p))).toEqual(p);
    await expect(verifySignatures(p, account.address)).resolves.toBeUndefined();
  });
  it("rejects text and amount tampering, another signer, and changed owner", async () => {
    const p = await signed();
    await expect(
      verifySignatures(
        { ...p, request: { ...p.request, title: "Other job" } },
        account.address,
      ),
    ).rejects.toThrow("signature");
    await expect(
      verifySignatures(
        { ...p, request: { ...p.request, amount: "1" } },
        account.address,
      ),
    ).rejects.toThrow();
    await expect(verifySignatures(p, other.address)).rejects.toThrow(
      "ownership",
    );
    p.signature = await other.signTypedData(requestTypedData(p.request));
    await expect(verifySignatures(p, account.address)).rejects.toThrow(
      "signature",
    );
  });
  it("binds associations to request and exact log index", async () => {
    const p = await signed();
    const a = {
      transactionHash: ("0x" + "2".repeat(64)) as Hex,
      logIndex: 12,
      destinationHash: zeroHash,
      reactiveHash: zeroHash,
    };
    p.associations = [
      {
        ...a,
        signature: await account.signTypedData(
          associationTypedData(p.request, a),
        ),
      },
    ];
    await verifySignatures(p, account.address);
    p.associations[0].logIndex = 13;
    await expect(verifySignatures(p, account.address)).rejects.toThrow(
      "association",
    );
  });
  it("prevents duplicate logs while permitting separate logs in one transaction", async () => {
    const p = await signed();
    const a = {
      transactionHash: ("0x" + "2".repeat(64)) as Hex,
      logIndex: 12,
      destinationHash: zeroHash,
      reactiveHash: zeroHash,
      signature: p.signature,
    };
    expect(() => parsePassport({ ...p, associations: [a, a] })).toThrow(
      "Duplicate",
    );
    expect(
      parsePassport({ ...p, associations: [a, { ...a, logIndex: 13 }] })
        .associations,
    ).toHaveLength(2);
  });
  it("rejects wrong version, chain, token, vault, amount, unknown fields and control text", () => {
    for (const patch of [
      { version: 2 },
      { chainId: 1 },
      { token: zeroAddress },
      { vault: "invalid" },
      { amount: "1.1" },
      { amount: "0" },
      { amount: "-1" },
      { amount: (2n ** 256n).toString() },
      { title: "\u202eHide" },
      { title: "" },
      { title: "x".repeat(101) },
      { description: "\u0000" },
      { secret: "bad" },
    ])
      expect(() => parseRequest({ ...request(), ...patch })).toThrow();
  });
  it("rejects unsigned drafts, malformed URLs, huge inputs and unrecognized schemas", async () => {
    const p = await signed();
    for (const raw of ["", "%%%", "a".repeat(50001)])
      expect(() => decodePassport(raw)).toThrow();
    expect(() => parsePassport({ ...p, signature: "0x" })).toThrow("signed");
    expect(() => parsePassport({ ...p, extra: true })).toThrow();
  });
  it("rejects invalid dates and verifies expiry and future issue time", async () => {
    const p = await signed();
    expect(() => parseRequest({ ...p.request, dueAt: 1 })).toThrow();
    expect(() =>
      parseRequest({ ...p.request, issuedAt: 999999999999 }),
    ).toThrow();
    await expect(
      verifySignatures(
        { ...p, request: { ...p.request, validUntil: 1700001000 } },
        account.address,
      ),
    ).rejects.toThrow("expired");
    await expect(
      verifySignatures(p, account.address, 1699990000),
    ).rejects.toThrow("future");
  });
  it("uses integer accounting for partial payments, overpayments and smallest units", () => {
    expect(totals("100000000", ["40000000"])).toEqual({
      paid: "40000000",
      outstanding: "60000000",
      overpaid: "0",
    });
    expect(totals("100000000", ["40000000", "60000000"])).toEqual({
      paid: "100000000",
      outstanding: "0",
      overpaid: "0",
    });
    expect(totals("1", ["2"])).toEqual({
      paid: "2",
      outstanding: "0",
      overpaid: "1",
    });
    expect(totals("10000000000000000000001", ["1"])).toEqual({
      paid: "1",
      outstanding: "10000000000000000000000",
      overpaid: "0",
    });
  });
  it("isolates archives by owner and chain and rejects corrupt or double-counted records", async () => {
    const p = await signed(),
      archive = {
        version: 1,
        chainId: 84532,
        owner: account.address,
        passports: [p],
      };
    expect(parseArchive(JSON.stringify(archive), account.address)).toHaveLength(
      1,
    );
    expect(() =>
      parseArchive(JSON.stringify(archive), other.address),
    ).toThrow();
    expect(() =>
      parseArchive(JSON.stringify({ ...archive, chainId: 1 }), account.address),
    ).toThrow();
    expect(() => parseArchive("{", account.address)).toThrow();
    const a = {
      transactionHash: ("0x" + "2".repeat(64)) as Hex,
      logIndex: 0,
      destinationHash: zeroHash,
      reactiveHash: zeroHash,
      signature: p.signature,
    };
    p.associations = [a];
    expect(() =>
      parseArchive(
        JSON.stringify({
          ...archive,
          passports: [
            p,
            { ...p, request: { ...p.request, id: "0x" + "3".repeat(64) } },
          ],
        }),
        account.address,
      ),
    ).toThrow("multiple");
  });
});
