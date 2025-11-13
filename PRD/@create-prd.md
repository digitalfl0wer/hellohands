# HelloHands UI 2.0 — Product Requirements + Cursor Task List

> Version: 1.0 • Owner: Brie • Scope: Web MVP refresh (Adult + Kid Modes) • Dependencies: Vite/React/TS, Tailwind, Zustand, Lottie/Rive

---

## 1) Problem & Goals

**Problem.** Current UI/flow feel utilitarian; permissions, camera/voice states, and practice UX aren’t polished or kid‑friendly.

**Goals.**

* Delightful, accessible, and readable UI that feels *alive* without chaos.
* Clear, low‑friction entry: unified camera+mic permission and fallbacks.
* Distinct **Adult** and **Kid** modes (palette, pacing, overlays, copy).
* Gamified structure: paths/packs, progress stickers, streaks, small wins.
* Status clarity: compact camera HUD + voice “listening” HUD.
* Onboarding + mini calibration to stabilize recognition for each device.
* Built‑in reduced‑motion & a11y patterns; perf‑aware animations.

**Non‑Goals.** Auth, server‑side profiles, native apps, ML training pipeline.

---

## 2) Users & Modes

* **Adult**: learns quickly, prefers minimal overlays, short countdowns.
* **Kid**: needs slower pacing, bigger UI, warmer colors, playful feedback.

**Modes / Sub‑modes**

* **Learn**: Paths (*Basics, Everyday, Feelings*) with star goals.
* **Practice**: *Free Practice, Guided Drills, Timed Challenge*.
* **Kid Mode**: global visual + behavioral override (rocket countdown, slower FPS, longer holds).

---

## 3) Success Metrics (MVP)

* Time‑to‑first‑scan < 15s (Adult), < 30s (Kid).
* Lesson completion rate +15% vs current.
* Error exits (permission denied with no fallback) < 5%.
* Reduced‑motion compatibility
* Accessibility: basic screen reader happy path passes (NVDA/VoiceOver spot check).

---

## 4) Information Architecture

Top rail: **Learn | Practice** · Kid Mode toggle · Voice toggle · Settings (⋯).

Split layout (desktop): Left = camera/lesson canvas; Right = steps/tips/progress.

Bottom action row (mobile): **Replay · Slow · Next · Help** (large targets).

Cards grid for paths/packs.

---

## 5) Key Experiences & Requirements

### (A) Entry & Permissions

* One screen asks for **camera + mic**; plain‑language privacy note + link.
* Secondary path: “Explore without camera” (demo video).
* Denied state: “Open Settings” + “Retry” + demo path.

### (B) Camera Status HUD (overlay)

* **State chip** (top‑left): *Scanning / Hand found / Hold steady / Nice!*
* **Progress ring** around detected hand during holds.
* **Confidence bar** + label (e.g., *Thumbs Up 92%*).
* **Tips rail** (right): 1‑line contextual tip.
* Honors **reduced‑motion** (no ring animation; text only).

### (C) Voice Listening HUD

* **Mic orb**: idle → listening pulse → command glow.
* **Live transcript bubble**: shows last heard phrase (2–3s; aria‑live).
* **Hints**: suggest commands after misses.

### (D) Onboarding (3 slides) + Mini Calibration

* Slide 1: Camera + mic magic → what we capture and why.
* Slide 2: The 4 gestures (tiny loops or SVG frames).
* Slide 3: Choose Learn or Practice.
* **Mini calibration**: thumbs_up → open_palm → point → pinch; live meters; save thresholds per device profile.

### (E) Kid Mode (visual + behavioral)

* **Rocket countdown** overlay (3–2–1–Go). Blocks input; auto‑dismiss; 1s grace before detection starts.
* Pacing: 10–12 FPS detection; 2s holds; wider success margin.
* Theme: warm palette, chunky shapes, bigger CTAs; larger transcript.

### (F) Adult Mode specifics

* **Finger countdown** mini overlay (1.2–1.5s; non‑blocking) for calibration/timed drills.
* Minimal overlays; faster pacing.

### (G) Recovery Patterns

* No camera → demo video or retry.
* No hand found → single big “Try again” and 3 quick tips.
* Low light → “High gain mode” toggle + tip.
* Voice off → clear banner: mic permission denied; how to fix.

### (H) Progress & Gamification

* **Sticker board**: earn placeable stickers per sign/milestone.
* **Milestone toasts/cards**: 5/10 signs mastered; path complete; rare *Golden Spark* for perfect form.
* **Streak**: gentle, with 1 grace day/week.

