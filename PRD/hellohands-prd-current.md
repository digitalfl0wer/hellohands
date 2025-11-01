# Hello Hands – Product Requirements (Current Build)

## Context

Hello Hands offers a guided, multimodal ASL micro-lesson focused on a five-star progression loop. The current codebase delivers the MVP experience with live camera gestures, voice commands, and Goose subagents instrumentation so stakeholders can evaluate usability, accessibility, and orchestration depth within a 90-second demo window.

## Users & Value

- **Learners & Caregivers:** Earn confidence quickly through touch-first playback and optional gesture/voice assistive layers.
- **Hackathon Judges & Sponsors:** Observe agent coordination, instrumentation, and inclusive design in a condensed walkthrough.
- **Internal Team:** Build toward a scalable practice pipeline that curates one-handed MS-ASL clips for future packs.

## Experience Goals

- Touch controls always succeed; gestures and voice layer on delight without blocking progress.
- Level 1 completion (five stars) and Level 2 unlock are achievable within one session.
- Kid Mode increases affordances (copy, color, spacing) without fragmenting flows.
- Attribution is present wherever media appears; licensing remains transparent.
- Goose agents and the BroadcastChannel bus surface real-time activity.

## Primary Flows

1. **Welcome & Level Select** – Level cards communicate progress, Kid Mode, and attribution context. Locked levels surface motivational toasts.
2. **Directions Gate** – Manual fallback plus 3-2-1 countdown into the lesson establishes pacing and accessibility safeguards.
3. **Lesson Loop** – Poster preview, clip playback, Replay/Slow/Next, feedback banner, help sheet, and unlock celebrations.
4. **Practice Workspace** – Live camera feed mirrors gestures, aligns expected intent, and streams recognitions onto the planner bus.
5. **Agent Console** – Right-rail Goose subagents panel visualizes event flow and exposes exportable logs.

## Feature Inventory (Implemented)

- **Design System & Shell** – Tailwind tokens and the `AppShell` frame enforce gradients, safe areas, and focus-visible styles (`src/components/AppShell.tsx`, `src/styles/tokens.css`, `tailwind.config.ts`).
- **State Management** – Zustand store persists Kid Mode, toggles, levels, stars, and clip queue with hydration guard and tests (`src/state/useLessonStore.ts`, `src/state/__tests__/useLessonStore.test.tsx`).
- **Welcome Experience** – Responsive Level cards, Kid toggle messaging, and dataset attribution summary (`src/screens/WelcomeScreen.tsx`).
- **Lesson Player** – Poster/video playback pipeline with pause, slow-mo, help sheet, and feedback banner integration (`src/components/lesson/LessonScreen.tsx`, `src/components/lesson/LessonPlayer.tsx`).
- **Gesture Layer** – Pointer-based swipe heuristics for navigation plus MediaPipe Hands detector with HUD, hold-to-emit logic, and BroadcastChannel posts (`src/hooks/useGestureInput.ts`, `src/components/CameraFeed.tsx`, `src/gestures/gestureBus.ts`).
- **Voice Layer** – Web Speech integration handling control commands, Kid Mode, level navigation, and toast hints on uncertainty (`src/hooks/useVoiceInput.ts`, `src/hooks/voiceCommandParser.ts`).
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

## Observability & QA

- Logger posts structured events (`info`/`warn`/`error`) to the bus and retains a download buffer for post-run analysis.
- Manual QA checklist and bug triage template live in `docs/`.
- `pnpm practice:all` chain validates whitelist, regenerates packs, and flags missing assets; `pnpm msasl:*` scripts provide end-to-end pipeline coverage.

## Outstanding Work (Task Tracker Sections 14–16)

| Task | Status | Notes |
| --- | --- | --- |
| Practice loader enforcing whitelist & one-handed rule | ✅ | `practiceApi` sanitises fallback packs against `whitelist.json` + `vocab.map.json`; non-compliant items are dropped with dev warnings. |
| Generate packs + missing_items log | ✅ | `pnpm practice:generate` now writes whitelist-filtered packs and `practice/packs.missing.json` with removal reasons. |
| Docs for adjusting glosses safely | ✅ | Runbook added at `docs/practice-pipeline.md` covering whitelist edits, regeneration, and troubleshooting. |
| Baseline model + train loop (optional) | ⏳ | Goose recipe stub exists; no executable training pipeline or metrics export yet. |
| Metrics export, confusion matrix | ⏳ | Pending once baseline loop lands. |
| Demo readiness sweep | ✅ | Checklist captured in `docs/demo-readiness.md` with performance guidance and capture script. |
| Final README quickstart refresh | ✅ | README now documents dev servers, environment flags, and practice scripts. |

## Launch Checklist

- ✅ Multimodal MVP flows verified (manual, gesture, voice) with fallbacks.
- ✅ Goose subagents panel renders SSE logs via proxy.
- ✅ Data pipeline scripts and docs available for MS-ASL subset operations.
- ✅ Practice pipeline documentation and missing-item telemetry published.
- 🔄 Rehearse and capture demo video; attach recommended narrative and timing script.
- ✅ README updated with end-to-end quickstart (pnpm dev, goose proxy, MCP server, practice commands).

## Risks & Mitigations

- **Gesture Reliability:** Classification runs client-side via heuristic thresholds; plan to tune distances and add calibration UI if user testing reveals misses.
- **Dataset Licensing:** Continue to exclude raw media from Git, cite MS-ASL C-UDA in README and PRD, and surface attribution in-app.
- **Performance:** MediaPipe Hands via CDN adds latency on slow networks; consider bundling worker/task files or providing offline asset download (`pnpm hand:model`).
- **Training Scope:** Baseline model remains optional; schedule separate milestone if external showcase demands metrics.

## Next Steps

1. Capture and archive the 90-second walkthrough video referenced in `docs/demo-readiness.md`.
2. Decide on baseline model investment and instrumentation (metrics, confusion matrix, Goose integration).
3. Extend Goose tooling to execute the eventual training loop (ties into Task Section 15).
