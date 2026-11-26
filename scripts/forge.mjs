import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const bin =
  process.env.FORGE_BIN ||
  (existsSync(".tools/forge") ? resolve(".tools/forge") : "forge");
const [verb, ...args] = process.argv.slice(2);
const compiler = existsSync(".tools/solc-0.8.29")
  ? ["--use", resolve(".tools/solc-0.8.29")]
  : [];
const result = spawnSync(
  bin,
  [verb, "--root", "contracts", ...(verb === "fmt" ? [] : compiler), ...args],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