### (I) Backgrounds & Motion

* Adult: subtle gradient field + soft grain shimmer.
* Kid: playful illustrated pattern with light parallax.
* Motion rules: 200–300ms micro, 600–900ms scene; spring for mascot; all honor reduced‑motion.

### (J) Accessibility & Perf

* ARIA‑live for recognition & voice events.
* 44px controls; visible focus; captions on videos.
* Perf budgets: mascot loops ≤1s; Lottie <150KB; 30fps cap; pause when hidden.

### (K) Assets & Attribution

* Lottie: **Rocket (kid)**, **Finger (adult)**.
* Sticker & mascot assets as SVG + Lottie/Rive (with static fallbacks).
* `ATTRIBUTION.md` maintained for external assets/licenses.

---

## 6) Design System Notes

* Two palettes: **adult** (dark + neon accent), **kid** (warm, high contrast).
* Tokens: color, radius, spacing, motion, shadows.
* Components: chips, pills, cards, HUD parts, toasts, modals.

---

## 7) Telemetry (lightweight)

* `perm:prompted|granted|denied`
* `countdown:shown|completed|skipped {mode}`
* `hud:state {scanning|found|hold|success}`
* `voice:heard {text}` (hashed/anonymized), `voice:hint_shown`
* `calibration:done`
* `kid:enabled`
* `progress:sticker_awarded`, `milestone:reached {type}`

---

## 8) Risks / Constraints

* Browser mic/cam differences; Web Speech API variability.
* Animation weight & battery on mobile.
* a11y + reduced‑motion compliance across states.

---

# Cursor Task List (Execution Order)

> Use our default workflow: **@create-prd.md → @generate-tasks.md → @process-task-list.md**. Branch naming: `feat/ui2/*`. Keep commits small with clear scopes. Add analytics stubs where listed.

## Phase 0 — Foundations

* [ ] **Theme tokens v2**

  * Add adult/kid palettes, motion tokens, shadows in Tailwind config.
  * Acceptance: CSS vars switch with mode; snapshots for both themes.

* [ ] **Reduced‑motion support**

  * Global hook + CSS class to switch animations off → fades.
  * Acceptance: system setting disables ring/parallax/Lottie to static.

* [ ] **Assets registry**

  * `public/assets/{lottie,svg}/…` + `assets/registry.json` with id/title/alt/variant/unlock/rarity.
  * Acceptance: registry loads; missing asset throws dev warning.

## Phase 1 — Entry & Permissions

* [ ] **Unified permission screen** (camera+mic)

  * Screen, privacy note, CTA, secondary demo path.
  * Acceptance: grants both; denied path shows retry + demo.
  * Analytics: `perm:prompted|granted|denied`.

* [ ] **Demo video fallback**

  * Simple local/video URL flow for “explore without camera”.
  * Acceptance: practice screens render with demo feed.

## Phase 2 — Layout & IA

* [ ] **Top rail** (Learn | Practice · Kid · Voice · Settings)

  * Acceptance: toggles reflect state; URL/state synced.

* [ ] **Split view & bottom action bar**

  * Desktop split; mobile bottom row (Replay/Slow/Next/Help).
  * Acceptance: responsive breakpoints; keyboard focus order sane.

* [ ] **Cards for paths/packs**

  * Acceptance: grid, badges for XP/streak/last attempt.

## Phase 3 — HUDs & Overlays

* [ ] **Camera Status HUD**

  * State chip, hand progress ring, confidence bar, tips rail.
  * Acceptance: states update through scanning→success; reduced‑motion swaps to text.
  * Analytics: `hud:state` transitions.

* [ ] **Voice Listening HUD**

  * Mic orb, transcript bubble, hint chips.
  * Acceptance: live transcript aria‑live; hint after 2 misfires.
  * Analytics: `voice:heard`, `voice:hint_shown`.

## Phase 4 — Onboarding + Calibration

* [ ] **Onboarding carousel (3 slides)**

  * Acceptance: skippable; persists completion flag.

* [ ] **Mini calibration**

  * Four gestures with live meters; save thresholds as device profile.
  * Acceptance: thresholds applied on practice start; re‑run from Settings.
  * Analytics: `calibration:done`.

## Phase 5 — Mode Behaviors

