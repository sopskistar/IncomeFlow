"""Optional free narration generator. Run with .tools/tts/bin/python; no credentials."""
import argparse
import asyncio
import json
import pathlib
import subprocess
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument("--scenes",default="video/narration.json")
parser.add_argument("--output",default="video/public/narration")
args=parser.parse_args()
OUTPUT = ROOT / args.output
VOICE = "en-US-AriaNeural"

async def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    scenes = json.loads((ROOT / args.scenes).read_text())
    results = []
    for scene in scenes:
        path = OUTPUT / (scene["id"] + ".mp3")
        raw = OUTPUT / (scene["id"] + ".raw.mp3")
        metadata = OUTPUT / (scene["id"] + ".words.jsonl")
        if not raw.exists():
            await edge_tts.Communicate(scene["text"], VOICE, rate="+8%").save(str(raw), str(metadata))
        probe = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(raw)], text=True)
        duration = float(json.loads(probe)["format"]["duration"])
        speed = max(1.0, duration / (scene["duration"] - 0.7))
        if speed > 1.2:
            raise RuntimeError(f"Narration {scene['id']} needs a shorter script: {duration:.2f}s")
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw), "-af", f"atempo={speed},loudnorm=I=-16:TP=-1.5:LRA=9", "-codec:a", "libmp3lame", "-b:a", "192k", str(path)], check=True)
        results.append({"id": scene["id"], "voice": VOICE, "sourceSeconds": duration, "speed": speed, "scheduledFrom": scene["from"], "sceneSeconds": scene["duration"], "file": str(path.relative_to(ROOT))})
        print(scene["id"], round(duration, 2), "seconds; speed", round(speed, 3), flush=True)
    (OUTPUT / "provenance.json").write_text(json.dumps({"tool": "edge-tts 7.3.1", "voice": VOICE, "paidAPI": False, "scenes": results}, indent=2) + "\n")

asyncio.run(main())
