"""Trim genuine source recordings; preserve all original files and an explicit edit map."""
import json
import pathlib
import subprocess

root = pathlib.Path(__file__).resolve().parents[1]
capture = json.loads((root / 'artifacts/video/read-only-capture.json').read_text())
out = root / 'video/public/footage'
out.mkdir(parents=True, exist_ok=True)
signed = root / 'artifacts/video/raw/page@d338c1e051b7a93b5d80c9c98010530d.webm'
specs = [
    ('setup', signed, 0, 17, 24),
    ('payment', signed, 20, 9, 22),
    ('result', pathlib.Path(capture['recording']), capture['marks']['resultStart'], capture['marks']['resultEnd'] - capture['marks']['resultStart'], 28),
    ('proof', pathlib.Path(capture['recording']), capture['marks']['proofStart'], capture['marks']['proofEnd'] - capture['marks']['proofStart'], 24),
]
clips = []
for name, source, start, length, target in specs:
    dest = out / f'{name}.mp4'
    subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-threads', '1',
        '-ss', str(start), '-t', str(length), '-i', str(source),
        '-vf', f'setpts=(PTS-STARTPTS)*{target/length},fps=30',
        '-t', str(target), '-an', '-c:v', 'libx264', '-threads', '1', '-preset', 'fast', '-crf', '19',
        '-movflags', '+faststart', '-y', str(dest)
    ], check=True)
    clips.append({
        'id': name, 'file': f'footage/{name}.mp4',
        'source': str(source.relative_to(root)), 'sourceStartSeconds': start,
        'sourceDurationSeconds': length, 'targetSeconds': target,
        'speed': length / target,
        'note': 'Genuine moving screen recording. Editorial retiming; not a latency measurement. No transaction states were fabricated.'
    })
    print('Edited', name, flush=True)
(root / 'video/edit.json').write_text(json.dumps({'clips': clips}, indent=2) + '\n')
