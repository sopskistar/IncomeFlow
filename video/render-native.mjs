import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,openSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

// Use Remotion for original graphics; FFmpeg decodes genuine UI recordings.
// This avoids long-lived Chromium OffthreadVideo decoder stalls on a busy host.
const out=resolve('../artifacts/video');
mkdirSync(out+'/segments',{recursive:true});
const log=openSync(out+'/native-render.log','a');
function run(cmd,args){const r=spawnSync(cmd,args,{stdio:['ignore',log,log],timeout:1200000});if(r.status!==0)throw new Error(`${cmd} failed (${r.status}); inspect native-render.log`);}
run(process.execPath,['preflight.mjs']);
const browser=process.env.REMOTION_BROWSER_EXECUTABLE||'/home/sopski/hackathon-video-studio/node_modules/.remotion/chrome-headless-shell/linux64/chrome-headless-shell-linux64/chrome-headless-shell';
const common=['--concurrency=1','--offthreadvideo-cache-size-in-bytes=67108864','--media-cache-size-in-bytes=33554432','--offthreadvideo-video-threads=1',...(existsSync(browser)?['--browser-executable='+browser]:[])];
const cli=resolve('node_modules/@remotion/cli/remotion-cli.js');
const scenes=JSON.parse(readFileSync('narration.json'));
const clips=JSON.parse(readFileSync('edit.json')).clips;
const durations={opening:12,setup:24,payment:22,automation:24,result:28,proof:24,closing:16};
function validSegment(path,seconds){
 if(!existsSync(path))return false;
 const p=spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','json',path],{encoding:'utf8'});
 try{return p.status===0&&Math.abs(Number(JSON.parse(p.stdout).format.duration)-seconds)<.12;}catch{return false;}
}
for(const id of ['opening','automation','closing']){
 const scene=scenes.find(s=>s.id===id),dest=out+'/segments/'+id+'.mp4';
 if(!validSegment(dest,scene.duration)){
  console.log('Rendering original motion:',id);
  run(process.execPath,[cli,'render','src/index.tsx','IncomeFlow',dest,`--frames=${scene.from*30}-${(scene.from+scene.duration)*30-1}`,'--codec=h264','--crf=18',...common]);
 }
}
for(const id of ['setup','payment','result','proof']){
 const plate=out+'/segments/'+id+'-plate.png',dest=out+'/segments/'+id+'.mp4';
 if(validSegment(dest,durations[id]))continue;
 console.log('Compositing genuine footage:',id);
 if(!existsSync(plate))run(process.execPath,[cli,'still','src/index.tsx','Plate',plate,'--props='+JSON.stringify({sceneId:id}),...common]);
 const clip=clips.find(c=>c.id===id),seconds=durations[id];
 const cropY=id==='payment'?'ih-790':'(ih-790)/2';
 run('ffmpeg',['-hide_banner','-loglevel','error','-threads','1','-loop','1','-framerate','30','-i',plate,'-i','public/'+clip.file,'-i',`public/narration/${id}.mp3`,
 '-filter_complex_threads','1','-filter_complex',`[1:v]scale=1776:790:force_original_aspect_ratio=increase,crop=1776:790:(iw-1776)/2:${cropY},setsar=1[v];[0:v][v]overlay=72:220:shortest=1,format=yuv420p[out];[2:a]apad=whole_dur=${seconds}[a]`,
 '-map','[out]','-map','[a]','-r','30','-t',String(seconds),'-c:v','libx264','-threads','1','-preset','fast','-crf','18','-c:a','aac','-ar','48000','-ac','2','-movflags','+faststart','-y',dest]);
}
console.log('Joining seven verified scenes');
const args=['-hide_banner','-loglevel','error','-threads','1','-filter_complex_threads','1'];
for(const scene of scenes)args.push('-i',out+'/segments/'+scene.id+'.mp4');
const filters=scenes.flatMap((s,i)=>[`[${i}:v]trim=end_frame=${s.duration*30},setpts=N/(30*TB),setsar=1[v${i}]`,`[${i}:a]apad=whole_dur=${s.duration},atrim=duration=${s.duration},asetpts=PTS-STARTPTS[a${i}]`]);
filters.push(scenes.map((_,i)=>`[v${i}][a${i}]`).join('')+'concat=n=7:v=1:a=1[v][a]');
args.push('-filter_complex',filters.join(';'),'-map','[v]','-map','[a]','-t','150','-r','30','-c:v','libx264','-threads','1','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-ac','2','-movflags','+faststart','-y',out+'/incomeflow-demo.mp4');
run('ffmpeg',args);
writeFileSync(out+'/render-method.json',JSON.stringify({strategy:'Remotion original motion graphics + native FFmpeg genuine-video composite',frames:4500,fps:30,seconds:150,source:'video/edit.json',failedPriorAttempt:'render-remotion-failed.log'},null,2));
console.log('Finished:',out+'/incomeflow-demo.mp4');
