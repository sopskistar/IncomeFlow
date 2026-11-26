import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const edit=JSON.parse(readFileSync('edit.json'));
for(const [id,length] of [['setup',24],['payment',22],['result',28],['proof',24]]){
 const clip=edit.clips.find(c=>c.id===id);
 if(!clip||!existsSync('public/'+clip.file))throw new Error('Missing genuine footage: '+id);
 const seconds=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1','public/'+clip.file],{encoding:'utf8'}));
 if(Math.abs(seconds-length)>.12)throw new Error('Incorrect footage duration '+id+': '+seconds);
}
for(const s of JSON.parse(readFileSync('narration.json')))if(!existsSync('public/narration/'+s.id+'.mp3'))throw new Error('Missing narration '+s.id);
console.log('Four genuine clips and seven narration scenes verified.');
