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

## 4. Welcome & Gate

- [ ] Assemble Welcome view with Level cards, Kid Mode toggle, Settings pill.
- [ ] Locked toast copy: "Keep practicing to unlock Level 2 (earn 5 stars)."
- [ ] Directions gate sequencing with countdown and manual fallback.

## 5. Lesson Loop

- [ ] Poster-to-MP4 playback pipeline with replay, slow-mo, next controls (Kid labels when enabled).
- [ ] Integrate feedback banner with lesson progression logic.
- [ ] Low-light hint: "I can't see clearly - try brighter light."
- [ ] Connect to stubbed `labels.jsonl` or MCP mock data; add analytics hooks placeholder.

## 6. Gesture Input

- [ ] Swipe detection (right, left, up, down) ~15% frame, <=400 ms, 600 ms debounce, disabled during modals.
- [ ] Gesture confirmations (300 ms overlays).
- [ ] Palm hold pause (3 s) with countdown ring and thumbs-up resume; 1 s cooldown.
- [ ] Telemetry hook for gesture success/fail counts.

## 7. Voice Input

- [ ] Voice toggle behavior with onboarding toast.
- [ ] Command set: Next, Replay, Slow-mo, Pause, Resume, Help, Continue, Back, Level navigation, Kid Mode toggle, uncertain-intent hint.
- [ ] Mock recognizer adapter for dev; logging for recognized intents.

## 8. Progression & Rewards

- [ ] Increment stars on pass, reset on level advance; persist.
- [ ] Unlock Level 2 at five stars with confetti/sticker once per session; update Welcome.
- [ ] Respect reduced-motion (subtle confetti alternative); unlock toast accessible.

## 9. Content & Attribution

- [ ] Review Level 1 copy vs dataset metadata; sync with MS-ASL outputs.
- [ ] Wire attribution chip/modal to real metadata.
- [ ] Keyboard + screen reader access to attribution surfaces.

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
