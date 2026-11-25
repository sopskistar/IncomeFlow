import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { decodeEventLog, erc20Abi, parseEventLogs, parseAbi, type Address, type Hash, type Abi } from 'viem';
import { artifact, base, reactive, loadManifest, saveManifest, prerequisites, send, stringify, system, callbackAbi } from './config';
import {scanLogs} from '../src/lib/rpc-logs';

// This command sends a REAL test-token transfer. It does not synthesize a system event.
async function main() {
  await prerequisites(); const m = loadManifest();
  if (!m.token || !m.vault || !m.reactive || !m.owner || !m.recipients) throw new Error('Complete deployment and policy setup first.');
  const token = m.token, vault = m.vault, rc = m.reactive;
  const vaultAbi = artifact('IncomeVault').abi as Abi;
  const rcAbi = artifact('IncomeFlowReactive').abi as Abi;
  const rpc = base.transport.url!;
  const balance = (a: Address) => base.readContract({ address: token, abi: erc20Abi, functionName: 'balanceOf', args: [a] });
  const file = 'deployments/proof-attempt.json';
  let attempt: { originTx: Hash; before: string[]; reactiveFrom: string; startedAt: string };
  if (existsSync(file)) {
    attempt = JSON.parse(readFileSync(file, 'utf8')); console.log('Resuming existing origin payment', attempt.originTx);
  } else {
    if (await balance(m.owner) < 100_000_000n) send(rpc, token, 'faucet()');
    const before = await Promise.all(m.recipients.map(balance));
    const reactiveFrom = await reactive.getBlockNumber();
    const receipt = send(rpc, token, 'transfer(address,uint256)', [vault, '100000000']);
    attempt = { originTx: receipt.transactionHash, before: before.map(String), reactiveFrom: reactiveFrom.toString(), startedAt: new Date().toISOString() };
    writeFileSync(file, stringify(attempt) + '\n');
  }
  const origin = await base.getTransactionReceipt({ hash: attempt.originTx });
  if (origin.status !== 'success') throw new Error('Origin failed.');
  const transfer = parseEventLogs({ abi: erc20Abi, eventName: 'Transfer', logs: origin.logs }).find(l => l.address.toLowerCase() === token.toLowerCase() && l.args.to.toLowerCase() === vault.toLowerCase() && l.args.value === 100_000_000n);
  if (!transfer) throw new Error('Origin receipt has no expected token Transfer to this vault.');
  const paymentId = await base.readContract({ address: vault, abi: vaultAbi, functionName: 'paymentId', args: [BigInt(attempt.originTx), BigInt(transfer.logIndex)] }) as Hash;
  const observedEvent = parseAbi(['event PaymentObserved(bytes32 indexed paymentId,uint256 indexed originTxHash,address indexed payer,uint256 logIndex,uint256 originBlock,uint256 amount)']);
  const allocatedEvent = parseAbi(['event PaymentAllocated(bytes32 indexed paymentId,uint256 indexed originTxHash,address indexed payer,uint256 originLogIndex,uint256 amount,uint256 version)']);
  const timeout = Date.now() + 120_000;
  let observed: Awaited<ReturnType<typeof reactive.getLogs>>[number] | undefined;
  let allocated: Awaited<ReturnType<typeof base.getLogs>>[number] | undefined;
  while (Date.now() < timeout) {
    const [rHead, bHead] = await Promise.all([reactive.getBlockNumber(), base.getBlockNumber()]);
    const rFrom = BigInt(attempt.reactiveFrom) > rHead - 2000n ? BigInt(attempt.reactiveFrom) : rHead - 2000n;
    const bFrom = origin.blockNumber > bHead - 2000n ? origin.blockNumber : bHead - 2000n;
    const [r, b] = await Promise.all([
      reactive.getLogs({ address: rc, event: observedEvent[0], args: { paymentId }, fromBlock: rFrom, toBlock: rHead }),
      scanLogs(bFrom,bHead,(fromBlock,toBlock)=>base.getLogs({ address: vault, event: allocatedEvent[0], args: { paymentId }, fromBlock, toBlock }))
    ]);
    observed ||= r[0]; allocated ||= b[0];
    if (observed && allocated) break;
    console.log('Observed:', !!observed, 'Distributed:', !!allocated, 'Payment:', paymentId);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  if (!observed?.transactionHash || !allocated?.transactionHash) throw new Error('Full loop not observed within 120 seconds. Origin saved; run health/diagnostics, then rerun proof to resume without another payment.');
  const [rReceipt, dReceipt, after] = await Promise.all([
    reactive.getTransactionReceipt({ hash: observed.transactionHash }), base.getTransactionReceipt({ hash: allocated.transactionHash }), Promise.all(m.recipients.map(balance))
  ]);
  if (rReceipt.status !== 'success' || dReceipt.status !== 'success') throw new Error('Reactive/destination receipt failed.');
  const requestAbi = parseAbi(['event CallbackRequest(uint256 indexed chainId,address indexed sender,address indexed recipient,uint8 version,bytes configuration)']);
  const requests = parseEventLogs({ abi: requestAbi, logs: rReceipt.logs });
  const request = requests.find(l => l.address.toLowerCase() === system.toLowerCase() && l.args.sender.toLowerCase() === rc.toLowerCase() && l.args.recipient.toLowerCase() === vault.toLowerCase() && l.args.chainId === 84532n);
  if (!request) throw new Error('No matching official CallbackRequest in reactive receipt.');
  const [dTx, originBlock, destinationBlock] = await Promise.all([base.getTransaction({ hash: dReceipt.transactionHash }), base.getBlock({ blockNumber: origin.blockNumber }), base.getBlock({ blockNumber: dReceipt.blockNumber })]);
  const allocations = parseEventLogs({ abi: vaultAbi, logs: dReceipt.logs, eventName: 'AllocationPaid' });
  const payouts = parseEventLogs({ abi: erc20Abi, eventName: 'Transfer', logs: dReceipt.logs }).filter(l => l.address.toLowerCase() === token.toLowerCase() && l.args.from.toLowerCase() === vault.toLowerCase());
  const expected = [50_000_000n, 30_000_000n, 20_000_000n];
  for (let i = 0; i < 3; ++i) {
    if (after[i] - BigInt(attempt.before[i]) !== expected[i]) throw new Error('Unexpected destination balance delta; inspect concurrent transfers.');
    if (!payouts.some(p => p.args.to.toLowerCase() === m.recipients![i].toLowerCase() && p.args.value === expected[i])) throw new Error('Missing actual payout Transfer.');
  }
  if (allocations.length !== 3) throw new Error('Expected three vault allocation events.');
  let delivery: unknown;
  try { delivery = await reactive.readContract({ address: system, abi: callbackAbi, functionName: 'getCallbacks', args: [BigInt(observed.transactionHash)] }); }
  catch { delivery = { unavailable: true, note: 'Inspect linked destination receipt and CallbackRequest manually.' }; }
  const proof = {
    status: 'full-loop-confirmed', checkedAt: new Date().toISOString(), chains: [84532, 5318007], token, vault, reactive: rc,
    paymentId, origin: { hash: origin.transactionHash, block: origin.blockNumber, transferLogIndex: transfer.logIndex, timestamp: originBlock.timestamp },
    reactiveExecution: { hash: observed.transactionHash, block: rReceipt.blockNumber, callbackRequest: request },
    destination: { hash: dReceipt.transactionHash, to: dTx.to, block: dReceipt.blockNumber, timestamp: destinationBlock.timestamp, allocations, payouts },
    recipients: m.recipients, before: attempt.before, after, expected, delivery,
    latencySeconds: destinationBlock.timestamp - originBlock.timestamp,
    replay: { status: 'locally-tested; live-retry-not-yet-verified', command: 'Use Settings retry after 60 seconds; confirm DuplicateIgnored and unchanged token balances.' }
  };
  mkdirSync('deployments/evidence', { recursive: true });
  writeFileSync('deployments/evidence/m1.json', stringify(proof) + '\n');
  writeFileSync('deployments/evidence/origin-receipt.json', stringify(origin) + '\n');
  writeFileSync('deployments/evidence/reactive-receipt.json', stringify(rReceipt) + '\n');
  writeFileSync('deployments/evidence/destination-receipt.json', stringify(dReceipt) + '\n');
  m.status = 'loop-verified-replay-pending'; m.proof = 'deployments/evidence/m1.json'; saveManifest(m);
  console.log('Actual loop and 50/30/20 balance deltas verified.', stringify({ origin: attempt.originTx, reactive: observed.transactionHash, destination: dReceipt.transactionHash, paymentId }));
  // Validate event decoding rather than treating an emitted request as delivery.
  decodeEventLog({ abi: rcAbi, data: observed.data, topics: observed.topics });
}
main().catch((e: unknown) => { console.error(e instanceof Error ? e.message : 'Proof failed'); process.exitCode = 1; });
