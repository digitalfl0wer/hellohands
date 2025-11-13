# Hello Hands – Product Requirements (Current Build)

## Context

Hello Hands offers a guided, multimodal ASL micro-lesson focused on a five-star progression loop. The current codebase delivers the MVP experience with live camera gestures, voice commands, and Goose subagents instrumentation so stakeholders can evaluate usability, accessibility, and orchestration depth within a 90-second demo window.

## Users & Value

- **Learners & Caregivers:** Earn confidence quickly through touch-first playback and optional gesture/voice assistive layers.
- **Hackathon Judges & Sponsors:** Observe agent coordination, instrumentation, and inclusive design in a condensed walkthrough.
- **Internal Team:** Build toward a scalable practice pipeline that curates one-handed MS-ASL clips for future packs.

## Experience Goals

- Touch controls always succeed; the forthcoming **gesture worker runtime** keeps HUD interactions smooth while countdown + refractory logic stabilize accepts.
- Gesture and voice accepts **share the same 3-2-1 countdown path**, so learners experience consistent pacing regardless of modality.
- Level 1 completion (five stars) and Level 2 unlock are achievable within one session even as gesture validation tightens.
- Kid Mode increases affordances (copy, color, spacing) without fragmenting flows.
- Attribution is present wherever media appears; licensing remains transparent across **MS-ASL and ASLLVD** sources.
- Goose agents and the BroadcastChannel bus surface real-time activity plus new telemetry (fps, dropped frames, queue depth).

## Primary Flows

1. **Welcome & Level Select** – Level cards communicate progress, Kid Mode, attribution context, and indicate which dataset (MS-ASL vs ASLLVD) is active via feature flag.
2. **Directions Gate** – Manual fallback plus 3-2-1 countdown into the lesson establishes pacing; gate now primes the worker runtime + voice parity countdown path.
3. **Lesson Loop** – Poster preview, clip playback, Replay/Slow/Next, feedback banner, help sheet, unlock celebrations, and the shared **Accept → Countdown → Next clip** flow for gesture/voice.
4. **Practice Workspace** – Live camera feed (or worker-provided landmarks) mirrors gestures, aligns expected intent, streams recognitions (candidate/accepted/lost/countdown) onto the planner bus.
5. **Agent Console** – Right-rail Goose subagents panel visualizes event flow, fps metrics, dropped frames, dataset flag changes, and exposes exportable logs.

## Feature Inventory (Implemented)

- **Design System & Shell** – Tailwind tokens and the `AppShell` frame enforce gradients, safe areas, and focus-visible styles (`src/components/AppShell.tsx`, `src/styles/tokens.css`, `tailwind.config.ts`).
- **State Management** – Zustand store persists Kid Mode, toggles, levels, stars, and clip queue with hydration guard and tests (`src/state/useLessonStore.ts`, `src/state/__tests__/useLessonStore.test.tsx`).
- **Welcome Experience** – Responsive Level cards, Kid toggle messaging, and dataset attribution summary (`src/screens/WelcomeScreen.tsx`).
- **Lesson Player** – Poster/video playback pipeline with pause, slow-mo, help sheet, and feedback banner integration (`src/components/lesson/LessonScreen.tsx`, `src/components/lesson/LessonPlayer.tsx`).
- **Gesture Layer** – Pointer-based swipe heuristics for navigation plus MediaPipe Hands detector with HUD, hold-to-emit logic, and BroadcastChannel posts (`src/hooks/useGestureInput.ts`, `src/components/CameraFeed.tsx`, `src/gestures/gestureBus.ts`).
- **Voice Layer** – Web Speech integration handling control commands, Kid Mode, level navigation, and toast hints on uncertainty (`src/hooks/useVoiceInput.ts`, `src/hooks/voiceCommandParser.ts`).
- **Gesture Runtime Spike (in progress)** – MediaPipe Tasks `GestureRecognizer` running inside a worker with throttling, smoothing, hysteresis, shared countdown path, and perf telemetry (`src/workers/gesture-worker/*`, shared config TBD).
- **Progress & Rewards** – Unlock confetti, stickers, toast sequencing, and Kid-friendly copy tied to store state (`src/App.tsx`, `src/components/ConfettiOverlay.tsx`, `src/components/UnlockSticker.tsx`).
- **Subagents & Telemetry** – BroadcastChannel bus, planner attribution tagging, logging buffer with download, and right-rail console (`src/agents/planner.ts`, `src/utils/logger.ts`, `src/components/SubagentsPanel.tsx`).
- **MCP Mock Server** – Express server exposes packs, next-item suggestions, and license endpoints to mirror production APIs (`server/mcpServer.ts`, `src/services/practiceApi.ts`).
- **Data Pipeline Foundations** – MS-ASL adapter, filter/download/trim/labels/stats scripts, and CLI wrappers documented in `docs/msasl-pipeline.md`, fulfilling Sections 0–13 of the MVP task tracker (`adapters/msasl.ts`, `scripts/msasl_*.ts`).
- **Practice Tooling** – Whitelist validation, pack generation, coverage reporting, and manual pack seeds (`scripts/practice_validate_whitelist.ts`, `scripts/practice_generate_packs.ts`, `practice/*.json`).
- **Testing & Tooling** – Vitest suites for store logic and agents, Prettier formatting hook, pnpm scripts for multimodal servers and pipeline orchestration (`package.json`, `vitest.config.ts`).

