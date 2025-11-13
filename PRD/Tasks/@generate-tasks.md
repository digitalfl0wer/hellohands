# Cursor Task List (Execution Order)

> Use our default workflow: **@create-prd.md → @generate-tasks.md → @process-task-list.md**  
> Branch naming: `feat/ui2/*`. Keep commits small with clear scopes. Add analytics stubs where listed.

---

## Phase 0 — Foundations

- [ ] Theme tokens v2
  - Add adult/kid palettes, motion tokens, shadows in Tailwind config.
  - Acceptance: CSS vars switch with mode; snapshots for both themes.

- [ ] Reduced‑motion support
  - Global hook + CSS class to switch animations off → fades.
  - Acceptance: system setting disables ring/parallax/Lottie to static.

- [ ] Assets registry
  - `public/assets/{lottie,svg}/…` + `assets/registry.json` with id/title/alt/variant/unlock/rarity.
  - Acceptance: registry loads; missing asset throws dev warning.

---

## Phase 1 — Entry & Permissions

- [ ] Unified permission screen (camera+mic)
  - Screen, privacy note, CTA, secondary demo path.
  - Acceptance: grants both; denied path shows retry + demo.
  - Analytics: `perm:prompted|granted|denied`.

- [ ] Demo video fallback
  - Simple local/video URL flow for “explore without camera”.
  - Acceptance: practice screens render with demo feed.

---

## Phase 2 — Layout & IA

- [ ] Top rail (Learn | Practice · Kid · Voice · Settings)
  - Acceptance: toggles reflect state; URL/state synced.

- [ ] Split view & bottom action bar
  - Desktop split; mobile bottom row (Replay/Slow/Next/Help).
  - Acceptance: responsive breakpoints; keyboard focus order sane.

- [ ] Cards for paths/packs
  - Acceptance: grid, badges for XP/streak/last attempt.

---

## Phase 3 — HUDs & Overlays

- [ ] Camera Status HUD
  - State chip, hand progress ring, confidence bar, tips rail.
  - Acceptance: states update through scanning→success; reduced‑motion swaps to text.
  - Analytics: `hud:state` transitions.

- [ ] Voice Listening HUD
  - Mic orb, transcript bubble, hint chips.
  - Acceptance: live transcript aria‑live; hint after 2 misfires.
  - Analytics: `voice:heard`, `voice:hint_shown`.

---

## Phase 4 — Onboarding + Calibration

- [ ] Onboarding carousel (3 slides)
  - Acceptance: skippable; persists completion flag.

- [ ] Mini calibration
  - Four gestures with live meters; save thresholds as device profile.
  - Acceptance: thresholds applied on practice start; re‑run from Settings.
  - Analytics: `calibration:done`.

---

## Phase 5 — Mode Behaviors

- [ ] Kid Mode engine
  - Rocket Lottie overlay; 1s post‑Go grace; slower FPS; longer holds; bigger UI.
  - Acceptance: visible theme change and pacing adjustments.
  - Analytics: `kid:enabled`, `countdown:* {mode:kid}`.

- [ ] Adult timing
  - Finger countdown mini overlay; non‑blocking.
  - Acceptance: shows on calibration/drills; respects reduced‑motion.

---

## Phase 6 — Recovery Patterns

- [ ] No camera flow (retry/demo)
- [ ] No hand found (try again + tips)
- [ ] Low light (high‑gain toggle + tip)
- [ ] Voice off (permission banner)
  - Acceptance: each state reachable and recoverable without reload.

---

## Phase 7 — Progress & Gamification

- [ ] Sticker board
  - Placeable stickers; save layout locally.
  - Acceptance: award on events; board persists.
  - Analytics: `progress:sticker_awarded`.

- [ ] Milestone cards + rare sparkle
  - Toast/card for 5/10 signs; rare “Golden Spark” on perfect form.
  - Acceptance: cards dismiss; sparkle disabled on reduced‑motion.
  - Analytics: `milestone:reached {type}`.

- [ ] Streak with grace day
  - Acceptance: increments daily; one auto‑grace/week.

---

## Phase 8 — Backgrounds & Motion

