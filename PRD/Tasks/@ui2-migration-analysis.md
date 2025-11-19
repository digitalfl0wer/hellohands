# UI 2.0 Migration Analysis — Updates Required to Existing PRDs & Tasks

> Generated: 2025-11-13 • Scope: Reconcile existing PRDs/tasks with HelloHands UI 2.0 requirements

---

## Executive Summary

The **UI 2.0 PRD** introduces significant UX/UI enhancements focused on:

- **Adult/Kid Mode** visual palettes and behavioral pacing
- **Enhanced HUD systems** (camera status, voice listening)
- **Onboarding + calibration flows**
- **Gamification** (sticker board, milestones, streaks)
- **Palma mascot** state-driven animations
- **Accessibility** (reduced-motion, ARIA-live, keyboard nav)
- **Unified permissions** (camera+mic)

The existing codebase (per `hellohands-prd-current.md` and `task-list.md`) has foundational multimodal capabilities in place but lacks the **polished UI layer, theming system, and gamification infrastructure** required by UI 2.0.

---

## Gap Analysis by Area

### 1. **Theme & Design System**

| Existing State                                           | UI 2.0 Requirement                                                                    | Gap                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Single Tailwind palette with basic tokens (`tokens.css`) | **Adult (A2)** + **Kid (K2)** palettes with CSS vars switching                        | Need dual-theme system with mode-aware token swapping |
| Basic motion tokens                                      | Motion tokens + **reduced-motion** support (spring, FPS caps, Lottie→static fallback) | Need global reduced-motion hook + CSS class system    |
| No mascot assets                                         | **Palma mascot** with 6 states (idle/listening/thinking/encouraging/success/oops)     | Need asset registry + PalmaManager + event wiring     |

**Actions Required:**

- [ ] Expand `tailwind.config.ts` and `tokens.css` with A2/K2 palettes and mode switching
- [ ] Add `useReducedMotion` hook and implement fallback behaviors
- [ ] Create `assets/registry.json` for Lottie/SVG assets with metadata
- [ ] Build Palma component + PalmaManager state orchestrator

---

### 2. **Entry & Permissions**

| Existing State                                      | UI 2.0 Requirement                                                         | Gap                                                |
| --------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------- |
| Separate camera permission flow in `CameraFeed.tsx` | **Unified camera+mic** permission screen with privacy note + demo fallback | Need consolidated permission gate before app entry |
| No voice permission UI                              | Voice permission with "Open Settings" recovery + retry flow                | Need voice permission handling + denied states     |
| No demo video fallback                              | "Explore without camera" path with demo video feed                         | Need demo video player as camera feed alternative  |

**Actions Required:**

- [ ] Create `PermissionsScreen.tsx` (camera+mic unified gate)
- [ ] Add demo video fallback component
- [ ] Wire permission denied recovery patterns (retry + demo path)
- [ ] Update `App.tsx` to gate on permissions before main flows

---

### 3. **Layout & Information Architecture**

| Existing State                       | UI 2.0 Requirement                                                           | Gap                                     |
| ------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------- |
| Basic `AppShell.tsx` with safe areas | **Top rail** (Learn \| Practice · Kid · Voice · Settings)                    | Need top navigation component           |
| Mobile-first layout                  | **Split view** (desktop: left camera/right steps; mobile: bottom action row) | Need responsive layout with breakpoints |
| No paths/packs grid                  | Cards grid for Learn paths (Basics, Everyday, Feelings) with star goals      | Need path card component + grid layout  |

**Actions Required:**

- [ ] Build `TopRail.tsx` component with mode toggles and navigation
- [ ] Create `BottomActions.tsx` for mobile (Replay/Slow/Next/Help)
- [ ] Design `PathCard.tsx` component for Learn mode
- [ ] Implement split-view responsive layout

---

### 4. **HUD & Overlays**

| Existing State                | UI 2.0 Requirement                                                           | Gap                                         |
| ----------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------- |
| No camera status HUD          | **Camera Status HUD** (state chip, progress ring, confidence bar, tips rail) | Need complete HUD system                    |
| Basic voice badge in header   | **Voice Listening HUD** (mic orb, live transcript bubble, hint chips)        | Need enhanced voice visualization           |
| `CountdownOverlay.tsx` exists | **Rocket countdown (kid)** + **Finger countdown (adult)** with grace periods | Need dual countdown variants + pacing logic |

