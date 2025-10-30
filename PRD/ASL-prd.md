# ASL Video Data - Product Requirements

## Purpose
Provide a repeatable pipeline that converts MS-ASL metadata into curated, one-handed practice assets for Hello Hands, with a clear path to expand into ASLLVD. The pipeline must emit a unified `labels.jsonl` that powers both the app and baseline model experiments.

## Scope and Phases
- **Phase 1 (MS-ASL):** Filter, download, trim, and standardize MS-ASL video clips for the 100/200/500/1000-class subsets.
- **Phase 2 (ASLLVD):** Integrate multi-view studio captures and annotations once access is confirmed, without refactoring the downstream consumers.

## Data Policy
- Never commit raw or processed video files to Git. Store assets under `${DATA_ROOT}` as defined in `.env`.
- Allow optional symlink `./data/msasl -> ${DATA_ROOT}/msasl` for developer convenience.
- Commit only lightweight metadata (`labels.jsonl`, logs, summaries) and documentation.

## Directory Layout
```
data/
  msasl/                     # symlink or ignored directory with raw downloads
  processed/
    msasl/
      clips/                 # trimmed, standardized MP4s (gitignored)
      labels.jsonl           # unified metadata (committed)
practice/
  whitelist.json             # one-handed allow list
  packs.manual.json          # fixed lesson packs
  vocab.map.json             # aliases and one-handed flag
  blacklist.json             # optional deny list
```

## Environment Configuration
`.env` keys (document defaults and overrides):
- `DATA_ROOT=/abs/path/to/datasets`
- `VIDEO_FPS=30`
- `VIDEO_SIZE=256` (width; maintain aspect ratio with -2)
- `DOWNLOAD_RETRIES=3`
- `SUBSET=100` (switch among 100|200|500|1000)

Prerequisites: Node LTS, pnpm or npm, ffmpeg (with libx264), optional `yt-dlp`, ample disk space (~100 GB for upper subsets).

## Pipeline Requirements
1. **Filter:** Select subset classes (label < N) and emit deterministic filtered metadata. Support resume markers for long runs.
2. **Download:** Fetch source videos, retry up to `DOWNLOAD_RETRIES`, and log failures to `failed.csv`. Skip already downloaded files.
3. **Trim and Standardize:** Use ffmpeg to clip according to timestamps and re-encode with `${VIDEO_FPS}`, `${VIDEO_SIZE}`, `libx264`, `yuv420p` video, and no audio.
4. **Emit Labels:** Produce `processed/msasl/labels.jsonl` referencing relative paths, unique IDs (`msasl_{split}_{index}`), signer IDs, class names, start/end times, and optional bounding boxes.
5. **Stats Report:** Summarize per-class counts, signer coverage, duration histograms, and overall success/failure counts.
6. **Prep Orchestration:** Provide a CLI wrapper (`scripts/msasl_prep.ts`) that chains the steps with restart support and exposes subset shortcuts (`msasl:prep100`, etc.).

## Unified Schema
Each line in `labels.jsonl` must contain:
```
{
  "id": "msasl_train_000001",
  "dataset": "msasl",
  "subset": "MS-ASL100",
  "split": "train",
  "path": "data/processed/msasl/clips/000/000001.mp4",
  "label": 42,
  "class_name": "WATER",
  "signer_id": "S123",
  "start": 12.67,
  "end": 14.02,
  "box": [0.12, 0.20, 0.72, 0.85]
}
```
All downstream consumers must rely on this schema. Provide TypeScript types and sample fixtures for validation.

## Validation and Observability
- Unit tests for adapters and label emitters using fixtures.
- Structured logging for progress, ETA, retry counts, and disk usage; write `summary.json` and `failed.csv`.
- Integrity checks (file size or checksum) before marking clips complete.
- Coverage report flagging missing glosses, signer imbalance, or dropped clips.
- Optional spot-check script to play random processed clips for manual QA.

## Integration Points
- **MCP:** Expose dataset summaries or label slices through MCP tools so the frontend can mock responses without full data.
- **Frontend:** Provide stub `labels.jsonl` and sample assets for early integration; synchronize with PRD/Tasks items.
- **Goose:** Recipes should trigger filter/download/trim/emit steps and surface logs for the demo story.

## Success Criteria
- MS-ASL100 pipeline completes on a developer workstation with documented runtime and disk usage.
- `labels.jsonl` validates against schema, matches practice allow list, and feeds the Hello Hands app without manual edits.
- Baseline training run (e.g., I3D/TimeSformer) reaches above random accuracy using the emitted labels.
- Adding ASLLVD only requires implementing a new adapter and updating configuration, not refactoring the pipeline core.

## Risks and Mitigations
- **Dead URLs:** Implement retries, maintain `failed.csv`, and allow resume runs.
- **Class Imbalance:** Generate per-class stats and recommend caps for MVP speed.
- **Disk Pressure:** Support optional cleanup of raw downloads post-trim and document space requirements upfront.
- **Licensing:** Keep attribution text, cite dataset agreements, and restrict redistributed assets to what terms allow.

## Definition of Done
- Pipeline scripts, documentation, and tests merged; `.env` instructions verified; `labels.jsonl` example committed.
- README updated with dataset attribution and setup steps.
- Goose recipe executes prep stage end to end with clear logs.
