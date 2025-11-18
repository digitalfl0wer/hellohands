##HelloHands ✨✋🏾

Learn + practice ASL with bite-size sessions, clean UI, and playful AI helpers.

**I’m Brie**; a builder, Black mom, wife, coder, and community girlie who believes tech should actually help people. I made HelloHands because:
  •My 3-year-old has apraxia, and ASL became part of our family language. This app is our bridge—something gentle, repeatable, and joyful   to help us both practice.
  •I wanted a welcoming, low-friction way to practice ASL in short bursts.
  •I’m obsessed with product polish and outcomes: fewer taps, more wins, and learning that sticks.
  •I like shipping things that feel like care. If it doesn’t feel kind, it’s not done.

**What makes HelloHands different**

  •Daily micro-packs: Essentials + Social Basics (one-handed signs first, no overwhelm).
  •Standars or Kid mode
  •Creator-grade UX: dark UI, bold typography, zero flicker.
  •Agentic under the hood: Goose + sub-agents orchestrate prep → practice → (future) train → eval.
  •Respectful data flow: curated datasets kept out of git; clear attribution and boundaries.

Demo 

🎥 Live demo: [Add your Loom or YouTube link]
🌐 Deployed app: hellohands.vercel.app

Screenshots

**Tech Stack**
  •Frontend: React + TypeScript, Vite, Tailwind, Radix Primitives
  •State/Data: Local JSONL manifests (data/labels.jsonl, pack metadata)
  •Media: ffmpeg pipeline (normalize, compress, faststart)
  •Agents: Goose CLI + sub-recipes (prep/practice; train/eval later)
  •Tooling: pnpm, Cursor, Conda (for ffmpeg), lint-staged



Quickstart
# 1) Install
pnpm install

# 2) Dev
pnpm dev
# visit http://localhost:3000

# 3) Optional: run Goose prep to (re)build practice packs
goose run --recipe goose/recipes/asl_prep.yaml \
  --param subset=100 --param category=essentials --param pack_id=L1-ESSENTIALS

# 4) Media (if you’re compressing new clips)
# requires ffmpeg; conda users often do:
#   conda install -c conda-forge ffmpeg
bash scripts/compress_all.sh


If Goose hiccups: run goose validate on asl_prep.yaml and reload.





Scripts & Tips
# Validate Goose recipes
goose validate --recipe goose/recipes/asl_prep.yaml

# Generate a small demo subset
goose run --recipe goose/recipes/asl_prep.yaml --param subset=25 --param pack_id=DEMO

# ffmpeg (example) – normalize & web-optimize
ffmpeg -y -i input.mp4 -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -movflags +faststart -c:a aac -b:a 128k output.mp4


Conda gotchas: If ffmpeg isn’t found, try conda install -c conda-forge ffmpeg.

Roadmap (taste + traction)

Vibes: Afro-chic dark UI, electric accents, clean borders

Learning: Mini-lessons as optional “Start mini-lesson” chips

Agency: “Panic token” 1/day at Level 2 for quick reveal without penalty

Social: Opt-in sharing of streaks & wins; no public shame, ever

Credits

Product + Engineering: Brie Spann (@digitalflower)
Thanks: Resilient Coders fam, mentors, and the communities that keep us honest.
— Brie ✨

License

This repo’s code is MIT unless noted otherwise. Media and datasets are governed by their original licenses and are not included here.
Datasets & Attribution

## Dataset Selection

HelloHands supports multiple ASL datasets via the `DATASET` environment variable:

- `DATASET=MSASL` (default): Uses MS-ASL dataset
- `DATASET=ASLLVD`: Uses ASLLVD dataset (requires separate ingestion)

## Dataset Attribution (MS-ASL)

This project uses the MS-ASL dataset for research and prototyping purposes.
Please review and comply with the Computational Use of Data Agreement (C-UDA)
included with the dataset. All credits and rights remain with the original
authors and institutions.

## Dataset Attribution (ASLLVD)

This project uses the American Sign Language Lexicon Video Dataset (ASLLVD) for research and prototyping purposes.

**Citation:**
```
@article{athitsos2008american,
  title={American sign language lexicon video dataset},
  author={Athitsos, Vassilis and Neidle, Carol and Sclaroff, Stan and Nash, Joan and Stefan, Alexandra and Yuan, Quan and Thangali, Ashwin},
  journal={Proceedings of the IEEE International Conference on Computer Vision Workshops},
  pages={1--8},
  year={2008},
  publisher={IEEE}
}
```

ASLLVD is distributed under the terms specified by Boston University. Please refer to the original dataset documentation for complete licensing information.

## ASLLVD Pipeline via Goose

**⚠️ Security Warning:** ASLLVD ingestion requires authentication. Set `ASLLVD_COOKIE` environment variable with your Boston University credentials. Never commit credentials to git.

