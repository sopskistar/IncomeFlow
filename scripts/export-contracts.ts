import { mkdirSync, writeFileSync } from "node:fs";
import { artifact, stringify } from "./config";
mkdirSync("src/generated", { recursive: true });
for (const name of ["IncomeVault", "IncomeFlowReactive", "MockIncomeUSD"]) {
  const a = artifact(name);
  writeFileSync(
    `src/generated/${name}.json`,
    stringify({ abi: a.abi, bytecode: a.bytecode.object }) + "\n",
  );
}
console.log("Exported compiled ABIs and deployment bytecode.");
