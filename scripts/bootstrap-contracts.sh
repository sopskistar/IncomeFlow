#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p contracts/lib/reactive-lib-omni contracts/lib/forge-std
work=$(mktemp -d)
trap 'rm -f "$work/reactive.tar.gz" "$work/forge-std.tar.gz"; rmdir "$work"' EXIT
curl --fail --location --retry 2 --max-time 120 https://codeload.github.com/Reactive-Network/reactive-lib-omni/tar.gz/3ade0dcf1d27e67e5783ef807e73a1b9e0c0cce8 -o "$work/reactive.tar.gz"
curl --fail --location --retry 2 --max-time 120 https://codeload.github.com/foundry-rs/forge-std/tar.gz/refs/tags/v1.9.7 -o "$work/forge-std.tar.gz"
tar -xzf "$work/reactive.tar.gz" --strip-components=1 -C contracts/lib/reactive-lib-omni
tar -xzf "$work/forge-std.tar.gz" --strip-components=1 -C contracts/lib/forge-std
