#!/usr/bin/env python3
import csv
import json
import os
import subprocess
from pathlib import Path
from typing import Optional, Tuple

BASE_RAW = Path("data/raw/asllvd")
BASE_MANIFEST = Path("data/asllvd_manifest.csv")
BASE_OUT = Path("data/processed/asllvd")

# Ensure output dirs exist
for p in [BASE_OUT, BASE_OUT/"tmp"]:
    p.mkdir(parents=True, exist_ok=True)


def run(cmd):
    print("RUN:", " ".join(cmd))
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    return res.returncode, res.stdout


def probe_video(input_path: Path) -> Tuple[Optional[float], Optional[float]]:
    # Returns fps and duration (seconds)
    if not input_path.exists():
        return None, None
    # fps from avg_frame_rate
    cmd_fps = ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=avg_frame_rate", "-of", "default=nw=1:nk=1", str(input_path)]
    rc, out = run(cmd_fps)
    fps = None
    if rc == 0:
        try:
            fps_str = out.strip()
            if "/" in fps_str:
                a,b = fps_str.split("/")
                fps = float(a) / float(b)
            else:
                fps = float(fps_str)
        except Exception:
            fps = None
    # duration
    cmd_dur = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(input_path)]
    rc, out = run(cmd_dur)
    dur = None
    if rc == 0:
        try:
            dur = float(out.strip())
        except Exception:
            dur = None
    return fps, dur


def ensure_dirs(*paths: Path):
    for p in paths:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.parent.mkdir(parents=True, exist_ok=True)


def main():
    manifest_path = BASE_MANIFEST
    if not manifest_path.exists():
        print(f"Manifest not found: {manifest_path}")
        return 1

    total_rows = 0
    total_clips = 0
    successes = 0
    failures = 0

    summary_lines = []

    with open(manifest_path, newline=) as f:
        reader = csv.DictReader(f)
        # Normalize header keys to lowercase for resilience
        rows = []
        for row in reader:
            if not any(row.values()):
                continue
            rows.append(row)
        total_rows = len(rows)

        for idx, row in enumerate(rows):
            # Determine video filename
            filename = row.get(filename) or row.get(video_filename) or row.get(video) or row.get(name)
            if not filename:
                print(f"Row {idx+1}: missing filename; skipping")
                failures += 1
                continue
            input_path = BASE_RAW / filename
            if not input_path.exists():
                print(f"Row {idx+1}: input video not found: {input_path}")
                failures += 1
                continue

            start_frame = row.get(start_frame)
            end_frame = row.get(end_frame)
            try:
                start_frame_int = int(start_frame) if start_frame not in (None, , NA) else None
            except Exception:
                start_frame_int = None
            try:
                end_frame_int = int(end_frame) if end_frame not in (None, , NA) else None
            except Exception:
                end_frame_int = None

            fps, duration = probe_video(input_path)
            if fps is None or duration is None:
                print(f"Row {idx+1}: could not probe video fps/duration: {input_path}")
                # Still attempt with default values
                if fps is None:
                    fps = 30.0
                if duration is None:
                    duration = 0.0

            start_time = 0.0
            clip_duration = None
            if start_frame_int is not None and end_frame_int is not None:
                # compute times
                start_time = max(0.0, start_frame_int / fps)
                clip_duration = (end_frame_int - start_frame_int + 1) / float(fps)
                if clip_duration <= 0:
                    print(f"Row {idx+1}: non-positive clip duration; skipping")
                    failures += 1
                    continue
            elif duration > 0:
                # process entire video
                start_time = 0.0
                clip_duration = duration
            else:
                # fallback
                start_time = 0.0
                clip_duration = duration if duration > 0 else 1.0

            video_id = Path(filename).stem
            clip_dir = BASE_OUT / video_id / clips
            poster_dir = BASE_OUT / video_id / posters
            clip_dir.mkdir(parents=True, exist_ok=True)
            poster_dir.mkdir(parents=True, exist_ok=True)

            if start_frame_int is not None and end_frame_int is not None:
                clip_id = f"{video_id}_{start_frame_int:08d}_{end_frame_int:08d}"
            else:
                clip_id = f"{video_id}_full"
            clip_path = clip_dir / f"{clip_id}.mp4"
            poster_path = poster_dir / f"{clip_id}_poster.png"

            # Build ffmpeg command for clip
            # Ensure deterministic scaling to 320px width
            clip_cmd = [
                ffmpeg,-y,-hide_banner,-loglevel,error,
                -ss, f"{start_time:.6f}",
                -i, str(input_path),
                -t, f"{clip_duration:.6f}",
                -c:v,libx264,
                -vf,fps=30,scale=320:-2,
                -c:a,aac,-b:a,128k,
                -movflags,+faststart,
                str(clip_path)
            ]
            rc, out = run(clip_cmd)
            total_clips += 1
            if rc != 0:
                print(f"Row {idx+1}: failed to create clip {clip_path}")
                failures += 1
                continue

            # Generate poster from mid-frame
            mid_time = start_time + max(clip_duration, 0.0) / 2.0
            poster_cmd = [
                ffmpeg,-y,-hide_banner,-loglevel,error,
                -ss, f"{mid_time:.6f}",
                -i, str(input_path),
                -frames:v, 1,
                -vf,scale=320:-1,
                -pix_fmt,rgb24,
                str(poster_path)
            ]
            rc2, out2 = run(poster_cmd)
            if rc2 != 0:
                print(f"Row {idx+1}: failed to create poster {poster_path}")
                # Do not fail whole pipeline due to poster
            else:
                pass

            successes += 1

    # Write summary
    summary = {
        total_videos: total_rows,
        total_clips: total_clips,
        successes: successes,
        failures: failures
    }
    summary_path = BASE_OUT / processing_summary.json
    with open(summary_path, w) as sf:
        json.dump(summary, sf, indent=2)

    # Print human-friendly summary
    print("Processing Summary:")
    print(f"- Total manifest entries processed: {total_rows}")
    print(f"- Total clips attempted: {total_clips}")
    print(f"- Successful clips: {successes}")
    print(f"- Failures: {failures}")
    print(f"- Summary written to {summary_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
