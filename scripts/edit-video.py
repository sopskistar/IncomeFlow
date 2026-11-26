"""Trim genuine source recordings; preserve all original files and an explicit edit map."""
import json
import pathlib
import shutil
import subprocess

root = pathlib.Path(__file__).resolve().parents[1]
capture = json.loads((root / 'artifacts/video/read-only-capture.json').read_text())
out = root / 'video/public/footage'
out.mkdir(parents=True, exist_ok=True)
signed = root / 'artifacts/video/raw/page@d338c1e051b7a93b5d80c9c98010530d.webm'
specs = [
    ('setup', signed, 2.5, 8, 24),
    ('payment', signed, 21.5, 6.2, 22),
    ('result', pathlib.Path(capture['recording']), capture['marks']['resultStart'], capture['marks']['resultEnd'] - capture['marks']['resultStart'], 28),
    ('proof', pathlib.Path(capture['recording']), capture['marks']['proofStart'], capture['marks']['proofEnd'] - capture['marks']['proofStart'], 24),
]
previous = json.loads((root / "video/edit.json").read_text()).get("clips", [])
clips = []
for name, source, start, length, target in specs:
    dest = out / f'{name}.mp4'
    old = next((c for c in previous if c['id'] == name), None)
    cuts = [{'start': 2.5, 'duration': 3, 'target': 4}, {'start': 14.7, 'duration': 5, 'target': 20}] if name == 'setup' else None
    reusable = old and dest.exists() and old['source'] == str(source.relative_to(root)) and old['sourceStartSeconds'] == start and old['sourceDurationSeconds'] == length and old['targetSeconds'] == target and old.get('cuts') == cuts
    if not reusable:
      backup = root / f'artifacts/video/{name}-original-source.mp4'
      if dest.exists() and not backup.exists():
          shutil.copy2(dest, backup)
      if cuts:
          subprocess.run([
              'ffmpeg', '-hide_banner', '-loglevel', 'error', '-threads', '1', '-i', str(source),
              '-filter_complex_threads', '1', '-filter_complex',
              '[0:v]split=2[a][b];[a]trim=start=2.5:duration=3,setpts=(PTS-STARTPTS)*1.3333333333333333[a1];[b]trim=start=14.7:duration=5,setpts=(PTS-STARTPTS)*4[b1];[a1][b1]concat=n=2:v=1:a=0,fps=30[v]',
              '-map', '[v]', '-t', '24', '-an', '-c:v', 'libx264', '-threads', '1', '-preset', 'fast', '-crf', '19', '-movflags', '+faststart', '-y', str(dest)
          ], check=True)
      else:
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
        **({'cuts': cuts} if cuts else {}),
        'note': 'Genuine moving screen recording. Editorial retiming; not a latency measurement. No transaction states were fabricated.'
    })
    print('Reused' if reusable else 'Edited', name, flush=True)
(root / 'video/edit.json').write_text(json.dumps({'clips': clips}, indent=2) + '\n')
