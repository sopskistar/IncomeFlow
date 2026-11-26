# Video timeline and reproduction

Target edit: 150 seconds / 4,500 frames at 30fps, 1920×1080. Seven independently editable scene boundaries: 0, 12, 36, 58, 82, 110 and 134 seconds. Narration clips align to these boundaries. Actual screen recordings retain their own source trims; do not alter transaction states to fit the narration.

Sources: project-local `video/` composition, brand/font files under `public/`, genuine recordings under `artifacts/video/raw/`, and verified references under `deployments/evidence/`. The connected browser journey records action marks to help select source trims. Final source trims, audio durations and output filename will be recorded after media exists.

Reuse installed Remotion 4.0.541 and bundled Chrome from `~/hackathon-video-studio`; runtime dependencies remain declared in `video/package.json`. This shared workspace is a tool installation, not another project's product footage. Playwright captures the real IncomeFlow app; FFmpeg/FFprobe inspect and validate output. Narration generation uses an isolated optional tool environment and no paid API.

Required final checks: playable MP4, H.264 video, AAC narration, 1920×1080, 30fps, duration under 180s, successful full decode, inspected frames at scene boundaries and legible actual app footage. These are pending until an MP4 is rendered.