* [ ] **Kid Mode engine**

  * Rocket Lottie overlay; 1s post‑Go grace; slower FPS; longer holds; bigger UI.
  * Acceptance: visible theme change and pacing adjustments.
  * Analytics: `kid:enabled`, `countdown:* {mode:kid}`.

* [ ] **Adult timing**

  * Finger countdown mini overlay; non‑blocking.
  * Acceptance: shows on calibration/drills; respects reduced‑motion.

## Phase 6 — Recovery Patterns

* [ ] **No camera flow** (retry/demo)
* [ ] **No hand found** (try again + tips)
* [ ] **Low light** (high‑gain toggle + tip)
* [ ] **Voice off** (permission banner)

  * Acceptance: each state reachable and recoverable without reload.

## Phase 7 — Progress & Gamification

* [ ] **Sticker board**

  * Placeable stickers; save layout locally.
  * Acceptance: award on events; board persists.
  * Analytics: `progress:sticker_awarded`.

* [ ] **Milestone cards + rare sparkle**

  * Toast/card for 5/10 signs; rare “Golden Spark” on perfect form.
  * Acceptance: cards dismiss; sparkle disabled on reduced‑motion.
  * Analytics: `milestone:reached {type}`.

* [ ] **Streak with grace day**

  * Acceptance: increments daily; one auto‑grace/week.

## Phase 8 — Backgrounds & Motion

* [ ] **Adult background** (gradient + soft grain)
* [ ] **Kid background** (playful pattern + light parallax)

  * Acceptance: parallax disabled on reduced‑motion; perf OK on mobile.

## Phase 9 — Accessibility & QA

* [ ] **ARIA‑live audit** for HUD/transcripts/milestones.
* [ ] **Keyboard access** for all controls; focus outlines verified.
* [ ] **Captions** for lesson videos (VTT support).

  * Acceptance: passes manual checks on VoiceOver/NVDA.

## Phase 10 — Analytics & Attribution

* [ ] **Event stubs + logger** per metric list.
* [ ] **ATTRIBUTION.md** for Lottie/illustrations.

  * Acceptance: events fire; attribution renders in About/License.

---

## File/Module Plan (suggested)

* `src/components/hud/StatusChip.tsx`
* `src/components/hud/HandProgressRing.tsx`
* `src/components/hud/ConfidenceBar.tsx`
* `src/components/hud/TipsRail.tsx`
* `src/components/voice/MicOrb.tsx`
* `src/components/voice/TranscriptBubble.tsx`
* `src/components/overlays/CountdownRocket.tsx` (kid)
* `src/components/overlays/CountdownFinger.tsx` (adult)
* `src/components/onboarding/OnboardingCarousel.tsx`
* `src/components/calibration/CalibrationFlow.tsx`
* `src/components/progress/StickerBoard.tsx`
* `src/components/progress/MilestoneCard.tsx`
* `src/components/layout/TopRail.tsx`
* `src/components/layout/BottomActions.tsx`
* `src/styles/backgrounds.css` (adult/kid, reduced‑motion variants)
* `src/state/kidMode.ts`, `src/state/voice.ts`, `src/state/progress.ts`
* `public/assets/lottie/kid/rocket_countdown.json`
* `public/assets/lottie/adult/finger_countdown.json`
* `ATTRIBUTION.md`, `assets/registry.json`

---

## Acceptance Checklist (global)

* [ ] Reduced‑motion toggles all animations to static/fade equivalents.
* [ ] Screen reader announces HUD state changes and voice transcripts.
* [ ] Keyboard can operate all critical flows.
* [ ] Kid mode applies visual + behavioral deltas (color, size, pacing).
* [ ] Analytics events log without PII; voice text anonymized/hashed.
* [ ] External assets credited in **ATTRIBUTION.md**.

---

## Open Questions

* Kid palette preferences (specific hues)?
* Mascot style: hand‑sprite vs spark buddy (state list ready).
* Sticker count for v1 (12 vs 16) and rarity tiers.
* Voice wake phrase: enabled or tap‑to‑talk only?

---

## 6a) Visual Palettes & Tokens (Locked)

**Adult — Afro‑Chic Night (A2)**

* bg `#0E0E0E`, surface `#1F1F1F`, text `#F2F2F2`
* primary `#7B2CBF`, teal `#5FC4B6`, gold `#CDAA62`, magenta `#FF4DA1`
* success `#46E58A`, warn `#FFB54A`, error `#FF5D74`

**Kid — Playground Sunshine (K2)**

