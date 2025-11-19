# Goose Demo Playbook

Use this flow when narrating the parallel subagents story:

1. **Start services**
   ```bash
   pnpm dev:all
   ```
   This launches Vite (frontend) and the SSE proxy (`server/gooseProxy.ts`). The proxy streams `asl_listeners.yaml` so the Subagents panel fills immediately.

2. **Confirm mock provider**
   ```bash
   echo $GOOSE_PROVIDER   # expect `mock` for offline demo
   ```
   Swap to a real provider (`anthropic`, `openai`, etc.) once credentials are available.

3. **CLI smoke test**
   ```bash
   goose run --recipe "Say: hi" --provider ${GOOSE_PROVIDER:-mock} --model ${GOOSE_MODEL:-mock-lite}
   ```
   Verifies the Goose binary and provider credentials.

4. **Parallel listeners log**
   ```bash
   goose run --recipe goose/recipes/asl_listeners.yaml --provider ${GOOSE_PROVIDER:-mock} --model ${GOOSE_MODEL:-mock-lite}
   ```
   Take a screenshot of the 10–12 line log for the slide deck.

5. **Role play orchestration**
   Visit the app (`http://localhost:5173`), open the Subagents panel, enter Practice mode, and perform a couple of gestures. Confirm the panel shows:
   - `LOG` entries for gesture/voice/planner events.
   - `GOOSE_LOG` lines from the SSE stream.

6. **Optional deep-dive recipes**
   Each subagent has a dedicated recipe:
   ```bash
   for recipe in voice_listener gesture_interpreter intent_router lesson_planner \
                 attribution_guardian prefetcher coach_adult coach_kid \
                 progress_tracker permission_steward safety_monitor; do
     goose run --recipe goose/recipes/${recipe}.yaml --provider ${GOOSE_PROVIDER:-mock} --model ${GOOSE_MODEL:-mock-lite}
   done
   ```
   Keep the outputs as appendices for the devlog.

7. **Capture artifacts**
   - Subagents panel video (screen recording) showing live logs while gestures fire.
   - Exported log file from the panel.
   - CLI outputs from the listeners and conductor recipes.

With these artifacts you can demonstrate multi-agent readiness without hitting live APIs.

## ASLLVD Pipeline Demo

Use this flow to demonstrate the ASLLVD dataset ingestion pipeline:

1. **Environment setup**
   ```bash
   export DATASET=ASLLVD
   export ASLLVD_COOKIE=your_cookie_here  # ⚠️ Never commit to git
   export DATA_ROOT=/path/to/large/storage
   ```

2. **Ingest phase**
   ```bash
   goose run --recipe goose/recipes/asllvd_ingest.yaml
   ```
   Shows auth check and bulk download orchestration.

3. **Normalize phase**
   ```bash
   goose run --recipe goose/recipes/asllvd_normalize.yaml
   ```
   Demonstrates ffmpeg pipeline for standardization.

4. **Pack building**
   ```bash
   goose run --recipe goose/recipes/asllvd_build_packs.yaml
   ```
   Illustrates metadata generation and pack assembly.

5. **Coverage verification**
   ```bash
   goose run --recipe goose/recipes/asllvd_verify.yaml
   ```
   Shows automated quality gates (≥90% coverage requirement).

6. **App integration test**
   ```bash
   pnpm dev
   # Visit app and confirm DATASET=ASLLVD attribution modal
   ```

**Demo artifacts:**
- Pipeline execution logs showing progress
- Generated `data/processed/asllvd/labels.jsonl`
- Coverage report in `artifacts/reports/`
- Attribution modal screenshot with ASLLVD citation
