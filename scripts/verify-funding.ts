import { writeFileSync, mkdirSync } from 'node:fs';
import { base, reactive, loadManifest, stringify } from './config';
import { decodeFunctionData, formatEther, parseAbi, type Hash } from 'viem';
async function main() {
  const m=loadManifest();if(!m.owner)throw new Error('Missing deployer');
  const hashes: Hash[]=['0x45328422c3b96e9c988dbd7a10f7ee4df5483d2a13c6a5e24b9fa3445f059e96','0x5ff371b7fffb5f8570dc2486f3e1a0fa04c383ab28fd3da2cda4f03227fffce9'];
  const incoming=await Promise.all(hashes.map(async hash=>{
    const [tx,receipt]=await Promise.all([base.getTransaction({hash}),base.getTransactionReceipt({hash})]);
    if(tx.to?.toLowerCase()!==m.owner!.toLowerCase()||receipt.status!=='success')throw new Error('Incoming funding mismatch');
    return {hash,to:tx.to,value:tx.value,block:receipt.blockNumber,status:receipt.status};
  }));
  const hash=m.transactions.lasnaFaucet as Hash;
  const [tx,receipt,code,eth,lreact]=await Promise.all([base.getTransaction({hash}),base.getTransactionReceipt({hash}),base.getCode({address:'0x2afaFD298b23b62760711756088F75B7409f5967'}),base.getBalance({address:m.owner}),reactive.getBalance({address:m.owner})]);
  const call=decodeFunctionData({abi:parseAbi(['function request(address) payable']),data:tx.input});
  if(receipt.status!=='success'||tx.value!==20_000_000_000_000_000n||tx.to?.toLowerCase()!=='0x2afafd298b23b62760711756088f75b7409f5967'||call.args[0].toLowerCase()!==m.owner.toLowerCase()||!code)throw new Error('Faucet receipt mismatch');
  const result={checkedAt:new Date().toISOString(),owner:m.owner,incoming,faucet:{hash,to:tx.to,value:tx.value,status:receipt.status,block:receipt.blockNumber,call},baseBalance:eth,lasnaBalance:lreact};
  mkdirSync('deployments/evidence',{recursive:true});writeFileSync('deployments/evidence/funding.json',stringify(result)+'\n');
  console.log(stringify({...result,baseBalance:formatEther(eth)+' ETH',lasnaBalance:formatEther(lreact)+' lREACT'}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
