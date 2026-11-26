"""Black-frame scan, footage activity check and representative exported frames."""
import hashlib
import json
import pathlib
import subprocess

root = pathlib.Path(__file__).resolve().parents[1]
out = root/'artifacts/video'
movie = out/'incomeflow-demo.mp4'
review = out/'review'
review.mkdir(exist_ok=True)
scan = subprocess.run([
    'ffmpeg','-hide_banner','-loglevel','info','-threads','1','-i',str(movie),
    '-filter_complex_threads','1','-filter_complex',
    '[0:v]split=2[full][small];[full]blackdetect=d=0.1:pix_th=0.08:pic_th=0.98[checked];[small]fps=2,scale=64:36,format=gray[activity]',
    '-map','[checked]','-an','-f','null','-',
    '-map','[activity]','-an','-pix_fmt','gray','-f','rawvideo','-'
],check=True,capture_output=True)
log=scan.stderr.decode()
(out/'quality-scan.log').write_text(log)
black=[line for line in log.splitlines() if 'black_start:' in line]
assert not black, black
size=64*36
samples=[scan.stdout[i:i+size] for i in range(0,len(scan.stdout),size)]
scenes=json.loads((root/'video/narration.json').read_text())
activity=[]
for scene in scenes:
    part=samples[scene['from']*2:(scene['from']+scene['duration'])*2]
    unique=len({hashlib.sha256(frame).digest() for frame in part})
    activity.append({'scene':scene['id'],'samples':len(part),'distinctHalfSecondFrames':unique})
    assert unique>1, f"Entire scene appears static: {scene['id']}"
times=[2,16,28,43,68,89,101,116,127,143]
select='+'.join(f'eq(n\\,{t*30})' for t in times)
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-threads','1','-i',str(movie),'-vf','select='+select,'-fps_mode','vfr','-y',str(review/'frame-%02d.png')],check=True)
report={'blackIntervals':black,'activity':activity,'frames':[{'file':f'review/frame-{i+1:02}.png','seconds':t} for i,t in enumerate(times)],'interpretation':'Actual footage changes in every scene. Intentional reading/network-wait holds are preserved; motion sampling alone is not proof of transaction authenticity. Visual inspection is recorded separately.'}
(out/'visual-checks.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
