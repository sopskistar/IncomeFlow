import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createPublicClient, defineChain, http, parseAbi, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';

export const lasna = defineChain({ id: 5318007, name: 'Reactive Lasna', nativeCurrency: { name: 'Lasna REACT', symbol: 'lREACT', decimals: 18 }, rpcUrls: { default: { http: ['https://lasna-rpc.rnk.dev/'] } }, blockExplorers: { default: { name: 'Reactscan', url: 'https://lasna.reactscan.net' } }, testnet: true });
export const base = createPublicClient({ chain: baseSepolia, transport: http(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org', { timeout: 20_000, retryCount: 1 }) });
export const reactive = createPublicClient({ chain: lasna, transport: http(process.env.REACTIVE_LASNA_RPC || lasna.rpcUrls.default.http[0], { timeout: 20_000, retryCount: 1 }) });
export const proxy = '0x476F44b11F5C942c58f4c8E3d0300E5710743585' as const;
export const system = '0x8888888888888888888888888888888888888888' as const;
export const payerAbi = parseAbi(['function debt(address) view returns (uint256)', 'function reserves(address) view returns (uint256)', 'function depositTo(address) payable']);
export const callbackAbi = parseAbi(['function getCallbacks(uint256) view returns ((uint256 blockNumber,address sender,uint256 index,uint256 chainId,uint256 txHash,bytes err)[])']);
export const stringify = (v: unknown) => JSON.stringify(v, (_, value) => typeof value === 'bigint' ? value.toString() : value, 2);
export const manifestPath = resolve('deployments/testnet.json');
export type Manifest = { status: string; baseChainId: number; reactiveChainId: number; callbackProxy: Address; systemContract: Address; token: Address | null; reactive: Address | null; vault: Address | null; baseStartBlock: string; reactiveStartBlock: string; transactions: Record<string, string>; proof: string | null; recipients?: Address[]; owner?: Address };
export const loadManifest = () => JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
export const saveManifest = (m: Manifest) => writeFileSync(manifestPath, stringify(m) + '\n');
export function artifact(name: string) { return JSON.parse(readFileSync(`contracts/out/${name}.sol/${name}.json`, 'utf8')); }
export function binary(name: 'forge' | 'cast') { return process.env[name === 'forge' ? 'FORGE_BIN' : 'CAST_BIN'] || (existsSync(`.tools/${name}`) ? resolve(`.tools/${name}`) : name); }
export function keyArgs() {
  const key = resolve(process.env.DEPLOY_KEYSTORE || '.secrets/deployer');
  const pass = resolve(process.env.DEPLOY_PASSWORD_FILE || '.secrets/password');
  if (!existsSync(key) || !existsSync(pass)) throw new Error('Encrypted testnet keystore/password file missing. See docs/DEPLOYMENT.md.');
  return ['--keystore', key, '--password-file', pass];
}
export function ownerAddress(): Address { return execFileSync(binary('cast'), ['wallet', 'address', ...keyArgs()], { encoding: 'utf8' }).trim() as Address; }
export function send(rpc: string, target: Address, signature?: string, args: string[] = [], value?: string) {
  const out = execFileSync(binary('cast'), ['send', '--rpc-url', rpc, ...keyArgs(), '--json', target, ...(signature ? [signature, ...args] : []), ...(value ? ['--value', value] : [])], { encoding: 'utf8', timeout: 180_000, maxBuffer: 4 * 1024 * 1024 });
  const receipt = JSON.parse(out);
  if (!['0x1', '1', 1].includes(receipt.status)) throw new Error(`Transaction failed: ${receipt.transactionHash}`);
  return receipt;
}
export async function prerequisites() {
  const ids = await Promise.all([base.getChainId(), reactive.getChainId()]);
  if (ids[0] !== 84532 || ids[1] !== 5318007) throw new Error(`Wrong RPC chains: ${ids.join(',')}. Testnets only.`);
  const code = await Promise.all([base.getCode({ address: proxy }), reactive.getCode({ address: system })]);
  if (code.some(c => !c || c === '0x')) throw new Error('Official proxy/system has no code at this RPC. Stop deployment.');
  return ids;
}
