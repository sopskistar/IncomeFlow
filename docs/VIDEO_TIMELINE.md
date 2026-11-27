# Payment Passport video timeline

## Recommended concise public cut (November 27, 2026)

The recommended judge-facing film is the **138.25-second [focused Payment Passport demo](https://github.com/sopskistar/IncomeFlow/releases/download/incomeflow-payment-passport/incomeflow-passport-demo-focused.mp4)** with [retimed subtitles](https://github.com/sopskistar/IncomeFlow/releases/download/incomeflow-payment-passport/incomeflow-passport-demo-focused.srt). It is a non-destructive editorial version of the original 150-second Payment Passport film, which remains available for reproducibility. The published version is 1920×1080, 30 fps, H.264/AAC; full decoding and six representative visual frames passed in [GitHub Actions](https://github.com/sopskistar/IncomeFlow/actions/runs/45957686082). Published SHA-256: `004c7c288de8804abb40731830565583bd8ba6bcbcffe73b422fdbf5d753949a`.

Edits: remove repeated explanatory end-sentences in the opening, research and proof scenes; remove the persistent "genuine footage / edited pacing" footer, the opening illustrative label, and the redundant research caveat. The 59% statistic remains clearly scoped to **surveyed small businesses**, with the QuickBooks source shown in full. The genuine payment footage, the 40/60 transfers, Reactive executions and on-chain allocation evidence are preserved. The outro retains its testnet-prototype scope; this edit is not a latency benchmark. Source cut windows and non-destructive reproduction: [scripts/polish-passport-demo.sh](../scripts/polish-passport-demo.sh) and [scripts/retime-passport-subtitles.py](../scripts/retime-passport-subtitles.py).


Revised output: `artifacts/video/passport/incomeflow-passport-demo.mp4` — **150.0s, 1920×1080, 30 fps, H.264/AAC, 5,682,102 bytes**. Separate from the unchanged original published film described below. The revision uses genuine signed-session footage and read-only verification of the same saved signatures/receipts. No test transaction was repeated for filming.

| Time | Story | Actual source |
| --- | --- | --- |
| 0–20s | The work is finished; financial admin remains | Original Remotion motion, visibly illustrative freelancer scenario |
| 20–35s | Evidence for the broader problem | QuickBooks 59% finding with primary URL and small-business scope qualification |
| 35–55s | From request to organized income | Genuine signing review and independent original signed-link inspection |
| 55–85s | Request, partial payment, settlement | Real exact-log associations; first-payment signed-link version shows 60 outstanding; both associations show zero |
| 85–115s | Essential Reactive financial action | Original actual 40/60 supported-token payment workflow; no repeated transfers |
| 115–135s | Independently inspectable outcome | Moving owner receipt with exact origin/Reactive/callback links and actual 20/12/8 + 30/18/12 payouts |
| 135–150s | Give every payment a purpose | Original brand motion, real application/GitHub URLs, testnet limits |

The illustrative job is not commercial client income. One disposable test account acts as owner and payer. The original M1 is a separate older demonstration; the revised film says so explicitly. Request/association handling is application logic; Reactive performs allocation. Edited pacing is not a network-latency measurement.

## Reproduction

The project reuses the existing installed shared workspace locally, with all runtime versions declared in `video/package.json` and its portable lockfile. A fresh checkout can use:

```sh
cd video
npm ci
npm run render:passport
cd ..
python3 scripts/build-passport-captions.py
python3 scripts/verify-video.py --movie artifacts/video/passport/incomeflow-passport-demo.mp4 --output artifacts/video/passport --scenes video/passport-narration.json --narration video/public/passport-narration
python3 scripts/inspect-video.py --movie artifacts/video/passport/incomeflow-passport-demo.mp4 --output artifacts/video/passport --scenes video/passport-narration.json --times 2,24,42,61,68,74,80,89,105,121,130,143
```

Requires FFmpeg/FFprobe, Python 3 and Remotion's compatible browser. Four edited genuine clips and seven normalized narration tracks are supplied in `video/public/passport-*`; a fresh render does not require the large raw recordings. `scripts/edit-passport-video.py` is optional for editing the retained local originals, following `video/passport-edit.json`. It caches unchanged cuts. Optional narration regeneration uses `video/requirements-narration.txt`; supplied audio requires no API call.

The native pipeline renders original motion/plates in Remotion, composites real recordings sequentially with one decoder thread per input and low-lookahead encoding, normalizes MP4 video time bases to 90 kHz without re-encoding, then copies completed video sequentially while assembling a continuous narration track. This avoids monolithic browser video decoding and seven concurrent video decoders. Valid scenes are reused. After changing a scene, preserve its previous generated segment before regenerating only that scene. Full decoding/inspection follows assembly; duration alone is not final acceptance.

## Review history

An initial opening used a missing font path. It was rejected and only that motion scene was repaired. Later visual inspection caught a cut that showed returning-owner form navigation rather than the second exact association. The two affected clips were recut from existing sources in decoded video time; the original footage and rejected outputs remain preserved locally. Resource pressure interrupted one composition; limited decoder threads and sequential video copying resolved the pipeline design. [Download the recommended revision](https://github.com/sopskistar/IncomeFlow/releases/download/incomeflow-payment-passport/incomeflow-passport-demo.mp4) · [release/captions](https://github.com/sopskistar/IncomeFlow/releases/tag/incomeflow-payment-passport). Anonymous download matched the local SHA-256.

Final measured validation is recorded in `deployments/video-passport.json`. A direct-copy prototype with mixed time bases was rejected by motion/timestamp checks; 90 kHz normalization repaired it. The final full decode has no logged errors, every scene has distinct sampled frames, no black interval was detected, and all seven audio envelopes correlate above 0.9999 at 0.00s offset. Twelve decoded frames were visually inspected. The measured peak is −4.5 dB; end-of-scene reading gaps reach approximately 3.2s. Review uses those recorded methods, without claiming a separate human listening session. Captions contain 41 nonoverlapping cues.

## Preserved original film

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

Public download: [verified MP4](https://github.com/sopskistar/IncomeFlow/releases/download/incomeflow-testnet-demo/incomeflow-demo.mp4); [release/captions](https://github.com/sopskistar/IncomeFlow/releases/tag/incomeflow-testnet-demo). Anonymous download/checksum verified after publication.
