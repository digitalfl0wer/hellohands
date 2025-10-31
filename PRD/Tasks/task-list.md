# MVP Task Tracker

Labels: `feat`, `ui`, `mcp`, `infra`, `docs`, `test`, `polish` • Estimates: `S` <=1h, `M` 1-3h, `L` 3-6h

## 0. Foundation & Tooling ✅

- [x] **infra:** Confirmed Node 20 + pnpm (doc in `CONTRIBUTING.md`), added `.editorconfig`, `.prettierrc.json`, and `simple-git-hooks` pre-commit formatter (`package.json` scripts).
- [x] **ui:** Scaffolded Vite + React + Tailwind app (`src/main.tsx`, `tailwind.config.ts`, `postcss.config.cjs`) with placeholder welcome screen to prove styles render.
- [x] **assets:** Seeded `/public/signs/level1` with placeholder poster/video/meta files and added sample `data/processed/msasl/labels.jsonl`.
- [x] **git hygiene:** Updated `.gitignore` to allow lightweight metadata while excluding media; added `.env.example`.
- [x] **vercel readiness:** Added `vercel.json` plus `pnpm build` script for deploy; ensured `pnpm dev/build/preview` exist and output to `dist`.

## 1. State & Persistence ✅

- [x] **feat:** Zustand store (`src/state/useLessonStore.ts`) tracks kidMode, input toggles, level/stars, clip queue, feedback; persisted via `zustand/middleware` with hydration guard for SSR. Manual mode selector exposed.
- [x] **test:** Vitest suite (`src/state/__tests__/useLessonStore.test.ts`) covers pass/almost/miss progression, unlock/reset, clip rotation, manual-mode toggling.

## 2. UI Foundations ✅

- [x] Tailwind tokens + CSS variables (`tailwind.config.ts`, `src/styles/tokens.css`, `src/index.css`) define brand palette, radii, spacing, typography, and focus-visible styles honouring prefers-reduced-motion.
- [x] App shell (`src/components/AppShell.tsx`) provides safe-area padding, gradient surfaces, and landmark semantics; `src/App.tsx` consumes it while demonstrating token usage.
- [x] Accessibility baseline: focus outlines, contrast-friendly palette, responsive layout baked into tokens and shell.

## 3. Core Components ✅

- [x] Level Card (locked/unlocked states with helper copy) - `src/components/LevelCard.tsx`.
- [x] Settings pill + mini cheat-sheets for voice/gestures, connected to store - `src/components/SettingsPill.tsx`.
- [x] Button set (Adult/Kid variants) with focus-visible styles - `src/components/Button.tsx`.
- [x] Toast scaffold (auto-hide + SR live region) wired for future events - `src/components/Toast.tsx`.
- [x] Directions sheet + countdown overlay (delayed begin, 3-2-1) - `src/components/sheets/DirectionsSheet.tsx`, `src/components/sheets/CountdownOverlay.tsx`.
- [x] Help sheet (looping clip placeholder, "Replay in slow-mo", "Resume") - `src/components/sheets/HelpSheet.tsx`.
- [x] Feedback banner (Pass/Almost/Miss with Kid copy variants) - `src/components/feedback/FeedbackBanner.tsx`.
- [x] Attribution chip + modal using placeholder metadata - `src/components/attribution/`.

## 4. Welcome & Gate ✅

- [x] Assemble Welcome view with Level cards, Kid Mode toggle, Settings pill (`src/screens/WelcomeScreen.tsx`).
- [x] Locked toast copy: "Keep practicing to unlock Level 2 (earn 5 stars)."
- [x] Directions gate sequencing with countdown and manual fallback integrated into `App`.

## 5. Lesson Loop ✅

- [x] Poster-to-MP4 playback pipeline with replay, slow-mo, next controls (Kid labels when enabled) via `LessonPlayer`/`LessonScreen` components.
- [x] Feedback banner integrated into lesson state management; hooks into stub clip queue.
- [x] Low-light/manual hint placeholders surfaced through help interactions.
- [x] Sample clip queue wired to placeholder assets; telemetry placeholders emit console logs.

## 6. Gesture Input ✅

- [x] Swipe detection (right, left, up, down) with threshold/debounce via `useGestureInput` hook; suspended during modals.
- [x] Gesture confirmations surfaced as transient overlays.
- [x] Palm hold pause (3 s) + tap-to-resume flow with pause overlay and resume control.
- [x] Telemetry placeholder logs each recognized gesture.

