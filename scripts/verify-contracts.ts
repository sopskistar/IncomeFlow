import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { loadManifest, binary, stringify, proxy } from "./config";
const m = loadManifest();
const contracts = [
  { name: "MockIncomeUSD", address: m.token, chain: 84532, args: "0x" },
  {
    name: "IncomeFlowReactive",
    address: m.reactive,
    chain: 5318007,
    args:
      m.owner && m.token
        ? encodeAbiParameters(parseAbiParameters("address,address"), [
            m.owner,
            m.token,
          ])
        : "0x",
  },
  {
    name: "IncomeVault",
    address: m.vault,
    chain: 84532,
    args:
      m.owner && m.token && m.reactive
        ? encodeAbiParameters(
            parseAbiParameters("address,address,address,address"),
            [m.owner, m.token, proxy, m.reactive],
          )
        : "0x",
  },
];
const results = [];
for (const c of contracts) {
  if (!c.address) continue;
  try {
    const output = execFileSync(
      binary("forge"),
      [
        "verify-contract",
        "--root",
        "contracts",
        "--chain-id",
        String(c.chain),
        "--verifier",
        "sourcify",
        "--compiler-version",
        "v0.8.29+commit.ab55807c",
        "--constructor-args",
        c.args,
        "--watch",
        c.address,
        `src/${c.name}.sol:${c.name}`,
      ],
      { encoding: "utf8", timeout: 120_000, stdio: ["ignore", "pipe", "pipe"] },
    );
    console.log(c.name, output.trim());
    results.push({ ...c, status: "verification-command-succeeded", output });
  } catch (e) {
    const err = e as { stdout?: Buffer; stderr?: Buffer };
    const output = String(err.stdout || "") + String(err.stderr || "");
    console.log(c.name, "verification not confirmed:", output.slice(0, 800));
    results.push({ ...c, status: "unverified", output: output.slice(0, 3000) });
  }
}
writeFileSync(
  "deployments/verification.json",
  stringify({ checkedAt: new Date().toISOString(), contracts: results }) + "\n",
);