* bg `#FFF8EE`, surface `#FFF1DC`, text `#1B1B1B`
* primary (orange) `#FF7A59`, mint `#6ADCA0`, blue `#3A8DFF`, grape `#845EF7`, sun `#FFC94A`
* success `#39C572`, error `#FF5C6E`

**Token map (CSS vars)**

```txt
--color-bg, --color-surface, --color-text
--color-primary, --color-accent, --color-gold
--color-success, --color-warn, --color-error
--hud-accent: var(--color-primary)
--confetti-1/2/3: var(--color-primary) / var(--color-accent) / var(--color-gold)
--palma-body: var(--color-primary)
--palma-outline: color-mix(in oklab, var(--color-text) 80%, transparent)
--palma-glow: var(--color-accent)
--rocket-body: var(--color-primary)
--rocket-flame-start: var(--color-sun); --rocket-flame-end: #FF6B6B
```

**Motion tokens**

* micro `200–300ms ease-out`, scene `600–900ms spring`, fps cap `30` for animated assets
* respects `prefers-reduced-motion`: swap glows/parallax → fades; Lottie→static SVG

---

## Palma Mascot — Product Spec (v1)

**Purpose.** Friendly guide that mirrors system state (camera/voice) and boosts motivation without distraction.

**States (6)**

* *idle* (subtle breathing)
* *listening* (mic pulse, ear wiggle / ring glow)
* *thinking* (blink/tilt loop)
* *encouraging* (nudge gesture when user stalls)
* *success* (sparkle burst + nod)
* *oops* (gentle shake + tip)

**Triggers → State mapping**

* `voice:listening_start`→ listening; `voice:heard`→ thinking→success
* `hud:state=scanning`→ idle; `found`→ encouraging; `hold`→ encouraging; `success`→ success
* `recovery:*` or errors → oops

**Assets**

* Format: **SVG** (static) + **Lottie/Rive** (≤1s loop) per state; kid/adult variants share silhouette, change palette.
* Performance: each Lottie <150KB; paused when not visible.

**Accessibility**

* Decorative by default (`aria-hidden="true"`); milestone moments include short alt text in the toast.
* Full static swap when `prefers-reduced-motion`.

**File paths**

* `public/assets/mascot/{adult|kid}/palma_{state}.svg|json`
* Registry entries in `assets/registry.json` (id, title, alt, variant, rarity)

**Analytics**

* `mascot:state_enter {state}`; `mascot:nudge_shown`; `mascot:success_seen`

---

## Phase 3.5 — Mascot Palma (Cursor)

* [ ] **PalmaManager** (event→state)

  * Acceptance: subscribes to bus; switches variant by Kid/Adult mode; pauses on hidden.

* [ ] **Palma component** (SVG/Lottie with reduced‑motion fallback)

  * Acceptance: renders correct state; silent on idle; alt text only on milestone.

* [ ] **Event hooks**

  * Wire to: `voice:*`, `hud:state`, `countdown:*`, `recovery:*`.

* [ ] **Assets load**

  * Preload idle/listen; lazy others; log missing assets with dev warning.

* [ ] **QA**

  * CPU <5% on laptop idle; mobile thermals OK after 2 minutes.

---

## File/Module Additions (Palma)

* `src/components/mascot/Palma.tsx`
* `src/components/mascot/PalmaManager.tsx`
* `src/hooks/useReducedMotion.ts` (global)
* `public/assets/mascot/...` (adult/kid, svg + lottie)

---

## Acceptance Checklist — Additions (Palma & Palettes)

* [ ] Adult A2 + Kid K2 palettes selectable; tokens applied across HUD/overlays.
* [ ] Palma honors reduced‑motion and theme; idles <1s loop; paused when off-screen.
* [ ] Rocket (kid) and Finger (adult) countdowns pick correct palette automatically.

---

## Backgrounds — Palette Tie‑in

* **Adult**: radial neon rim using `--color-accent` over `--color-bg` → `--color-surface`.
* **Kid**: light gradient `#FFF8EE → #FFEBCB` with tiny sun/star SVG tiling (opacity 6–8%).

---

## Rollout Plan

1. Ship Phase 1–3 under feature flag `VITE_UI2_ENABLED=1`.
2. Enable Kid Mode flag `VITE_KID_MODE_ENABLED=1` for internal QA.
3. Add onboarding + calibration.
4. Turn on background/motion and progress in increments.

> Done = no hydration warnings, a11y checks pass, reduced‑motion honored, and happy‑path E2E flows run for Adult + Kid.