**Actions Required:**

- [ ] Create `components/hud/StatusChip.tsx`
- [ ] Create `components/hud/HandProgressRing.tsx`
- [ ] Create `components/hud/ConfidenceBar.tsx`
- [ ] Create `components/hud/TipsRail.tsx`
- [ ] Create `components/voice/MicOrb.tsx`
- [ ] Create `components/voice/TranscriptBubble.tsx`
- [ ] Create `components/overlays/CountdownRocket.tsx` (kid)
- [ ] Create `components/overlays/CountdownFinger.tsx` (adult)
- [ ] Split existing `CountdownOverlay.tsx` or refactor for dual modes

---

### 5. **Onboarding & Calibration**

| Existing State                                  | UI 2.0 Requirement                                                         | Gap                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| `DirectionsSheet.tsx` provides basic onboarding | **3-slide carousel** (camera/mic magic, 4 gestures, choose mode)           | Need multi-slide onboarding component       |
| No calibration flow                             | **Mini calibration** (4 gestures with live meters, save device thresholds) | Need calibration UI + threshold persistence |

**Actions Required:**

- [ ] Create `components/onboarding/OnboardingCarousel.tsx`
- [ ] Create `components/calibration/CalibrationFlow.tsx`
- [ ] Add device profile storage for calibration thresholds
- [ ] Wire calibration to gesture evaluator threshold system

---

### 6. **Kid Mode System**

| Existing State              | UI 2.0 Requirement                                                                    | Gap                                           |
| --------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------- |
| Store has `kidMode` boolean | Kid mode applies **visual + behavioral deltas** (palette, pacing, countdown, UI size) | Need theme switching + pacing engine changes  |
| No kid-specific pacing      | 10-12 FPS detection, 2s holds, wider success margins                                  | Need FPS throttling + hold duration config    |
| Single countdown            | Rocket countdown with 1s post-Go grace                                                | Need kid-specific countdown with grace period |

**Actions Required:**

- [ ] Add `src/state/kidMode.ts` with theme + behavior config
- [ ] Update gesture evaluator to respect kid pacing (FPS, hold duration, margins)
- [ ] Wire Rocket countdown to kid mode
- [ ] Apply CSS class for kid theme (chunky shapes, bigger CTAs)

---

### 7. **Progress & Gamification**

| Existing State         | UI 2.0 Requirement                                                             | Gap                                            |
| ---------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------- |
| Stars tracked in store | **Sticker board** (placeable stickers, save layout)                            | Need sticker placement UI + persistence        |
| Basic unlock confetti  | **Milestone cards** (5/10 signs, path complete, Golden Spark for perfect form) | Need milestone system + rare sparkle animation |
| No streak system       | **Streak with grace day** (1 grace/week)                                       | Need streak tracking + grace logic             |

**Actions Required:**

- [ ] Create `components/progress/StickerBoard.tsx`
- [ ] Create `components/progress/MilestoneCard.tsx`
- [ ] Add streak state management with grace day logic
- [ ] Wire milestone triggers to practice/lesson completion events
- [ ] Add "Golden Spark" animation for perfect form detection

---

### 8. **Backgrounds & Motion**

| Existing State               | UI 2.0 Requirement                                         | Gap                                      |
| ---------------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| Basic gradient in `AppShell` | **Adult:** gradient + soft grain shimmer                   | Need background variants                 |
| No kid-specific background   | **Kid:** playful pattern + light parallax                  | Need illustrated pattern with parallax   |
| No motion hierarchy          | Motion tokens: 200-300ms micro, 600-900ms scene, 30fps cap | Need motion system + performance budgets |

**Actions Required:**

- [ ] Create `src/styles/backgrounds.css` with adult/kid variants
- [ ] Add parallax background component (disabled on reduced-motion)
- [ ] Enforce motion tokens across all animations
- [ ] Add Lottie performance budgets (<150KB, pause when hidden)

---

### 9. **Recovery Patterns**

| Existing State                   | UI 2.0 Requirement                         | Gap                                   |
| -------------------------------- | ------------------------------------------ | ------------------------------------- |
| Basic camera error handling      | No camera → demo video or retry            | Partial (need demo video integration) |
| No gesture recovery UI           | No hand found → "Try again" + 3 tips       | Need recovery screen                  |
| No low-light detection           | Low light → "High gain mode" toggle + tip  | Need brightness detection + toggle    |
| No voice permission denied state | Voice off → permission banner + how to fix | Need voice recovery banner            |

