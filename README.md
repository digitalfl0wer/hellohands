# hellohands

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

## Dataset Attribution (MS-ASL)

This project uses the MS-ASL dataset for research and prototyping purposes.
Please review and comply with the Computational Use of Data Agreement (C-UDA)
included with the dataset. All credits and rights remain with the original
authors and institutions.

Reference:
Vaezi Joze, H. R., & Koller, O. (2019). MS-ASL: A Large-Scale Data Set and
Benchmark for Understanding American Sign Language. BMVC 2019.

Files bundled with MS-ASL: MSASL_train.json, MSASL_val.json, MSASL_test.json,
MSASL_classes.json, MSASL_synonym.json, and the C-UDA license document.

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

```
pnpm hand:model
# or
curl -L \
  -o public/hand_landmarker.task \
  https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
```

If your network blocks the CDN, download the file manually and place it at
`public/hand_landmarker.task`. The app falls back to the CDN when the local copy
is missing.

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
