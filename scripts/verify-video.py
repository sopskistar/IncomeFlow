"""Verify the playable export, decode it, and compare scene audio to its narration."""
import array
import hashlib
import json
import math
import pathlib
import subprocess

root = pathlib.Path(__file__).resolve().parents[1]
movie = root / 'artifacts/video/incomeflow-demo.mp4'
out = root / 'artifacts/video'

def execute(args):
    return subprocess.run(args, check=True, capture_output=True).stdout

probe = json.loads(execute(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(movie)]))
video = next(s for s in probe['streams'] if s['codec_type'] == 'video')
audio = next(s for s in probe['streams'] if s['codec_type'] == 'audio')
assert (video['width'], video['height'], video['r_frame_rate'], video['codec_name']) == (1920, 1080, '30/1', 'h264')
assert audio['codec_name'] == 'aac'
assert 149.9 <= float(probe['format']['duration']) < 180
execute(['ffmpeg', '-v', 'error', '-threads', '1', '-i', str(movie), '-f', 'null', '-'])

def envelope(path):
    raw = execute(['ffmpeg', '-v', 'error', '-threads', '1', '-i', str(path), '-vn', '-ac', '1', '-ar', '8000', '-f', 's16le', '-'])
    samples = array.array('h', raw)
    return [math.sqrt(sum(x*x for x in samples[i:i+80])/80) for i in range(0, len(samples)-79, 80)]

def correlation(a, b):
    ma, mb = sum(a)/len(a), sum(b)/len(b)
    va = sum((x-ma)**2 for x in a)
    vb = sum((x-mb)**2 for x in b)
    return sum((x-ma)*(y-mb) for x, y in zip(a, b))/math.sqrt(va*vb)

track = envelope(movie)
sync = []
for scene in json.loads((root/'video/narration.json').read_text()):
    ref = envelope(root/f"video/public/narration/{scene['id']}.mp3")
    choices = []
    for lag in range(-10, 11):
        start = scene['from']*100+lag
        if start < 0 or start+len(ref) > len(track):
            continue
        choices.append((correlation(ref, track[start:start+len(ref)]), lag/100))
    score, lag = max(choices)
    sync.append({'scene':scene['id'], 'envelopeCorrelation':round(score,5), 'offsetSeconds':lag})
    assert score > .90, f"Narration mismatch: {scene['id']} {score}"

(out/'ffprobe.json').write_text(json.dumps(probe, indent=2)+'\n')
report = {'path':str(movie.relative_to(root)), 'sha256':hashlib.sha256(movie.read_bytes()).hexdigest(), 'durationSeconds':float(probe['format']['duration']), 'width':1920, 'height':1080, 'fps':30, 'video':'h264', 'audio':'aac', 'fullDecode':'passed', 'narrationAlignment':sync}
(out/'verification.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report, indent=2))