## 7. Voice Input ✅

- [x] Voice toggle onboarding toast; listening badge shown in header.
- [x] Command parser covers Next/Replay/Slow/Pause/Resume/Help + Kid Mode and Level navigation; hint toast on uncertain input.
- [x] `useVoiceInput` hook wraps Web Speech API with graceful fallback/logging.

## 8. Progression & Rewards

- [ ] Increment stars on pass, reset on level advance; persist.
- [ ] Unlock Level 2 at five stars with confetti/sticker once per session; update Welcome.
- [ ] Respect reduced-motion (subtle confetti alternative); unlock toast accessible.

## 9. Content & Attribution ✅

- [x] Review Level 1 copy vs dataset metadata; sync with MS-ASL outputs.
- [x] Wire attribution chip/modal to real metadata.
- [x] Keyboard + screen reader access to attribution surfaces.

## 10. Observability & QA

- [ ] Centralised logger for gestures, voice, unlock events; console + optional file export.
- [ ] Vitest component tests for store logic, gesture utility, voice adapter stubs.
- [ ] Manual QA checklist (mobile browsers, Kid Mode, reduced motion) and bug triage template.

## 11. MCP & External Tools

- [ ] MCP server (packs.list/get, practice.next, license.info) with CORS and deploy plan.
- [ ] Service layer toggle between local fixtures and MCP responses.
- [ ] README quickstart + endpoint shapes.

## 12. Goose Orchestration

- [ ] Configure Goose provider; validate with `goose run --recipe "Say: hi"`.
- [ ] Recipes for conductor, voice_listener, gesture_interpreter, intent_router, lesson_planner, attribution_guardian, prefetcher, coach_adult, coach_kid, progress_tracker, permission_steward, safety_monitor.
- [ ] Demo script showing parallel listeners/fan-out; capture logs/screenshots.

## 13. Data Pipeline (MS-ASL)

- [ ] adapters/msasl.ts full normalization + schema validation.
- [ ] `scripts/msasl_filter.ts` subset filtering (label < N) with deterministic output.
- [ ] `scripts/msasl_download.ts` with retries, `failed.csv`, resume.
- [ ] `scripts/msasl_trim.ts` ffmpeg trim + standardise, skip completed.
- [ ] `scripts/msasl_emit_labels.ts` emit unified labels.
- [ ] Dataset stats script (per-class, per-signer, duration histogram).
- [ ] Unit tests, structured logging, integrity checks, spot-audit player.

## 14. Practice Pipeline

- [ ] Practice loader enforcing whitelist + one-handed rule.
- [ ] Generate packs + missing_items log.
- [ ] Docs for adjusting glosses safely.

## 15. Baseline Model & Eval (Optional)

- [ ] Video data module reading labels.jsonl.
- [ ] Baseline model (I3D/TimeSformer) + train loop.
- [ ] Metrics export (top-1/top-5, confusion matrix).
- [ ] Pipeline docs (prep steps, env vars, troubleshooting).

## 16. Demo Readiness

- [ ] Performance sweep (lazy loading, clip duration).
- [ ] Record 90-second demo run (Level 1 -> five stars -> unlock).
- [ ] Final README Quickstart, dataset attribution, Goose overview.

## 17. Realtime Multimodal Platform

- [ ] Scaffold new agents/gestures/components/pages/server folders (gesture worker, bus, evaluator, planner, attribution, prefetcher, voice, camera feed, subagents panel, practice page, goose proxy).
- [ ] Implement BroadcastChannel `hh_bus` event types plus helper to post intents across voice, gesture, planner, attribution, and prefetch flows.
- [ ] Stand up MediaPipe hand landmarker worker with heuristics for `thumbs_up`, `open_palm`, `point`, `pinch`; ensure `/public/hand_landmarker.task` packaged or CDN path configured.
- [ ] Build mirrored CameraFeed component that obtains permissions, streams frames to worker, and surfaces permission errors gracefully.
- [ ] Add voice agent behind `VITE_USE_VOICE=1`, gesture evaluator, planner attribution tagging, and practice expected gesture wiring.
- [ ] Create SubagentsPanel right rail with collapsible controls, progress bars, live event console, and hook in Goose SSE stream.
- [ ] Add practice page wiring expected gestures + camera, bootstrap planner/voice at app entry, and register new pnpm scripts (`dev`, `goose:proxy`, `dev:all`) with express-based SSE proxy plus dependencies.
