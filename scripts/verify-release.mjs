import {spawnSync} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
mkdirSync('artifacts/qa',{recursive:true});
const checks=[
 ['lint','npm',['run','lint']],['typecheck','npm',['run','typecheck']],['unit','npm',['test']],
 ['contract-format','node',['scripts/forge.mjs','fmt','--check']],
 ['contracts','node',['scripts/forge.mjs','test','-vv']],
 ['dependency-audit','npm',['audit','--omit=dev','--audit-level=high']],
 ['solar-lint','node',['scripts/forge.mjs','lint','--severity','high','--severity','med']],
];
const results=[];
for(const [name,cmd,args] of checks){
 console.log('Checking',name);
 const r=spawnSync(cmd,args,{encoding:'utf8',timeout:300000,maxBuffer:8*1024*1024});
 writeFileSync(`artifacts/qa/${name}.log`,(r.stdout||'')+(r.stderr||''));
 results.push({name,command:[cmd,...args].join(' '),exitCode:r.status,error:r.error?.message,required:name!=='solar-lint'});
 console.log(name,r.status);
 if(r.status!==0&&name!=='solar-lint')break;
}
writeFileSync('deployments/release-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),results},null,2)+'\n');
if(results.some(r=>r.required&&r.exitCode!==0))process.exitCode=1;
