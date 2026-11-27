#!/usr/bin/env python3
"""Retiming captions to match the non-destructive focused IncomeFlow edit."""
from __future__ import annotations
import re
import sys
from pathlib import Path

WINDOWS = ((0.0, 14.1088), (18.2755, 27.9282), (33.2986, 132.6505), (135.0, 150.0))

def decode(value: str) -> float:
    h, m, rest = value.split(":")
    sec, millis = rest.split(",")
    return int(h)*3600 + int(m)*60 + int(sec) + int(millis)/1000

def encode(seconds: float) -> str:
    ms = max(0, round(seconds * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    sec, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{sec:02},{ms:03}"

def main(inp: Path, out: Path) -> None:
    original = inp.read_text(encoding="utf-8-sig")
    result: list[str] = []
    offset = 0.0
    count = 0
    for block in re.split(r"\r?\n\s*\r?\n", original.strip()):
        lines = block.splitlines()
        timing = next((line for line in lines if " --> " in line), None)
        if not timing:
            continue
        start, end = [decode(x.strip()) for x in timing.split(" --> ")]
        text = "\n".join(lines[lines.index(timing)+1:])
        offset = 0.0
        for a, b in WINDOWS:
            cut_start, cut_end = max(start, a), min(end, b)
            if cut_end - cut_start > 0.08:
                count += 1
                x, y = offset + cut_start-a, offset + cut_end-a
                result.append(f"{count}\n{encode(x)} --> {encode(y)}\n{text}\n")
            offset += b-a
    out.write_text("\n".join(result) + "\n", encoding="utf-8")
    assert count > 30, f"Unexpectedly few subtitle cues: {count}"
    print(f"Prepared {count} timed cues at {out}")

if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