**One-command pipeline:**
```bash
# 1. Ingest raw videos
goose run --recipe goose/recipes/asllvd_ingest.yaml

# 2. Normalize assets (trim, fps, size)
goose run --recipe goose/recipes/asllvd_normalize.yaml

# 3. Build packs and labels
goose run --recipe goose/recipes/asllvd_build_packs.yaml

# 4. Verify coverage (≥90% per pack)
goose run --recipe goose/recipes/asllvd_verify.yaml
```

**Environment Setup:**
```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with your ASLLVD_COOKIE and set DATASET=ASLLVD

# Optional: Set custom data root
export DATA_ROOT=/path/to/large/storage
```

**Storage Requirements:**
- Raw videos: `data/raw/asllvd/` (~50GB, not in git)
- Processed clips: `data/processed/asllvd/clips/` (git-tracked)
- Posters: `data/processed/asllvd/posters/` (git-tracked)

Reference:
Vaezi Joze, H. R., & Koller, O. (2019). MS-ASL: A Large-Scale Data Set and
Benchmark for Understanding American Sign Language. BMVC 2019.

Files bundled with MS-ASL: MSASL_train.json, MSASL_val.json, MSASL_test.json,
MSASL_classes.json, MSASL_synonym.json, and the C-UDA license document.

MS-ASL (Phase 1, references only): metadata informs our curated list.

ASLLVD (Phase 2 plan): used for future packs; not redistributed here.

Attribution (ASLLVD):
“ASLLVD – American Sign Language Lexicon Video Dataset,”
Neidle, C., Sclaroff, S., Athitsos, V., Nash, J., et al.
Boston University. Please see the ASLLVD site for licensing and citation details.





## Quickstart

```bash
pnpm install
pnpm dev             # Vite app on http://localhost:5173
pnpm goose:proxy     # (optional) Goose SSE proxy on http://localhost:5174
pnpm mcp:server      # (optional) MCP mock on http://localhost:5175/api/mcp
```

Environment knobs:

- `VITE_USE_VOICE=1` enables the Web Speech API voice layer (fallbacks gracefully when unavailable).
- `VITE_USE_MCP=1` switches practice endpoints to the MCP mock server. Leave unset to use local fixtures.

### Multimodal Demo Flow

1. Run `pnpm dev:all` to start Vite and the Goose proxy together.
2. Optionally launch the MCP mock in a separate terminal (`pnpm mcp:server`).
3. Visit the app and toggle Kid Mode, gestures, or voice from the Settings pill.
4. Open the Subagents panel to watch BroadcastChannel events stream from voice, gesture, planner, and Goose agents.

### Practice Pipeline

- Regenerate whitelist-enforced packs: `pnpm practice:generate`
- Validate pack coverage against processed MS-ASL labels: `pnpm practice:coverage`
- Run the full chain (`validate → generate → coverage`): `pnpm practice:all`

See `docs/practice-pipeline.md` for the full workflow, including gloss updates and troubleshooting.


## Goose validation (Section 12)

1) Set a provider/model (defaults to mock for local demos):

```
export GOOSE_PROVIDER=anthropic
export GOOSE_MODEL=claude-3-5-sonnet-latest
# or stay on the mock provider for offline demos
```

2) Verify Goose CLI works:

```
goose run --recipe "Say: hi"
```

3) Try the parallel listeners mock:

```
goose run --recipe goose/recipes/asl_listeners.yaml
```

4) Run the MVP conductor with values:

```
goose run --recipe goose/recipes/asl_mvp.yaml --values subset=100 fps=30 size=256 category=essentials pack_id=L1-ESSENTIALS
```

## Hand model setup

The practice view expects a local copy of the MediaPipe hand landmarker model.

We load the model **locally** from `/models/hand_landmarker.task` in dev and prod
so there are no runtime CDN calls. To fetch the model, run:

```
pnpm hand:model
# or
curl -L \
  -o public/models/hand_landmarker.task \
  https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
```

If your network blocks the CDN, download the file manually and place it at
`public/models/hand_landmarker.task`.

## MCP mock server

We ship a lightweight MCP-style mock so the UI can request practice packs over HTTP.

```
pnpm mcp:server
# serves http://localhost:5175/api/mcp
```

Set `VITE_USE_MCP=1` (see `.env.example`) to opt into the MCP responses; otherwise the
app uses static fixtures. Restart Vite after changing the flag.

## MS-ASL data pipeline

```
pnpm msasl:filter
pnpm msasl:download
pnpm msasl:trim
pnpm msasl:labels
pnpm msasl:stats
```

See `docs/msasl-pipeline.md` for environment variables, failure logs, and step-by-step
guidance.
