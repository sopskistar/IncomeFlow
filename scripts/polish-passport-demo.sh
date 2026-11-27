#!/usr/bin/env bash
set -euo pipefail
# Non-destructive editorial cleanup of the separately published Payment Passport film.
# The original release asset and all authenticated payment evidence remain unchanged.
# Removes explanatory end-sentences rather than muting arbitrary dialogue:
#   14.1088-18.2755  (opening: "illustrative scenario" disclaimer)
#   27.9282-33.2986  (research: repeated non-effectiveness disclaimer)
#   132.6505-135.0  (proof: repeated illustrative-job disclaimer)
# Masks two unnecessary persistent on-screen captions without touching the app area.
INPUT="${1:?Usage: script ORIGINAL.mp4 OUTPUT.mp4}"
OUTPUT="${2:?Usage: script ORIGINAL.mp4 OUTPUT.mp4}"
ffmpeg -hide_banner -loglevel warning -threads 2 -filter_complex_threads 1 -y \
  -i "$INPUT" \
  -filter_complex "[0:v]drawbox=x=0:y=1018:w=iw:h=62:color=0xf5f7f6:t=fill:enable='between(t,35,135)',drawbox=x=64:y=463:w=1200:h=76:color=0xf5f7f6:t=fill:enable='between(t,0,20)',select='not(between(t\,14.1088\,18.2755)+between(t\,27.9282\,33.2986)+between(t\,132.6505\,135))',setpts=N/(30*TB),fps=30[v];[0:a]aselect='not(between(t\,14.1088\,18.2755)+between(t\,27.9282\,33.2986)+between(t\,132.6505\,135))',asetpts=N/SR/TB[a]" \
  -map "[v]" -map "[a]" -r 30 -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p \
  -c:a aac -b:a 160k -ar 48000 -ac 2 -movflags +faststart "$OUTPUT"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate -of json "$OUTPUT"
ffmpeg -hide_banner -v error -i "$OUTPUT" -f null -
