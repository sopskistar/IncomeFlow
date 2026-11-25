/** Public Base Sepolia RPC limits eth_getLogs to 200 blocks per request. */
export async function scanLogs<T>(from: bigint, to: bigint, read: (from: bigint, to: bigint) => Promise<T[]>, chunk = 200n): Promise<T[]> {
  if (from < 0n || to < from || chunk < 1n) return [];
  if (to - from > 100_000n) throw new Error('History window too large; choose a smaller block range.');
  const ranges: [bigint,bigint][]=[];
  for(let start=from;start<=to;start+=chunk) ranges.push([start,start+chunk-1n<to?start+chunk-1n:to]);
  const result:T[]=[];
  for(let i=0;i<ranges.length;i+=4){
    const batch=await Promise.all(ranges.slice(i,i+4).map(([a,b])=>read(a,b)));
    result.push(...batch.flat());
  }
  return result;
}
