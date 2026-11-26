import {
  createPublicClient,
  defineChain,
  http,
  type Abi,
  type Address,
} from "viem";
import { baseSepolia } from "viem/chains";
import vaultArtifact from "@/generated/IncomeVault.json";
import reactiveArtifact from "@/generated/IncomeFlowReactive.json";
import tokenArtifact from "@/generated/MockIncomeUSD.json";
import manifest from "../../deployments/testnet.json";
export const deployment = manifest;
export const proxy = manifest.callbackProxy as Address;
export const system = manifest.systemContract as Address;
export const supportedToken = manifest.token as Address;
export const demoVault = manifest.vault as Address;
export const demoReactive = manifest.reactive as Address;
export const vaultAbi = vaultArtifact.abi as Abi;
export const reactiveAbi = reactiveArtifact.abi as Abi;
export const tokenAbi = tokenArtifact.abi as Abi;
export const vaultBytecode = vaultArtifact.bytecode as `0x${string}`;
export const reactiveBytecode = reactiveArtifact.bytecode as `0x${string}`;
export const lasna = defineChain({
  id: 5318007,
  name: "Reactive Lasna",
  nativeCurrency: { name: "Lasna REACT", symbol: "lREACT", decimals: 18 },
  rpcUrls: { default: { http: ["https://lasna-rpc.rnk.dev/"] } },
  blockExplorers: {
    default: { name: "Reactscan", url: "https://lasna.reactscan.net" },
  },
  testnet: true,
});
export const baseClient = createPublicClient({
  chain: baseSepolia,
  transport: http(
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org",
    { timeout: 15_000, retryCount: 1 },
  ),
});
export const reactiveClient = createPublicClient({
  chain: lasna,
  transport: http(
    process.env.NEXT_PUBLIC_REACTIVE_LASNA_RPC || "https://lasna-rpc.rnk.dev/",
    { timeout: 15_000, retryCount: 1 },
  ),
});
