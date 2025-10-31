# MVP Task Tracker

Labels: `feat`, `ui`, `mcp`, `infra`, `docs`, `test`, `polish` • Estimates: `S` <=1h, `M` 1-3h, `L` 3-6h

## 0. Foundation & Tooling ✅

- [x] **infra:** Confirmed Node 20 + pnpm (doc in `CONTRIBUTING.md`), added `.editorconfig`, `.prettierrc.json`, and `simple-git-hooks` pre-commit formatter (`package.json` scripts).
- [x] **ui:** Scaffolded Vite + React + Tailwind app (`src/main.tsx`, `tailwind.config.ts`, `postcss.config.cjs`) with placeholder welcome screen to prove styles render.
- [x] **assets:** Seeded `/public/signs/level1` with placeholder poster/video/meta files and added sample `data/processed/msasl/labels.jsonl`.
- [x] **git hygiene:** Updated `.gitignore` to allow lightweight metadata while excluding media; added `.env.example`.
- [x] **vercel readiness:** Added `vercel.json` plus `pnpm build` script for deploy; ensured `pnpm dev/build/preview` exist and output to `dist`.

## 1. State & Persistence (next)

- [x] **plan:** Use Zustand with slices for `kidMode`, `voiceOn`, `gesturesOn`, `level`, `stars`, `index`, `clips`, and `feedback`. Persist `level`, `stars`, and toggles to `localStorage` (via `zustand/middleware`). Provide selectors/hooks for progression and manual mode (true when voice & gestures disabled). Add Vitest unit tests for reducers (increment stars, reset, unlock).
- [ ] **feat:** Implement store in `src/state/useLessonStore.ts`, wire provider, and expose hooks.
- [ ] **feat:** Hook persistence + hydration guard to avoid mismatch during SSR/Vercel preview.
- [ ] **test:** Add Vitest suite covering pass/ almost/ miss transitions and unlock reset.

## 2. UI Foundations

- [ ] Tailwind design tokens (colors, radii, spacing, typography scale) with documented usage.
- [ ] App shell with safe-area padding, centered content frame, background surfaces.
- [ ] Accessibility baseline: contrast >=4.5:1, focus-visible treatments, captions default on.

## 3. Core Components

- [ ] Level Card (locked/unlocked states with helper copy).
- [ ] Settings pill + mini cheat-sheets for voice/gestures, connected to store.
- [ ] Button set (Adult/Kid variants) with focus-visible styles.
- [ ] Toast component (success/info/warn, auto-hide, SR live region).
- [ ] Directions sheet (3 bullets, delayed "Begin", 3-2-1 overlay).
- [ ] Help sheet (looping clip placeholder, "Replay in slow-mo", "Resume").
- [ ] Feedback banner (Pass/Almost/Miss with Kid copy variants).
- [ ] Attribution chip + modal using placeholder metadata.

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
