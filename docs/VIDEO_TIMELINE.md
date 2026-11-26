# Final video timeline and reproduction

Verified output: `artifacts/video/incomeflow-demo.mp4` — **150.0 seconds, 4,500 frames, 1920×1080, 30 fps, H.264 / AAC**, 5,281,055 bytes. SHA-256 and full check results are in `deployments/video.json`. The rendered file is published separately as a release artifact rather than added to Git history.

| Time | Scene | Actual source |
| --- | --- | --- |
| 0–12s | Opening | Original Remotion brand/allocation motion; illustration labeled |
| 12–36s | Setup | Real signed-session creation, destination entry and save; network waits edited |
| 36–58s | Payment | Real Receive screen, 100 ifUSD transfer and genuine transaction states |
| 58–82s | Automation | Original Remotion architecture animation; explicitly illustrative |
| 82–110s | Result | Moving read-only receipt/health for the same signed-user vault |
| 110–134s | Proof | Moving original M1 proof page, explicitly labeled original run |
| 134–150s | Closing | Original IncomeFlow branding and honest testnet/security limits |

Exact source filenames, cuts and editorial speed changes are in `video/edit.json`. They are not a latency measurement. Setup uses original source 2.5–5.5s and 14.7–19.7s, keeping actual rule entry/save while removing the middle registration wait. Payment uses source 21.5–27.7s, avoiding the already-fixed post-save editor flash. Five other finished scenes and every graphic plate were preserved during this refinement. Original files and superseded segments remain locally under `artifacts/video/`.

## Reproduce

`video/` declares Remotion 4.0.541, React and TypeScript in a portable registry lockfile. The local ignored dependency symlink reuses the installed shared workspace; it is not required by a fresh checkout. The first lockfile accidentally captured shared-installation paths; it was replaced with an independently generated lockfile without changing shared tools.

```sh
cd video
npm ci
npm run render
cd ..
python3 scripts/verify-video.py
python3 scripts/inspect-video.py
```

Requires FFmpeg, FFprobe and Python 3. A bundled Chrome is reused when available; otherwise Remotion's normal browser setup applies. The default renderer generates original graphics in Remotion and uses native FFmpeg for the four real video clips. This avoids the original full-browser OffthreadVideo stall at frame 564. Rendering is sequential, with one worker and limited caches. Valid generated segments are reused; remove only a revised scene's generated segment when making further edits.

The public repository includes the four edited genuine source clips and seven narration tracks, so the final film can be reproduced without the larger original recordings. The original recordings remain in this workspace. Optional narration regeneration uses the free Edge TTS client; supplied audio requires no paid API. Subtitle sentence timings are in `video/public/narration/incomeflow.srt`.

## Verification performed

Full FFmpeg decode succeeded. FFprobe confirms resolution, duration, 30 fps, H.264 and AAC. No black interval of at least 0.1 seconds was detected. Every scene has multiple distinct sampled frames; intentional reading/real-network holds are preserved. All seven narration tracks match the rendered scene audio with envelope correlations above 0.9998 and measured 0.00-second offsets. Representative decoded frames, including revised rule entry, real receipt, architecture, original proof and closing, were visually inspected for legibility and missing/corrupt content. This records the actual review method rather than claiming a separate human listening session.
