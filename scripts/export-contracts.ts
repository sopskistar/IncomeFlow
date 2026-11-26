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
const vault = artifact("IncomeVault");
writeFileSync(
  "src/generated/VaultRuntime.json",
  stringify({
    object: vault.deployedBytecode.object,
    immutableReferences: vault.deployedBytecode.immutableReferences,
  }) + "\n",
);

const reactiveRuntime = artifact("IncomeFlowReactive");
writeFileSync(
  "src/generated/ReactiveRuntime.json",
  stringify({
    object: reactiveRuntime.deployedBytecode.object,
    immutableReferences: reactiveRuntime.deployedBytecode.immutableReferences,
  }) + "\n",
);