## Data & Content

- Level 1 sample assets live in `public/signs/level1` with metadata exposed via `SAMPLE_CLIPS`.
- `practice/vocab.map.json` enumerates gloss aliases and one-handed flags; whitelist ensures practice packs stay within supported gestures.
- Processed dataset output targets `data/processed/msasl/labels.jsonl` with unified schema for both UI fixtures and downstream models.
- **ASLLVD integration (planned)** will add manifests, normalized clips/posters, `data/processed/asllvd/*.jsonl`, `practice/packs.generated.json` variants, and shared attribution copy toggled via `DATASET` flags.

## Observability & QA

- Logger posts structured events (`info`/`warn`/`error`) to the bus and retains a download buffer for post-run analysis.
- Manual QA checklist and bug triage template live in `docs/`; new checklist will add fps/drop-frame gates plus ASLLVD framing/coverage review.
- `pnpm practice:all` chain validates whitelist, regenerates packs, and flags missing assets; `pnpm msasl:*` scripts provide end-to-end pipeline coverage; upcoming `pnpm asllvd:*` scripts will mirror this flow.

## Outstanding Work (New Milestones)

| Area | Milestone | Status | Notes |
| --- | --- | --- | --- |
| Gesture Runtime | **M0** Worker skeleton + contract + fps throttle | ⏳ | `gesture-worker` entrypoint + `candidate/accepted/lost/countdown_done` message schema. |
| Gesture Runtime | **M1** GestureRecognizer + smoothing + hysteresis | ⏳ | Tasks API integration, EMA/One-Euro filters, entry/exit thresholds. |
| Gesture Runtime | **M2** Hold/refractory + countdown parity | ⏳ | Shared Accept → Countdown flow for gesture + voice, HUD freeze, tunables centralized. |
| Gesture Runtime | **M3** Metrics + flags + docs | ⏳ | fps/dropped frame telemetry, logger dashboards, `WORKER_ON|COUNTDOWN|REFRACTORY|RUNTIME` toggles, troubleshooting guide. |
| ASLLVD Integration | **M0** Licensing + attribution + sign lists | ⏳ | Capture citation text, README/playbook updates, Essentials/Social Basics mapping. |
| ASLLVD Integration | **M1** Ingest manifests + normalization rules | ⏳ | `asllvd_manifest.{csv,json}` with canonical view selection + trimming specs. |
| ASLLVD Integration | **M2** Pack generation + coverage validation | ⏳ | `labels.jsonl`, `packs.generated.json`, coverage ≥90%, poster generation. |
| ASLLVD Integration | **M3** App integration + QA | ⏳ | Dataset flag wiring, countdown flow validation on new clips, QA checklist + logs. |
| Baseline Model (optional) | Sequence classifier + metrics export | 🔄 | Blocked until ASLLVD/gesture telemetry stabilizes; revisit after M3 gates. |

## Launch Checklist

- ✅ Multimodal MVP flows verified (manual, gesture, voice) with fallbacks.
- ✅ Goose subagents panel renders SSE logs via proxy.
- ✅ Data pipeline scripts and docs available for MS-ASL subset operations.
- ✅ Practice pipeline documentation and missing-item telemetry published.
- 🔄 Rehearse and capture demo video; attach recommended narrative and timing script.
- ✅ README updated with end-to-end quickstart (pnpm dev, goose proxy, MCP server, practice commands).
- 🔄 **Gesture Runtime gates:** fps stability 15–24, flap rate reduction ≥30%, Accept→Next latency ≤1.2s desktop/≤1.6s mobile.
- 🔄 **ASLLVD gates:** coverage ≥90% per pack, posters aligned, attribution modal updated, Prefetch/log export verified.

## Risks & Mitigations

- **Gesture Runtime import/compatibility:** Worker bundling, WASM size, and OffscreenCanvas availability may block Safari/mobile. Mitigation: feature flags (`RUNTIME=hands|tasks`, `WORKER_ON`), fallback to legacy hands, document hosting/CDN strategy.
- **Flap reduction regression:** Tightening thresholds might delay accepts. Mitigation: shared config presets, telemetry review (fps, queue depth, jitter), QA matrix across devices.
- **Dataset Licensing & Attribution:** ASLLVD has stricter licensing; risk of missing citations/posters. Mitigation: capture required text, add automated checklist, keep raw media outside git, store checksums.
- **Coverage gaps / broken assets:** Normalization could drop clips below 90% coverage. Mitigation: coverage report, top-gap logging, quick re-encode scripts, Prefetch smoke tests.
- **Voice/Gesture countdown parity:** Divergent paths could reintroduce jank. Mitigation: single countdown orchestrator + tie-breaker rules and automated scenario tests.

## Next Steps

1. Finish Gesture Runtime M0–M2 (worker skeleton → smoothing → countdown parity) and run perf benchmarks comparing legacy vs tasks runtime.
2. Lock ASLLVD licensing + sign lists, then kick off ingest/normalization tooling (`asllvd:*` scripts) before wiring packs into the app.
3. Extend Goose/subagents tooling to display new metrics (fps, dropped frames) and countdown events, enabling QA against the updated acceptance checklist.
