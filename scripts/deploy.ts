import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { parseEther, type Address } from 'viem';
import { artifact, base, reactive, binary, keyArgs, ownerAddress, send, prerequisites, loadManifest, saveManifest, proxy } from './config';

async function main() {
  await prerequisites();
  const m = loadManifest(); const owner = ownerAddress(); m.owner = owner; saveManifest(m);
  const baseRpc = base.transport.url!; const reactiveRpc = reactive.transport.url!;
  const balances = await Promise.all([base.getBalance({ address: owner }), reactive.getBalance({ address: owner })]);
  console.log('Testnet deployer', owner, 'Base wei', balances[0].toString(), 'Lasna wei', balances[1].toString());
  if (balances[0] < parseEther('0.008')) throw new Error('Fund deployer with Base Sepolia ETH before deployment.');
  if (balances[1] < parseEther('0.5')) {
    if (m.transactions.lasnaFaucet) throw new Error(`Faucet already requested in ${m.transactions.lasnaFaucet}; wait/diagnose delivery instead of paying twice.`);
    if (process.argv.includes('--faucet') && balances[0] > parseEther('0.03')) {
      const r = send(baseRpc, '0x2afaFD298b23b62760711756088F75B7409f5967', 'request(address)', [owner], '0.02ether');
      m.transactions.lasnaFaucet = r.transactionHash; saveManifest(m);
      console.log('Faucet request confirmed', r.transactionHash, 'Wait for Lasna funding, then rerun without --faucet.'); return;
    }
    throw new Error('Fund deployer with Lasna lREACT, or use --faucet with enough Base Sepolia ETH.');
  }
  function deploy(name: string, rpc: string, args: string[], value?: string) {
    const localSolc = existsSync('.tools/solc-0.8.29') ? ['--use', resolve('.tools/solc-0.8.29')] : [];
    // Arguments contain keystore paths, never a private key or password value.
    const out = execFileSync(binary('forge'), ['create', '--root', 'contracts', ...localSolc, `src/${name}.sol:${name}`, '--broadcast', '--rpc-url', rpc, ...keyArgs(), '--json', ...(value ? ['--value', value] : []), ...(args.length ? ['--constructor-args', ...args] : [])], { encoding: 'utf8', timeout: 180_000, maxBuffer: 4 * 1024 * 1024 });
    const start = out.indexOf('{'); const result = JSON.parse(out.slice(start));
    if (!result.deployedTo || !result.transactionHash) throw new Error(`Unrecognized deployment output for ${name}; inspect receipts before retrying.`);
    console.log(name, result.deployedTo, result.transactionHash); return result;
  }
  if (!m.token) { const r = deploy('MockIncomeUSD', baseRpc, []); m.token = r.deployedTo; m.transactions.tokenDeploy = r.transactionHash; m.baseStartBlock = (await base.getTransactionReceipt({ hash: r.transactionHash })).blockNumber.toString(); saveManifest(m); }
  if (!m.reactive) { const r = deploy('IncomeFlowReactive', reactiveRpc, [owner, m.token!], '0.5ether'); m.reactive = r.deployedTo; m.transactions.reactiveDeploy = r.transactionHash; m.reactiveStartBlock = (await reactive.getTransactionReceipt({ hash: r.transactionHash })).blockNumber.toString(); saveManifest(m); }
  if (!m.vault) { const r = deploy('IncomeVault', baseRpc, [owner, m.token!, proxy, m.reactive!], '0.003ether'); m.vault = r.deployedTo; m.transactions.vaultDeploy = r.transactionHash; saveManifest(m); }
  if (!m.recipients) {
    mkdirSync('.secrets', { recursive: true, mode: 0o700 });
    m.recipients = ['spending', 'savings', 'taxes'].map(label => {
      const path = resolve(`.secrets/${label}`);
      if (!existsSync(path)) execFileSync(binary('cast'), ['wallet', 'new', resolve('.secrets'), label, '--eoa'], { env: { ...process.env, CAST_PASSWORD: readFileSync(process.env.DEPLOY_PASSWORD_FILE || '.secrets/password', 'utf8') || randomBytes(32).toString('hex') }, stdio: 'pipe' });
      return execFileSync(binary('cast'), ['wallet', 'address', '--keystore', path, '--password-file', resolve(process.env.DEPLOY_PASSWORD_FILE || '.secrets/password')], { encoding: 'utf8' }).trim() as Address;
    }); saveManifest(m);
  }
  if (!m.transactions.policy) {
    const r = send(baseRpc, m.vault!, 'setRules((address,uint16,string)[])', [`[(${m.recipients[0]},5000,Spending),(${m.recipients[1]},3000,Savings),(${m.recipients[2]},2000,Tax reserve)]`]);
    m.transactions.policy = r.transactionHash; saveManifest(m);
  }
  if (!m.transactions.bind) { const r = send(reactiveRpc, m.reactive!, 'bindVault(address)', [m.vault!]); m.transactions.bind = r.transactionHash; saveManifest(m); }
  for (const [client, address, name] of [[base, m.token, 'token'], [base, m.vault, 'vault'], [reactive, m.reactive, 'reactive']] as const) {
    if (!(await client.getCode({ address: address! }))) throw new Error(`${name} code missing after deployment.`);
  }
  m.status = 'deployed-unverified'; saveManifest(m);
  // Reading artifacts also verifies ABI availability before the live proof command.
  artifact('IncomeVault'); console.log('Deployment confirmed. Next: npm run health, then npm run proof. M1 is still unverified.');
}
main().catch((e: unknown) => { console.error(e instanceof Error ? e.message : 'Deployment failed'); process.exitCode = 1; });
