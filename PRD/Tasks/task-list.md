TASK LIST (Cursor / GitHub Issues)

Labels: feat, ui, mcp, infra, docs, test, polish • Est.: S ≤1h, M 1–3h, L 3–6h

A) Environment & Storage

chore(env) [S]: Validate .env (DATA_ROOT, VIDEO_FPS, VIDEO_SIZE, SUBSET); doc ffmpeg + disk needs.

chore(git) [S]: Ignore raw/processed media; allow labels.jsonl + logs.

feat(data) [S]: Scaffold data/processed/msasl/{clips,labels.jsonl} + data/README.md (layout + symlink).

B) Core Prep Scripts (MS-ASL)

feat(adapter) [M]: adapters/msasl.ts → normalize MS-ASL JSON rows to unified schema.

feat(filter) [S]: scripts/msasl_filter.ts → --subset 100|200|500|1000 (label < N), deterministic output.

feat(download) [M]: scripts/msasl_download.ts → retries=${DOWNLOAD_RETRIES}, failed.csv, resume.

feat(trim) [M]: scripts/msasl_trim.ts → ffmpeg trim, fps=${VIDEO_FPS}, size=${VIDEO_SIZE}, skip completed.

feat(labels) [S]: scripts/msasl_emit_labels.ts → write processed/msasl/labels.jsonl with relative paths & stable IDs.

feat(stats) [S]: dataset stats (per-class counts, signer counts, duration hist).

C) Validation & Observability

test(adapter) [S]: fixtures + unit tests to lock schema.

feat(logs) [S]: structured logging (progress %, ETA, retries) + summary.json.

feat(qc) [S]: integrity checks + spot-audit script to play random trimmed clips.

D) Practice (Fixed + One-Handed)

feat(practice-loader) [M]: Enforce categories (essentials,social_basics); enforce one-handed (vocab.map.json).

feat(packs) [S]: Respect whitelist.json / packs.manual.json; write practice/missing_items.log.

ui(receptive) [M]: Video player + 4-option MCQ + keyboard 1-4; session queue & scoring.

ui(productive) [M]: Gloss prompt + optional reference clip; webcam record; self-mark pass/fail.

feat(progress) [S]: Progress store (unlock at 80% Receptive).

docs(practice) [S]: Usage + how to swap glosses safely.

E) Frontend Foundations

infra(ui) [S]: Vite + Tailwind; tokens (colors, radii, spacing, type).

ui(shell) [S]: App shell, Settings pill, Level cards (locked/unlocked).

a11y [S]: Contrast ≥4.5:1, focus-visible, captions on by default.

F) MCP & Service Layer

mcp(server) [M]: Minimal MCP server endpoints: packs.list, packs.get, practice.next, license.info.

infra(app) [S]: Service layer to switch between local fixtures and MCP.

docs(mcp) [S]: README quickstart + endpoint shapes.

G) Agent Orchestration (Goose)

chore(goose) [S]: Add goose/recipes/ and configure provider.

feat(goose-orchestrator) [S]: asl_mvp.yaml with vars subset|fps|size|phases.

feat(goose-prep) [S]: asl_prep.sub.yaml (filter → download → trim → labels).

feat(goose-practice) [S]: asl_practice.sub.yaml (validate → packs → coverage).

feat(goose-train/eval) [S]: asl_train.sub.yaml, asl_eval.sub.yaml.

docs(goose) [S]: Run commands for Cursor terminal + screenshots/logs for judges.

H) Baseline Model & Eval (optional but nice)

feat(dl) [M]: VideoDataModule (reads labels.jsonl).

feat(model) [M]: I3D/TimeSformer baseline config + train loop.

feat(eval) [S]: Top-1/Top-5 + confusion matrix export.

docs(pipeline) [S]: Prep steps, env vars, troubleshooting.

I) Demo Readiness

polish(perf) [S]: Lazy load media; small clip durations.

polish(record) [S]: Record 90-sec demo run (Lv1 → ★5 unlock).

docs(readme) [S]: Final Quickstart (prep → packs → run), dataset attribution, Goose overview.

Quickstart (README block to paste)
# 0) Env & tooling
nvm use || (nvm install --lts && nvm use)
corepack enable
pnpm install
cp .env.example .env  # set DATA_ROOT, FPS, SIZE, SUBSET

# 1) Prep MS-ASL subset (filter → download → trim → labels)
pnpm msasl:prep100

# 2) Practice files (fixed, one-handed)
# edit practice/*.json as needed, then generate coverage
pnpm practice:coverage

# 3) Run orchestrator (Goose)
goose run --recipe goose/recipes/asl_mvp.yaml --vars subset=100 phases=prep,practice

# 4) Start app
pnpm dev

.gitignore (snippet)
node_modules/
.env
data/**/videos/**
data/**/clips/**
*.mp4
*.webm
*.m4v
*.avi