**Actions Required:**

- [ ] Add `NoHandFoundScreen.tsx` with tips
- [ ] Add low-light detection + high-gain mode toggle
- [ ] Add voice permission denied banner with recovery instructions
- [ ] Wire all recovery patterns to error states

---

### 10. **Accessibility & ARIA**

| Existing State             | UI 2.0 Requirement                           | Gap                                  |
| -------------------------- | -------------------------------------------- | ------------------------------------ |
| Basic focus-visible styles | **ARIA-live** for HUD/transcripts/milestones | Need live regions on dynamic content |
| 44px controls (some)       | All controls ≥44px; keyboard access verified | Audit needed                         |
| No captions on videos      | **VTT captions** for lesson videos           | Need caption track support           |

**Actions Required:**

- [ ] Add `aria-live` regions to StatusChip, TranscriptBubble, MilestoneCard
- [ ] Audit all interactive controls for size + keyboard access
- [ ] Add VTT caption support to `SignVideo.tsx` / `LessonPlayer.tsx`
- [ ] Test with VoiceOver/NVDA (manual QA)

---

### 11. **Analytics & Telemetry**

| Existing State                          | UI 2.0 Requirement                                                                                                    | Gap                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Basic logger exists (`utils/logger.ts`) | Structured events: `perm:*`, `countdown:*`, `hud:*`, `voice:*`, `calibration:*`, `kid:*`, `progress:*`, `milestone:*` | Need event taxonomy + stubs |
| No voice text hashing                   | Voice text anonymized/hashed                                                                                          | Need hashing utility        |

**Actions Required:**

- [ ] Expand logger with UI 2.0 event taxonomy
- [ ] Add voice transcript hashing for privacy
- [ ] Wire analytics to all UI 2.0 touchpoints
- [ ] Document analytics in `ATTRIBUTION.md` or dedicated doc

---

### 12. **Assets & Attribution**

| Existing State          | UI 2.0 Requirement                                             | Gap                  |
| ----------------------- | -------------------------------------------------------------- | -------------------- |
| Basic attribution modal | `assets/registry.json` with id/title/alt/variant/unlock/rarity | Need formal registry |
| No Lottie assets        | Lottie: Rocket (kid), Finger (adult), Palma states             | Need asset files     |
| No sticker assets       | Sticker SVG/Lottie with static fallbacks                       | Need sticker library |
| Attribution in modal    | `ATTRIBUTION.md` for external assets/licenses                  | Need file creation   |

**Actions Required:**

- [ ] Create `public/assets/lottie/kid/rocket_countdown.json`
- [ ] Create `public/assets/lottie/adult/finger_countdown.json`
- [ ] Create `public/assets/mascot/{adult|kid}/palma_{state}.svg|json`
- [ ] Create sticker assets (12-16 count, rarity tiers)
- [ ] Create `ATTRIBUTION.md` with licenses for Lottie/illustrations
- [ ] Create `assets/registry.json` manifest

---

## PRD Update Recommendations

### `PRD/hellohands-prd-current.md`

**Section Updates:**

1. **Experience Goals** (lines 13-19)
   - Add: "Adult and Kid Modes provide distinct visual palettes and pacing."
   - Add: "Onboarding + calibration establish device-specific gesture thresholds."
   - Add: "Gamification (stickers, milestones, streaks) motivate continued practice."

2. **Primary Flows** (lines 21-27)
   - Insert new flow: **"1.5. Permissions Gate"** – Unified camera+mic request with demo fallback.
   - Insert new flow: **"2.5. Onboarding & Calibration"** – 3 slides + 4-gesture mini calibration.

3. **Feature Inventory** (lines 29-42)
   - Add: **"Design System v2"** – Adult/Kid palettes, motion tokens, reduced-motion support, backgrounds.
   - Add: **"Camera/Voice HUD"** – State chips, progress rings, confidence bars, mic orb, transcript bubbles.
   - Add: **"Palma Mascot"** – 6-state animation system responding to bus events.
   - Add: **"Gamification"** – Sticker board, milestone cards, streak tracking with grace day.
   - Add: **"Recovery Patterns"** – No camera, no hand, low light, voice denied states.

