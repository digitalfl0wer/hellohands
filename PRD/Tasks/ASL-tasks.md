# MS-ASL Pipeline Task Breakdown

## Environment and Storage
- **chore(env) [S]:** Document `.env` defaults and prerequisites (Node LTS, pnpm/npm, ffmpeg, disk guidance). Provide `scripts/check-env.ts` or simple instructions to validate setup.
- **chore(git) [S]:** Confirm `.gitignore` excludes raw media while keeping metadata (labels, logs). Add `data/README.md` describing symlink strategy.
- **feat(scaffold) [S]:** Create `data/processed/msasl/{clips,labels.jsonl}` placeholders and ensure directories exist during prep runs.

## Core Prep Scripts
- **feat(adapter) [M]:** `adapters/msasl.ts` converts `MSASL_{train,val,test}.json` into normalized records with validation errors surfaced clearly.
- **feat(filter) [S]:** `scripts/msasl_filter.ts` supports `--subset {100|200|500|1000}` and emits deterministic filtered JSON with resume markers.
- **feat(download) [M]:** `scripts/msasl_download.ts` downloads sources, respects `DOWNLOAD_RETRIES`, logs to `failed.csv`, and skips cached files.
- **feat(trim) [M]:** `scripts/msasl_trim.ts` wraps ffmpeg to cut clips, enforce `${VIDEO_FPS}`/`${VIDEO_SIZE}`, and mark completion atomically.
- **feat(labels) [S]:** `scripts/msasl_emit_labels.ts` writes unified `labels.jsonl` with relative paths and consistent IDs.

## Orchestration and Tooling
- **feat(cli) [M]:** `scripts/msasl_prep.ts` chains filter, download, trim, and label steps with restart flags and progress output.
- **chore(pkg) [S]:** Add npm scripts (`msasl:prep100|200|500|1000`, dry-run flag) to `package.json` and document usage.
- **feat(stats) [S]:** Generate per-class and per-signer summaries plus duration histograms; emit `summary.json`.

## Validation and Observability
- **feat(tests) [S]:** Vitest coverage for adapters and label emitter using fixtures; enforce schema via TypeScript and JSON schema.
- **feat(logs) [S]:** Consistent logging format (progress percent, ETA, retries) and optional JSONL log for downstream analysis.
- **feat(qc) [S]:** Integrity check script (size or checksum) and random spot-audit player to verify trimmed clips.

## Documentation
- **docs(readme) [S]:** Expand README with dataset setup, attribution, and prep command examples.
- **docs(pipeline) [S]:** Dedicated guide covering env vars, troubleshooting (dead links, quota errors), and cleanup tips.

## Phase 2 (ASLLVD) Placeholders
- **feat(adapter) [M]:** `adapters/asllvd.ts` stub mapping SignStream/XML data into the unified schema with signer-aware splits.
- **docs(asllvd) [S]:** Outline multi-view handling, licensing considerations, and data volume expectations for ASLLVD.
