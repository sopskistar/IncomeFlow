#!/usr/bin/env bash
set -euo pipefail
# Focused, non-destructive editorial cut; preserves the original MP4 and all chain evidence.
# Story stays real: actual testnet payments/callbacks, no performance claims.
INPUT="${1:?Usage: $0 ORIGINAL.mp4 CLEAN.mp4}"
OUTPUT="${2:?Usage: $0 ORIGINAL.mp4 CLEAN.mp4}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

encode_clip() {
  local name="$1" start="$2" seconds="$3" overlay="$4"
  local vf="scale=1920:1080,setsar=1"
  if [ "$overlay" = "opening" ]; then
    vf="$vf,drawbox=x=64:y=463:w=1200:h=76:color=0xf5f7f6:t=fill"
  elif [ "$overlay" = "opening-then-research" ]; then
    vf="$vf,drawbox=x=64:y=463:w=1200:h=76:color=0xf5f7f6:t=fill:enable='between(t,0,1.7)',drawbox=x=58:y=734:w=1670:h=50:color=0xf5f7f6:t=fill:enable='gte(t,1.7)'"
  elif [ "$overlay" = "plates" ]; then
    vf="$vf,drawbox=x=58:y=734:w=1670:h=50:color=0xf5f7f6:t=fill:enable='lte(t,1.7)',drawbox=x=0:y=1018:w=iw:h=62:color=0xf5f7f6:t=fill:enable='gte(t,1.7)'"
  fi
  ffmpeg -hide_banner -loglevel error -threads 2 -filter_complex_threads 1 -y \
    -ss "$start" -t "$seconds" -i "$INPUT" \
    -vf "$vf" -af "aresample=async=1:first_pts=0" -r 30 \
    -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p \
    -c:a aac -b:a 160k -ar 48000 -ac 2 -movflags +faststart "$WORK/$name.mp4"
}
# Narration removals align to published sentence-boundary timings:
# - 14.1088..18.2755: repeated fictional-scenario disclaimer
# - 27.9282..33.2986: repetitive qualification (source/statistic remain on screen)
# - 132.6505..135.0000: repeated attribution disclaimer
encode_clip a 0 14.1088 opening
encode_clip b 18.2755 9.6527 opening-then-research
encode_clip c 33.2986 99.3519 plates
encode_clip d 135 15 none
printf "file '%s/a.mp4'\nfile '%s/b.mp4'\nfile '%s/c.mp4'\nfile '%s/d.mp4'\n" "$WORK" "$WORK" "$WORK" "$WORK" > "$WORK/concat.txt"
ffmpeg -hide_banner -loglevel error -f concat -safe 0 -i "$WORK/concat.txt" -c copy -movflags +faststart -y "$OUTPUT"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate -of json "$OUTPUT"
ffmpeg -hide_banner -v error -i "$OUTPUT" -f null -
