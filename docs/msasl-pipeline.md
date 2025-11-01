# MS-ASL Pipeline Notes

## Environment

Set `DATA_ROOT` to the directory containing the MS-ASL metadata (`meta/` etc.).
Copy `.env.example` to `.env` and adjust values:

```
DATA_ROOT=/absolute/path/to/dataset
SUBSET=100            # optional class cutoff
DOWNLOAD_RETRIES=3
VIDEO_FPS=30
VIDEO_SIZE=256
```

## Steps

1. **Filter** raw metadata (optional subset by label id):
   ```bash
   pnpm msasl:filter
   ```
   Produces JSON in `${DATA_ROOT}/msasl/filtered/` containing sanitized records.

2. **Download** media assets (supports YouTube via `yt-dlp`):
   ```bash
   pnpm msasl:download
   ```
   Respects existing files, retries transient errors, and logs failures to
   `${DATA_ROOT}/msasl/failed.csv`.

3. **Trim** videos with ffmpeg to normalized size/FPS:
   ```bash
   pnpm msasl:trim
   ```
   Outputs clips to `data/processed/msasl/clips/<shard>/<id>.mp4` and logs any
   missing raw media to `trim_failed.csv`.

4. **Emit labels** for downstream training/eval:
   ```bash
   pnpm msasl:labels
   ```
   Generates `data/processed/msasl/labels.jsonl` with unified metadata.

5. **Compute stats** (optional sanity check):
   ```bash
   pnpm msasl:stats
   ```
   Writes `data/processed/msasl/summary.json` with class/signers/duration
   breakdowns.

Each step can be rerun independently; scripts skip completed work where
possible.
