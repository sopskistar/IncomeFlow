import {
  getAddress,
  isAddress,
  isHash,
  hashTypedData,
  keccak256,
  stringToHex,
  recoverTypedDataAddress,
  zeroAddress,
  zeroHash,
  type Address,
  type Hex,
} from "viem";
import manifest from "../../deployments/testnet.json";

export const PASSPORT_CHAIN = 84532;
export const PASSPORT_TOKEN = manifest.token as Address;
export type PaymentRequest = {
  version: 1;
  id: Hex;
  owner: Address;
  vault: Address;
  token: Address;
  chainId: 84532;
  title: string;
  description: string;
  amount: string;
  expectedPayer: Address;
  issuedAt: number;
  dueAt: number;
  validUntil: number;
};
export type Association = {
  transactionHash: Hex;
  logIndex: number;
  destinationHash: Hex;
  reactiveHash: Hex;
  signature: Hex;
};
export type Passport = {
  version: 1;
  request: PaymentRequest;
  signature: Hex;
  associations: Association[];
};
const text = (v: unknown, max: number, required = false): string => {
  if (
    typeof v !== "string" ||
    v.length > max ||
    (required && !v.trim()) ||
    /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(v)
  )
    throw new Error(
      "Invalid request text. Remove control characters and check field lengths.",
    );
  return v;
};
function object(v: unknown, keys: string[]) {
  if (
    !v ||
    typeof v !== "object" ||
    Array.isArray(v) ||
    Object.keys(v).some((k) => !keys.includes(k)) ||
    keys.some((k) => !(k in v))
  )
    throw new Error("Unrecognized or incomplete Passport schema.");
  return v as Record<string, unknown>;
}
function address(v: unknown, allowZero = false): Address {
  if (
    typeof v !== "string" ||
    !isAddress(v) ||
    (!allowZero && v.toLowerCase() === zeroAddress)
  )
    throw new Error("Invalid request address.");
  return getAddress(v);
}
function hash(v: unknown): Hex {
  if (typeof v !== "string" || !isHash(v))
    throw new Error("Invalid transaction or request identifier.");
  return v;
}
function integer(v: unknown, max = 4102444800): number {
  if (typeof v !== "number" || !Number.isSafeInteger(v) || v < 0 || v > max)
    throw new Error("Invalid date or log index.");
  return v;
}
function signature(v: unknown): Hex {
  if (typeof v !== "string" || !/^0x[0-9a-f]{130}$/i.test(v))
    throw new Error(
      "A signed request is required. Unsigned drafts are not verified.",
    );
  return v as Hex;
}
export function parseRequest(value: unknown): PaymentRequest {
  const r = object(value, [
    "version",
    "id",
    "owner",
    "vault",
    "token",
    "chainId",
    "title",
    "description",
    "amount",
    "expectedPayer",
    "issuedAt",
    "dueAt",
    "validUntil",
  ]);
  if (r.version !== 1 || r.chainId !== PASSPORT_CHAIN)
    throw new Error("Unsupported request version or chain. Use Base Sepolia.");
  if (
    typeof r.amount !== "string" ||
    !/^[1-9]\d{0,77}$/.test(r.amount) ||
    BigInt(r.amount) > 2n ** 256n - 1n
  )
    throw new Error("Amount must be a positive exact token amount.");
  const token = address(r.token);
  if (token.toLowerCase() !== PASSPORT_TOKEN.toLowerCase())
    throw new Error("Unsupported token. Only test ifUSD is accepted.");
  const issuedAt = integer(r.issuedAt),
    dueAt = integer(r.dueAt),
    validUntil = integer(r.validUntil);
  if (
    issuedAt === 0 ||
    (dueAt !== 0 && dueAt < issuedAt) ||
    (validUntil !== 0 && validUntil < issuedAt)
  )
    throw new Error("Due date and expiry must follow the issue date.");
  const id = hash(r.id);
  if (id === zeroHash) throw new Error("Request identifier cannot be zero.");
  return {
    version: 1,
    id,
    owner: address(r.owner),
    vault: address(r.vault),
    token,
    chainId: 84532,
    title: text(r.title, 100, true),
    description: text(r.description, 500),
    amount: r.amount,
    expectedPayer: address(r.expectedPayer, true),
    issuedAt,
    dueAt,
    validUntil,
  };
}
export function parsePassport(value: unknown): Passport {
  const e = object(value, ["version", "request", "signature", "associations"]);
  if (
    e.version !== 1 ||
    !Array.isArray(e.associations) ||
    e.associations.length > 20
  )
    throw new Error("Unsupported Passport or more than 20 payments.");
  const associations = e.associations.map((value) => {
    const a = object(value, [
      "transactionHash",
      "logIndex",
      "destinationHash",
      "reactiveHash",
      "signature",
    ]);
    return {
      transactionHash: hash(a.transactionHash),
      logIndex: integer(a.logIndex, 1000000),
      destinationHash: hash(a.destinationHash),
      reactiveHash: hash(a.reactiveHash),
      signature: signature(a.signature),
    };
  });
  const keys = associations.map(paymentKey);
  if (new Set(keys).size !== keys.length)
    throw new Error("Duplicate payment references are not allowed.");
  return {
    version: 1,
    request: parseRequest(e.request),
    signature: signature(e.signature),
    associations,
  };
}
const requestTypes = {
  PaymentRequest: [
    { name: "id", type: "bytes32" },
    { name: "owner", type: "address" },
    { name: "vault", type: "address" },
    { name: "token", type: "address" },
    { name: "title", type: "string" },
    { name: "description", type: "string" },
    { name: "amount", type: "uint256" },
    { name: "expectedPayer", type: "address" },
    { name: "issuedAt", type: "uint48" },
    { name: "dueAt", type: "uint48" },
    { name: "validUntil", type: "uint48" },
  ],
} as const;
export function requestTypedData(r: PaymentRequest) {
  return {
    domain: {
      name: "IncomeFlow Payment Passport",
      version: "1",
      chainId: 84532,
      verifyingContract: r.vault,
    },
    types: requestTypes,
    primaryType: "PaymentRequest" as const,
    message: {
      id: r.id,
      owner: r.owner,
      vault: r.vault,
      token: r.token,
      title: r.title,
      description: r.description,
      amount: BigInt(r.amount),
      expectedPayer: r.expectedPayer,
      issuedAt: r.issuedAt,
      dueAt: r.dueAt,
      validUntil: r.validUntil,
    },
  };
}
export function requestDigest(r: PaymentRequest) {
  return hashTypedData(requestTypedData(r));
}
export function associationTypedData(
  r: PaymentRequest,
  a: Omit<Association, "signature">,
) {
  return {
    domain: requestTypedData(r).domain,
    types: {
      PaymentAssociation: [
        { name: "requestDigest", type: "bytes32" },
        { name: "transactionHash", type: "bytes32" },
        { name: "logIndex", type: "uint256" },
        { name: "destinationHash", type: "bytes32" },
        { name: "reactiveHash", type: "bytes32" },
      ],
    },
    primaryType: "PaymentAssociation" as const,
    message: {
      requestDigest: requestDigest(r),
      transactionHash: a.transactionHash,
      logIndex: BigInt(a.logIndex),
      destinationHash: a.destinationHash,
      reactiveHash: a.reactiveHash,
    },
  };
}
export async function verifySignatures(
  passport: Passport,
  currentOwner: string,
  now = Math.floor(Date.now() / 1000),
) {
  const r = passport.request;
  if (r.issuedAt > now + 300 || (r.validUntil !== 0 && now > r.validUntil))
    throw new Error("Request is future-dated or expired.");
  if (currentOwner.toLowerCase() !== r.owner.toLowerCase())
    throw new Error(
      "Vault ownership changed. Ask the current owner for a new request.",
    );
  const signer = await recoverTypedDataAddress({
    ...requestTypedData(r),
    signature: passport.signature,
  });
  if (signer.toLowerCase() !== currentOwner.toLowerCase())
    throw new Error("Invalid or tampered request signature.");
  for (const a of passport.associations) {
    const signer = await recoverTypedDataAddress({
      ...associationTypedData(r, a),
      signature: a.signature,
    });
    if (signer.toLowerCase() !== currentOwner.toLowerCase())
      throw new Error("Invalid payment-association signature.");
  }
}
export const paymentKey = (
  a: Pick<Association, "transactionHash" | "logIndex">,
) => `${a.transactionHash.toLowerCase()}:${a.logIndex}`;
export function totals(requested: string, amounts: string[]) {
  const paid = amounts.reduce((sum, a) => sum + BigInt(a), 0n),
    remaining = BigInt(requested) - paid;
  return {
    paid: paid.toString(),
    outstanding: (remaining > 0n ? remaining : 0n).toString(),
    overpaid: (remaining < 0n ? -remaining : 0n).toString(),
  };
}
export function encodePassport(p: Passport) {
  const bytes = new TextEncoder().encode(JSON.stringify(parsePassport(p)));
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}
export function decodePassport(encoded: string): Passport {
  if (!encoded || encoded.length > 50000 || !/^[A-Za-z0-9_-]+$/.test(encoded))
    throw new Error("Malformed or oversized request link.");
  try {
    return parsePassport(
      JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(
          Uint8Array.from(
            atob(encoded.replaceAll("-", "+").replaceAll("_", "/")),
            (c) => c.charCodeAt(0),
          ),
        ),
      ),
    );
  } catch (e) {
    throw new Error(
      e instanceof SyntaxError || e instanceof TypeError
        ? "Malformed request link. Ask the owner for a fresh signed link."
        : e instanceof Error
          ? e.message
          : "Invalid request link.",
    );
  }
}
export function storageKey(owner: string) {
  return `incomeflow:passport:1:84532:${getAddress(owner).toLowerCase()}`;
}
export function parseArchive(raw: string, owner: string): Passport[] {
  if (raw.length > 2_000_000) throw new Error("Archive is too large.");
  const value = JSON.parse(raw);
  if (
    !value ||
    value.version !== 1 ||
    value.chainId !== 84532 ||
    typeof value.owner !== "string" ||
    value.owner.toLowerCase() !== owner.toLowerCase() ||
    !Array.isArray(value.passports) ||
    value.passports.length > 100
  )
    throw new Error("Archive belongs to another owner, chain or version.");
  const passports = value.passports.map(parsePassport) as Passport[];
  if (
    passports.some(
      (p) => p.request.owner.toLowerCase() !== owner.toLowerCase(),
    ) ||
    new Set(passports.map((p) => p.request.id.toLowerCase())).size !==
      passports.length
  )
    throw new Error("Archive owner mismatch or duplicate requests.");
  const seen = new Set<string>();
  for (const p of passports)
    for (const a of p.associations) {
      const key = `${p.request.vault.toLowerCase()}:${paymentKey(a)}`;
      if (seen.has(key))
        throw new Error(
          "A payment cannot be counted against multiple local requests.",
        );
      seen.add(key);
    }
  return passports;
}

/** Fingerprints both the request and its exact signed association set. */
export function passportDigest(p: Passport) {
  return keccak256(stringToHex(JSON.stringify(parsePassport(p))));
}