- [ ] Adult background (gradient + soft grain)
- [ ] Kid background (playful pattern + light parallax)
  - Acceptance: parallax disabled on reduced‑motion; perf OK on mobile.

---

## Phase 9 — Accessibility & QA

- [ ] ARIA‑live audit for HUD/transcripts/milestones.
- [ ] Keyboard access for all controls; focus outlines verified.
- [ ] Captions for lesson videos (VTT support).
  - Acceptance: passes manual checks on VoiceOver/NVDA.

---

## Phase 10 — Analytics & Attribution

- [ ] Event stubs + logger per metric list.
- [ ] ATTRIBUTION.md for Lottie/illustrations.
  - Acceptance: events fire; attribution renders in About/License.

---

## File/Module Plan (suggested)

- `src/components/hud/StatusChip.tsx`
- `src/components/hud/HandProgressRing.tsx`
- `src/components/hud/ConfidenceBar.tsx`
- `src/components/hud/TipsRail.tsx`
- `src/components/voice/MicOrb.tsx`
- `src/components/voice/TranscriptBubble.tsx`
- `src/components/overlays/CountdownRocket.tsx` (kid)
- `src/components/overlays/CountdownFinger.tsx` (adult)
- `src/components/onboarding/OnboardingCarousel.tsx`
- `src/components/calibration/CalibrationFlow.tsx`
- `src/components/progress/StickerBoard.tsx`
- `src/components/progress/MilestoneCard.tsx`
- `src/components/layout/TopRail.tsx`
- `src/components/layout/BottomActions.tsx`
- `src/styles/backgrounds.css` (adult/kid, reduced‑motion variants)
- `src/state/kidMode.ts`, `src/state/voice.ts`, `src/state/progress.ts`
- `public/assets/lottie/kid/rocket_countdown.json`
- `public/assets/lottie/adult/finger_countdown.json`
- `ATTRIBUTION.md`, `assets/registry.json`

---

## Acceptance Checklist (global)

- [ ] Reduced‑motion toggles all animations to static/fade equivalents.
- [ ] Screen reader announces HUD state changes and voice transcripts.
- [ ] Keyboard can operate all critical flows.
- [ ] Kid mode applies visual + behavioral deltas (color, size, pacing).
- [ ] Analytics events log without PII; voice text anonymized/hashed.
- [ ] External assets credited in ATTRIBUTION.md.

---

## Phase 3.5 — Mascot Palma (Cursor)

- [ ] PalmaManager (event→state)
  - Acceptance: subscribes to bus; switches variant by Kid/Adult mode; pauses on hidden.

- [ ] Palma component (SVG/Lottie with reduced‑motion fallback)
  - Acceptance: renders correct state; silent on idle; alt text only on milestone.

- [ ] Event hooks
  - Wire to: `voice:*`, `hud:state`, `countdown:*`, `recovery:*`.

- [ ] Assets load
  - Preload idle/listen; lazy others; log missing assets with dev warning.

- [ ] QA
  - CPU <5% on laptop idle; mobile thermals OK after 2 minutes.

---

## Acceptance Checklist — Additions (Palma & Palettes)

- [ ] Adult A2 + Kid K2 palettes selectable; tokens applied across HUD/overlays.
- [ ] Palma honors reduced‑motion and theme; idles <1s loop; paused when off-screen.
- [ ] Rocket (kid) and Finger (adult) countdowns pick correct palette automatically.

---

## Backgrounds — Palette Tie‑in

- Adult: radial neon rim using `--color-accent` over `--color-bg` → `--color-surface`.
- Kid: light gradient `#FFF8EE → #FFEBCB` with tiny sun/star SVG tiling (opacity 6–8%).

---

## Rollout Plan

1. Ship Phase 1–3 under feature flag `VITE_UI2_ENABLED=1`.
2. Enable Kid Mode flag `VITE_KID_MODE_ENABLED=1` for internal QA.
3. Add onboarding + calibration.
4. Turn on background/motion and progress in increments.

> Done = no hydration warnings, a11y checks pass, reduced‑motion honored, and happy‑path E2E flows run for Adult + Kid.


