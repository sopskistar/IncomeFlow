/** Separate native pipeline. Never overwrites the original published film. */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  openSync,
  statSync,
} from "node:fs";
import { resolve } from "node:path";
const out = resolve("../artifacts/video/passport");
mkdirSync(out + "/segments", { recursive: true });
const log = openSync(out + "/render.log", "a"),
  cli = resolve("node_modules/@remotion/cli/remotion-cli.js");
const scenes = JSON.parse(readFileSync("passport-narration.json"));
const edits = JSON.parse(readFileSync("passport-edit.json"));
function run(cmd, args) {
  const offset = statSync(out + "/render.log").size;
  const r = spawnSync(cmd, args, {
    stdio: ["ignore", log, log],
    timeout: 1200000,
  });
  const emitted = readFileSync(out + "/render.log").subarray(offset).toString();
  if (/Failed to load resource|404 \(Not Found\)/.test(emitted)) throw new Error("Missing render asset; reject this segment and inspect render.log");
  if (r.status !== 0)
    throw new Error(`${cmd} failed (${r.status}); inspect ${out}/render.log`);
}
function valid(file, seconds) {
  if (!existsSync(file)) return false;
  const p = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "json", file],
    { encoding: "utf8" },
  );
  try {
    return (
      p.status === 0 &&
      Math.abs(Number(JSON.parse(p.stdout).format.duration) - seconds) < 0.1
    );
  } catch {
    return false;
  }
}
const common = [
  "--concurrency=1",
  "--offthreadvideo-cache-size-in-bytes=33554432",
  "--media-cache-size-in-bytes=33554432",
];
for (const scene of scenes) {
  const dest = `${out}/segments/${scene.id}.mp4`,
    audio = `public/passport-narration/${scene.id}.mp3`;
  if (valid(dest, scene.duration)) continue;
  if (!existsSync(audio)) throw new Error("Missing narration " + audio);
  if (["problem", "research", "closing"].includes(scene.id)) {
    const motion = `${out}/segments/${scene.id}-motion.mp4`;
    if (!valid(motion, scene.duration))
      run(process.execPath, [
        cli,
        "render",
        "src/passport.tsx",
        "PassportMotion",
        motion,
        "--props=" + JSON.stringify({ sceneId: scene.id, plate: false }),
        `--frames=0-${scene.duration * 30 - 1}`,
        "--codec=h264",
        "--crf=18",
        ...common,
      ]);
    run("ffmpeg", [
      "-v",
      "error",
      "-threads",
      "1",
      "-i",
      motion,
      "-i",
      audio,
      "-filter_complex_threads",
      "1",
      "-filter_complex",
      `[1:a]apad=whole_dur=${scene.duration},atrim=duration=${scene.duration}[a]`,
      "-map",
      "0:v",
      "-map",
      "[a]",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-ar",
      "48000",
      "-ac",
      "2",
      "-t",
      String(scene.duration),
      "-movflags",
      "+faststart",
      "-y",
      dest,
    ]);
  } else {
    const clip = edits.clips.find((c) => c.id === scene.id);
    if (!clip || !existsSync("public/" + clip.file))
      throw new Error("Missing genuine footage " + scene.id);
    const plate = `${out}/segments/${scene.id}-plate.png`;
    if (!existsSync(plate))
      run(process.execPath, [
        cli,
        "still",
        "src/passport.tsx",
        "PassportPlate",
        plate,
        "--props=" + JSON.stringify({ sceneId: scene.id, plate: true }),
        ...common,
      ]);
    run("ffmpeg", [
      "-v",
      "error",
      "-threads",
      "1",
      "-loop",
      "1",
      "-framerate",
      "30",
      "-i",
      plate,
      "-threads", "1",
      "-i",
      "public/" + clip.file,
      "-threads", "1",
      "-i",
      audio,
      "-filter_complex_threads",
      "1",
      "-filter_complex",
      `[1:v]scale=1776:790:force_original_aspect_ratio=decrease,pad=1776:790:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1[v];[0:v][v]overlay=72:220:shortest=1,format=yuv420p[out];[2:a]apad=whole_dur=${scene.duration},atrim=duration=${scene.duration}[a]`,
      "-map",
      "[out]",
      "-map",
      "[a]",
      "-r",
      "30",
      "-t",
      String(scene.duration),
      "-c:v",
      "libx264",
      "-threads",
      "1",
      "-preset",
      "fast",
      "-tune", "zerolatency",
      "-crf",
      "18",
      "-c:a",
      "aac",
      "-ar",
      "48000",
      "-ac",
      "2",
      "-movflags",
      "+faststart",
      "-y",
      dest,
    ]);
  }
  console.log("Rendered scene:", scene.id);
}
// Copy completed video sequentially; avoid seven simultaneous video decoders.
// Explicit durations exclude segment AAC padding. Continuous narration is
// reconstructed separately and compared with the final decoded audio.
// MP4 concatenation requires identical stream time bases. Remotion uses
// 90 kHz while native FFmpeg defaults differ; normalize without re-encoding.
const normalized = out + "/segments/normalized";
mkdirSync(normalized, {recursive:true});
for (const scene of scenes) {
  const source = `${out}/segments/${scene.id}.mp4`, dest = `${normalized}/${scene.id}.mp4`;
  if (!existsSync(dest) || statSync(dest).mtimeMs < statSync(source).mtimeMs)
    run("ffmpeg", ["-v","error","-threads","1","-i",source,"-map","0:v:0","-an","-c:v","copy","-video_track_timescale","90000","-movflags","+faststart","-y",dest]);
}
const playlist = out + "/segments/concat.txt";
writeFileSync(playlist, scenes.map(s => `file '${normalized}/${s.id}.mp4'\nduration ${s.duration}`).join("\n") + "\n");
const args = ["-v", "error", "-threads", "1", "-f", "concat", "-safe", "0", "-i", playlist];
for (const scene of scenes) args.push("-threads", "1", "-i", `public/passport-narration/${scene.id}.mp3`);
const filters = scenes.map((s, i) => `[${i+1}:a]apad=whole_dur=${s.duration},atrim=duration=${s.duration},asetpts=PTS-STARTPTS[a${i}]`);
filters.push(scenes.map((_, i) => `[a${i}]`).join("") + "concat=n=7:v=0:a=1[a]");
args.push("-filter_complex_threads", "1", "-filter_complex", filters.join(";"), "-map", "0:v:0", "-map", "[a]", "-t", "150", "-c:v", "copy", "-c:a", "aac", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", "-y", out + "/incomeflow-passport-demo.mp4");
run("ffmpeg", args);
writeFileSync(
  out + "/render-method.json",
  JSON.stringify(
    {
      strategy:
        "Remotion original motion + FFmpeg genuine moving application recordings",
      source: "video/passport-edit.json",
      seconds: 150,
      originalPreserved: "artifacts/video/incomeflow-demo.mp4",
    },
    null,
    2,
  ),
);
console.log("Finished:", out + "/incomeflow-passport-demo.mp4");
