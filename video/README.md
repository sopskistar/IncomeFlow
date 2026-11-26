# IncomeFlow demo source

150-second original fintech/product walkthrough. The composition combines original vector motion, genuine application recordings, actual chain evidence and synthetic narration. It is not a screenshot-based fake walkthrough.

The local `node_modules` symlink reuses the installed shared `~/hackathon-video-studio` workspace and is not committed. A fresh checkout can install the pinned package lock:

```sh
cd video
npm ci
npm run studio
npm run render
```

Default output: `../artifacts/video/incomeflow-demo.mp4`, 1920×1080, 30fps, H.264. Render concurrency is one. The default pipeline renders the original Remotion motion scenes and composites actual UI video with native FFmpeg to avoid a long-lived browser decoder stall observed on this host. FFmpeg/FFprobe must be installed. Generated segments are reusable; remove a generated segment under `artifacts/video/segments` when revising its source scene. `edit.json` records source recordings, trim/retiming decisions and final clips. Public footage is provided solely for reproducibility of this IncomeFlow demonstration.

Narration is already supplied. Regenerating it is optional: isolated Python environment with `requirements.txt`, then run the repository's `scripts/generate-narration.py`. It uses the free Edge TTS client, not a paid API. Voice is synthetic en-US-AriaNeural, reading the original project script. No third-party music is included. Original logo and graphics are MIT project work; Manrope includes its OFL notice.

See `docs/VIDEO_STORYBOARD.md`, `VIDEO_SCRIPT.md`, `VIDEO_TIMELINE.md` and `VIDEO_EVIDENCE.md` for the editorial plan, actual claims and final validation. Video source existence alone is not a completed MP4.