4. **Observability & QA** (lines 50-54)
   - Add: Analytics taxonomy covering permissions, countdowns, HUD states, voice, calibration, kid mode, progress, milestones.
   - Add: Accessibility checklist (ARIA-live, VTT captions, reduced-motion compliance).

5. **Outstanding Work** (lines 56-66)
   - Add new section: **"UI 2.0 Implementation"** with tasks from `@generate-tasks.md` Phases 0-10.

---

### `PRD/Tasks/task-list.md`

**New Sections to Add:**

```markdown
## 18. UI 2.0 Foundations (Phase 0)

- [ ] Theme tokens v2 (adult/kid palettes, motion tokens) - `M`
- [ ] Reduced-motion support (global hook + CSS class) - `S`
- [ ] Assets registry (`assets/registry.json`) - `S`

## 19. UI 2.0 Entry & Permissions (Phase 1)

- [ ] Unified permission screen (camera+mic) - `M`
- [ ] Demo video fallback - `S`

## 20. UI 2.0 Layout & IA (Phase 2)

- [ ] Top rail (Learn | Practice · Kid · Voice · Settings) - `M`
- [ ] Split view & bottom action bar - `M`
- [ ] Cards for paths/packs - `S`

## 21. UI 2.0 HUDs & Overlays (Phase 3)

- [ ] Camera Status HUD (chip, ring, bar, tips) - `L`
- [ ] Voice Listening HUD (orb, transcript, hints) - `M`

## 22. UI 2.0 Onboarding & Calibration (Phase 4)

- [ ] Onboarding carousel (3 slides) - `M`
- [ ] Mini calibration (4 gestures + thresholds) - `L`

## 23. UI 2.0 Mode Behaviors (Phase 5)

- [ ] Kid Mode engine (rocket, pacing, theme) - `L`
- [ ] Adult timing (finger countdown) - `S`

## 24. UI 2.0 Recovery Patterns (Phase 6)

- [ ] No camera flow - `S`
- [ ] No hand found - `S`
- [ ] Low light toggle - `S`
- [ ] Voice off banner - `S`

## 25. UI 2.0 Progress & Gamification (Phase 7)

- [ ] Sticker board - `M`
- [ ] Milestone cards + rare sparkle - `M`
- [ ] Streak with grace day - `S`

## 26. UI 2.0 Backgrounds & Motion (Phase 8)

- [ ] Adult background (gradient + grain) - `S`
- [ ] Kid background (pattern + parallax) - `S`

## 27. UI 2.0 Accessibility & QA (Phase 9)

- [ ] ARIA-live audit - `M`
- [ ] Keyboard access audit - `M`
- [ ] VTT captions for videos - `S`

## 28. UI 2.0 Analytics & Attribution (Phase 10)

- [ ] Event stubs + logger expansion - `S`
- [ ] ATTRIBUTION.md - `S`

## 29. Palma Mascot (Phase 3.5)

- [ ] PalmaManager (event→state) - `M`
- [ ] Palma component (SVG/Lottie + reduced-motion) - `M`
- [ ] Event hooks (voice, HUD, countdown, recovery) - `S`
- [ ] Assets load (preload + lazy) - `S`
- [ ] QA (CPU <5%, mobile thermals OK) - `S`
```

---

## File Structure Additions

### New Directories

```
src/
  components/
    hud/                      # NEW
      StatusChip.tsx
      HandProgressRing.tsx
      ConfidenceBar.tsx
      TipsRail.tsx
    voice/                    # NEW
      MicOrb.tsx
      TranscriptBubble.tsx
    overlays/                 # NEW (or extend sheets/)
      CountdownRocket.tsx
      CountdownFinger.tsx
    onboarding/               # NEW
      OnboardingCarousel.tsx
    calibration/              # NEW
      CalibrationFlow.tsx
    progress/                 # NEW
      StickerBoard.tsx
      MilestoneCard.tsx
    layout/                   # NEW
      TopRail.tsx
      BottomActions.tsx
    mascot/                   # NEW
      Palma.tsx
      PalmaManager.tsx
  hooks/
    useReducedMotion.ts       # NEW
  state/
    kidMode.ts                # NEW
    voice.ts                  # NEW (if not exists)
    progress.ts               # NEW
  styles/
    backgrounds.css           # NEW

public/
  assets/
    lottie/
      kid/
        rocket_countdown.json
      adult/
        finger_countdown.json
    mascot/
      adult/
        palma_idle.svg
        palma_idle.json
        palma_listening.json
        palma_thinking.json
        palma_encouraging.json
        palma_success.json
        palma_oops.json
      kid/
        (same as adult with kid palette)
    stickers/
      (12-16 sticker SVGs/Lottie)
    registry.json             # NEW

ATTRIBUTION.md                # NEW (root)
```

