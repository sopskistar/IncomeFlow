"""Render only changed cuts from the Passport edit manifest; preserve originals."""
import hashlib
import json
import pathlib
import subprocess
root=pathlib.Path(__file__).resolve().parents[1]
config=root/'video/passport-edit.json'
spec=json.loads(config.read_text())
for clip in spec['clips']:
    dest=root/'video/public'/clip['file'];dest.parent.mkdir(parents=True,exist_ok=True)
    fingerprint=hashlib.sha256(json.dumps(clip,sort_keys=True).encode()).hexdigest()
    marker=dest.with_suffix('.edit-sha256')
    if dest.exists() and marker.exists() and marker.read_text().strip()==fingerprint:
        print('Reused',clip['id'],flush=True);continue
    args=['ffmpeg','-v','error','-threads','1','-filter_complex_threads','1']
    for cut in clip['cuts']:
        source=root/cut['source']
        assert source.exists(),source
        args+=['-ss',str(cut['start']),'-t',str(cut['duration']),'-i',str(source)]
    filters=[]
    for i,cut in enumerate(clip['cuts']):
        filters.append(f'[{i}:v]setpts=(PTS-STARTPTS)*{cut["target"]/cut["duration"]},scale=1280:800:force_original_aspect_ratio=decrease,pad=1280:800:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,fps=30[v{i}]')
    filters.append(''.join(f'[v{i}]' for i in range(len(clip['cuts'])))+f'concat=n={len(clip["cuts"])}:v=1:a=0[v]')
    args+=['-filter_complex',';'.join(filters),'-map','[v]','-t',str(clip['duration']),'-an','-c:v','libx264','-threads','1','-preset','fast','-crf','18','-movflags','+faststart','-y',str(dest)]
    subprocess.run(args,check=True);marker.write_text(fingerprint+'\n');print('Edited',clip['id'],flush=True)