---

## Migration Strategy

### Phase A: Foundation (Week 1)

1. Theme tokens v2 + reduced-motion hook
2. Assets registry + ATTRIBUTION.md
3. Update existing components to honor reduced-motion

### Phase B: Entry & Layout (Week 2)

4. Unified permissions screen
5. Top rail + bottom actions
6. Split view layout

### Phase C: HUDs & Mascot (Week 3)

7. Camera Status HUD components
8. Voice Listening HUD components
9. Palma mascot + PalmaManager

### Phase D: Onboarding & Modes (Week 4)

10. Onboarding carousel + calibration
11. Kid Mode engine (rocket, pacing, theme switching)
12. Adult countdown (finger)

### Phase E: Gamification & Polish (Week 5)

13. Sticker board + milestone cards
14. Streak system
15. Recovery patterns (no camera, no hand, low light, voice)
16. Backgrounds (adult/kid)

### Phase F: Accessibility & QA (Week 6)

17. ARIA-live regions
18. Keyboard audit + VTT captions
19. Analytics expansion
20. E2E testing (Adult + Kid flows)

---

## Open Questions for Team

1. **Asset Creation:** Who's responsible for Lottie animations (Rocket, Finger, Palma states, stickers)? Need design handoff timeline.
2. **Kid Palette Hues:** Confirm exact hex values for K2 palette (current spec has `#FF7A59`, `#6ADCA0`, `#3A8DFF`, `#845EF7`, `#FFC94A`).
3. **Mascot Style:** Hand-sprite vs spark buddy? State list ready (idle, listening, thinking, encouraging, success, oops).
4. **Sticker Count:** 12 vs 16 stickers for v1? Rarity tiers (common, rare, epic)?
5. **Voice Wake Phrase:** Enabled or tap-to-talk only?
6. **Feature Flag Strategy:** Ship under `VITE_UI2_ENABLED=1` initially?
7. **Onboarding Persistence:** How to handle repeat users (skip carousel if completed)?

---

## Success Criteria

- [ ] All UI 2.0 PRD requirements mapped to existing PRD sections or new tasks
- [ ] Task list updated with Phases 0-10 + estimates
- [ ] File structure plan documented
- [ ] Migration timeline proposed (6-week phased rollout)
- [ ] Open questions surfaced for stakeholder decisions
- [ ] No regression in existing MVP flows (lessons, practice, voice, gestures, Goose panel)

---

## Next Steps

1. **Stakeholder Review:** Share this analysis for approval and prioritization.
2. **Asset Pipeline:** Kickoff Lottie/SVG asset creation with design team.
3. **Branch Strategy:** Create `feat/ui2/*` branches per phase.
4. **Incremental Rollout:** Ship Phase A-B under feature flag; gather internal feedback before full release.
5. **Documentation:** Update README with UI 2.0 feature overview once shipped.

---

## Appendix: Key Files to Update

| File                               | Update Type | Description                                                     |
| ---------------------------------- | ----------- | --------------------------------------------------------------- |
| `PRD/hellohands-prd-current.md`    | Major       | Add UI 2.0 goals, flows, features, and outstanding work section |
| `PRD/Tasks/task-list.md`           | Major       | Add Phases 18-29 covering UI 2.0 implementation                 |
| `tailwind.config.ts`               | Major       | Add A2/K2 palette tokens                                        |
| `src/styles/tokens.css`            | Major       | Add CSS vars for dual themes                                    |
| `src/App.tsx`                      | Major       | Wire permissions gate, top rail, mode switching                 |
| `src/state/useLessonStore.ts`      | Minor       | Add streak tracking                                             |
| `src/components/AppShell.tsx`      | Minor       | Support theme switching                                         |
| `src/hooks/useVoiceInput.ts`       | Minor       | Add transcript bubble integration                               |
| `src/gestures/gestureEvaluator.ts` | Minor       | Add kid mode pacing (FPS throttle, hold duration)               |
| `README.md`                        | Minor       | Document UI 2.0 features + feature flags                        |

---

**End of Analysis**
