# UI 2.0 Gap Closure Plan — Systematic Implementation

> Priority-ordered plan to close all gaps identified in migration analysis

---

## 🎯 Objective

Close all 21 component gaps, 4 state gaps, and 10 feature gaps to achieve full UI 2.0 compliance.

**Timeline:** 6 weeks (32 working days)
**Approach:** Bottom-up (foundations first) + parallel tracks where possible

---

## 📊 Gap Inventory

### Critical Gaps (Blocks Everything)

- ❌ Dual-theme system (Adult A2 + Kid K2)
- ❌ Reduced-motion infrastructure
- ❌ Assets registry

### High Priority Gaps (Blocks Major Features)

- ❌ Unified permissions screen
- ❌ Camera Status HUD (4 components)
- ❌ Voice Listening HUD (2 components)
- ❌ Kid Mode engine
- ❌ Palma mascot system

### Medium Priority Gaps (User-Facing Features)

- ❌ Top rail navigation
- ❌ Onboarding carousel
- ❌ Calibration flow
- ❌ Sticker board
- ❌ Milestone cards
- ❌ Countdown variants (Rocket/Finger)

### Low Priority Gaps (Polish)

- ❌ Recovery patterns (4 screens)
- ❌ Backgrounds
- ❌ Streak system
- ❌ ARIA-live regions
- ❌ VTT captions

---

## 🚀 Implementation Strategy

### Phase Structure

```
Foundation (3 days) → Entry (2 days) → Layout (3 days) → HUDs (5 days)
→ Mascot (2 days) → Onboarding (3 days) → Modes (4 days) → Gamification (5 days)
→ Polish (3 days) → QA (2 days) = 32 days
```

### Parallel Tracks

- **Track A (Frontend):** Components, layout, UI
- **Track B (State/Logic):** Store, hooks, evaluators
- **Track C (Assets):** Lottie, stickers, registry (YOU)

---

## 📅 Day-by-Day Gap Closure

### **WEEK 1: Foundation + Entry (Days 1-5)**

#### Day 1 — Track A: Theme System ⭐ CRITICAL

**Gap:** No dual-theme system
**Tasks:**

1. Update `tailwind.config.ts`

   ```typescript
   theme: {
     extend: {
       colors: {
         adult: {
           bg: '#0E0E0E',
           surface: '#1F1F1F',
           text: '#F2F2F2',
           primary: '#7B2CBF',
           accent: '#5FC4B6',
           gold: '#CDAA62',
           magenta: '#FF4DA1',
           success: '#46E58A',
           warn: '#FFB54A',
           error: '#FF5D74',
         },
         kid: {
           bg: '#FFF8EE',
           surface: '#FFF1DC',
           text: '#1B1B1B',
           primary: '#FF7A59',
           mint: '#6ADCA0',
           blue: '#3A8DFF',
           grape: '#845EF7',
           sun: '#FFC94A',
           success: '#39C572',
           error: '#FF5C6E',
         },
       },
     },
   }
   ```

2. Update `src/styles/tokens.css`

   ```css
   :root[data-theme='adult'] {
     --color-bg: #0e0e0e;
     --color-surface: #1f1f1f;
     --color-text: #f2f2f2;
     --color-primary: #7b2cbf;
     --color-accent: #5fc4b6;
     --hud-accent: var(--color-primary);
   }

   :root[data-theme='kid'] {
     --color-bg: #fff8ee;
     --color-surface: #fff1dc;
     --color-text: #1b1b1b;
     --color-primary: #ff7a59;
     --color-accent: #6adca0;
     --hud-accent: var(--color-primary);
   }
   ```

3. Update `src/components/AppShell.tsx`

   ```typescript
   const theme = useLessonStore(state => state.kidMode ? 'kid' : 'adult');

   return (
     <div data-theme={theme} className="app-shell">
       {children}
     </div>
   );
   ```

**Closes Gap:** Dual-theme system ✅

---

#### Day 1 — Track B: Reduced Motion ⭐ CRITICAL

**Gap:** No reduced-motion infrastructure
**Tasks:**

1. Create `src/hooks/useReducedMotion.ts`
2. Add `.reduce-motion` CSS class
3. Wire to `AppShell`

**Closes Gap:** Reduced-motion hook ✅

---

#### Day 1 — Track C: Assets Registry ⭐ CRITICAL (YOU)

**Gap:** No asset registry
**Tasks:**

1. Update `public/assets/registry.json`

   ```json
   {
     "version": "1.0",
     "lottie": {
       "rocket_countdown": {
         "id": "rocket_countdown",
         "title": "Rocket Countdown",
         "variant": "kid",
         "path": "/assets/lottie/kid/rocket_countdown.json",
         "alt": "Animated rocket countdown for kid mode",
         "size": 128000
       },
       "finger_countdown": {
         "id": "finger_countdown",
         "title": "Finger Countdown",
         "variant": "adult",
         "path": "/assets/lottie/adult/finger_countdown.json",
         "alt": "Finger countdown for adult mode",
         "size": 64000
       }
     },
     "mascot": {
       "palma_idle_adult": {...},
       "palma_listening_adult": {...},
       ...
     },
     "stickers": {
       "star_common": {...},
       ...
     }
   }
   ```

2. Create `ATTRIBUTION.md`
3. Upload Lottie files to correct paths

**Closes Gap:** Assets registry ✅

---

#### Day 2 — Track A: Permissions Screen 🔴 HIGH

**Gap:** No unified permissions screen
**Tasks:**

1. Create `src/components/PermissionsScreen.tsx`
   - Camera + mic request UI
   - Privacy note
   - "Explore without camera" button
   - Denied states (retry + settings link)

2. Update `src/App.tsx`
   ```typescript
   if (!permissionsGranted) {
     return <PermissionsScreen onGranted={handlePermissions} />;
   }
   ```

**Closes Gap:** Unified permissions ✅

---

#### Day 2 — Track A: Demo Video Fallback 🔴 HIGH

**Gap:** No demo video fallback
**Tasks:**

1. Create `src/components/DemoVideoFeed.tsx`
   - Loop demo video
   - Show "Demo Mode" badge
   - Wire to practice/lesson flows

**Closes Gap:** Demo video fallback ✅

---

#### Day 3 — Track A: Top Rail Navigation 🟡 MEDIUM

**Gap:** No top rail
**Tasks:**

1. Create `src/components/layout/TopRail.tsx`
   - Navigation: Learn | Practice
   - Kid Mode toggle
   - Voice toggle
   - Settings (⋯) menu

2. Wire to `AppShell`

**Closes Gap:** Top rail ✅

---

#### Day 3 — Track A: Bottom Actions 🟡 MEDIUM

**Gap:** No bottom action bar
**Tasks:**

1. Create `src/components/layout/BottomActions.tsx`
   - Mobile-only
   - Buttons: Replay, Slow, Next, Help
   - Large touch targets (≥48px)

**Closes Gap:** Bottom actions ✅

---

#### Day 4 — Track A: Learn Mode Paths 🟡 MEDIUM

**Gap:** No Learn mode paths
**Tasks:**

1. Create `src/components/PathCard.tsx`
2. Create `src/screens/LearnScreen.tsx`
   - Paths: Basics, Everyday, Feelings
   - Star goals per path
3. Add `/learn` route

**Closes Gap:** Learn mode ✅

---

#### Day 5 — Track A: Recovery Patterns 🟢 LOW

**Gap:** Limited recovery UI
**Tasks:**

1. Create `src/components/recovery/NoHandFoundScreen.tsx`
2. Create `src/components/recovery/LowLightToggle.tsx`
3. Create `src/components/recovery/VoicePermissionBanner.tsx`

**Closes Gap:** Recovery patterns ✅

---

### **WEEK 2: HUDs (Days 6-10)**

#### Day 6-7 — Track A: Camera Status HUD 🔴 HIGH

**Gap:** No camera HUD
**Tasks:**

1. Create `src/components/hud/StatusChip.tsx`
   - States: Scanning | Hand found | Hold steady | Nice!
   - Top-left overlay
2. Create `src/components/hud/HandProgressRing.tsx`
   - SVG ring with progress fill
   - Reduced-motion → text only
3. Create `src/components/hud/ConfidenceBar.tsx`
   - Horizontal bar + %
4. Create `src/components/hud/TipsRail.tsx`
   - Right-side tips

5. Wire to `CameraFeed.tsx`
   - Subscribe to gesture bus
   - Update HUD on events

**Closes Gap:** Camera HUD (4 components) ✅

---

#### Day 8-9 — Track A: Voice Listening HUD 🔴 HIGH

**Gap:** No voice HUD
**Tasks:**

1. Create `src/components/voice/MicOrb.tsx`
   - States: idle, listening, command
   - Pulse animation
2. Create `src/components/voice/TranscriptBubble.tsx`
   - Live transcript
   - `aria-live="polite"`
   - Hint chips

3. Update `src/hooks/useVoiceInput.ts`
   - Expose transcript state
   - Track misfire count

**Closes Gap:** Voice HUD (2 components) ✅

---

#### Day 10 — Track B: Voice Wake Phrase 🟡 MEDIUM

**Gap:** No wake phrase
**Tasks:**

1. Update `src/hooks/useVoiceInput.ts`
   - Add wake phrase detection ("Hey Palma" or "Hello Hands")
   - Activate listening on wake phrase
   - Fallback to tap-to-talk

**Closes Gap:** Wake phrase ✅

---

### **WEEK 3: Mascot + Onboarding (Days 11-15)**

#### Day 11-12 — Track A: Palma Mascot System 🔴 HIGH

**Gap:** No mascot
**Tasks:**

1. Create `src/components/mascot/Palma.tsx`
   - Render Lottie or SVG based on state
   - 6 states: idle, listening, thinking, encouraging, success, oops
   - Adult/Kid variant switching
   - Reduced-motion → static SVG

2. Create `src/components/mascot/PalmaManager.tsx`
   - Subscribe to gesture bus + voice events
   - State machine:
     ```
     voice:listening_start → listening
     hud:state=scanning → idle
     hud:state=found → encouraging
     hud:state=success → success
     recovery:* → oops
     ```
   - Pause when off-screen (IntersectionObserver)

3. Wire to `App.tsx`

**Closes Gap:** Palma mascot ✅

---

#### Day 13 — Track A: Onboarding Carousel 🟡 MEDIUM

**Gap:** No onboarding
**Tasks:**

1. Create `src/components/onboarding/OnboardingCarousel.tsx`
   - Slide 1: Camera + mic (why we need them)
   - Slide 2: 4 gestures overview
   - Slide 3: Choose Learn or Practice
   - Skip button
   - Persist completion in localStorage
   - "How to Use" button in help sections

2. Wire to `App.tsx` (show after permissions)

**Closes Gap:** Onboarding ✅

---

#### Day 14-15 — Track A: Calibration Flow 🟡 MEDIUM

**Gap:** No calibration
**Tasks:**

1. Create `src/components/calibration/CalibrationFlow.tsx`
   - 4 gesture prompts (thumbs_up, open_palm, point, pinch)
   - Live confidence meter
   - Save thresholds to localStorage

2. Update `src/gestures/gestureEvaluator.ts`
   - Load device profile on init
   - Apply custom thresholds

3. Add "Re-calibrate" to Settings

**Closes Gap:** Calibration ✅

---

### **WEEK 4: Kid Mode + Countdowns (Days 16-20)**

#### Day 16-17 — Track B: Kid Mode Engine 🔴 HIGH

**Gap:** No kid mode behavioral engine
**Tasks:**

1. Create `src/state/kidMode.ts`

   ```typescript
   export const getKidConfig = () => ({
     fps: 10,
     holdDuration: 2000, // 2s
     successMargin: 0.15, // 15% wider
   });
   ```

2. Update `src/gestures/gestureEvaluator.ts`
   - Check `kidMode` from store
   - Apply FPS throttle (10-12 FPS vs 24-30)
   - Increase hold duration
   - Widen success margins

3. Update CSS for kid mode
   - Bigger buttons (≥48px → ≥56px)
   - Chunky border-radius (8px → 16px)
   - Larger text (16px → 20px)

**Closes Gap:** Kid Mode engine ✅

---

#### Day 18 — Track A: Countdown Variants 🟡 MEDIUM

**Gap:** No mode-specific countdowns
**Tasks:**

1. Create `src/components/overlays/CountdownRocket.tsx`
   - Lottie rocket animation
   - 3-2-1-Go
   - 1s grace period after Go

2. Create `src/components/overlays/CountdownFinger.tsx`
   - Finger countdown
   - 1.2-1.5s duration
   - Non-blocking

3. Wire to calibration/drills
   - Rocket in kid mode
   - Finger in adult mode

**Closes Gap:** Countdown variants ✅

---

#### Day 19 — Track A: Backgrounds 🟢 LOW

**Gap:** No themed backgrounds
**Tasks:**

1. Create `src/styles/backgrounds.css`
   - Adult: radial gradient + grain
   - Kid: light gradient + sun/star pattern

2. Wire to `AppShell`

**Closes Gap:** Backgrounds ✅

---

#### Day 20 — Track A: Split View Layout 🟡 MEDIUM

**Gap:** No responsive split view
**Tasks:**

1. Update `AppShell` or lesson pages
   - Desktop: left camera, right steps
   - Mobile: stack + bottom actions
   - Breakpoint: 1024px

**Closes Gap:** Split view ✅

---

### **WEEK 5: Gamification (Days 21-25)**

#### Day 21-22 — Track A: Sticker Board 🟡 MEDIUM

**Gap:** No sticker board
**Tasks:**

1. Create `src/components/progress/StickerBoard.tsx`
   - Grid for stickers
   - Drag-and-drop (desktop) or tap-to-place (mobile)
   - Save layout to localStorage

2. Create `src/state/progress.ts`

   ```typescript
   interface ProgressState {
     stickers: { id: string; unlocked: boolean; placed: boolean; x: number; y: number }[];
     milestones: string[];
     streak: { count: number; lastActivity: string; graceUsed: boolean };
   }
   ```

3. Wire to lesson completion
   - Award sticker on first sign mastery

**Closes Gap:** Sticker board ✅

---

#### Day 23 — Track A: Milestone Cards 🟡 MEDIUM

**Gap:** No milestone cards
**Tasks:**

1. Create `src/components/progress/MilestoneCard.tsx`
   - Types: 5 signs, 10 signs, path complete, Golden Spark
   - Toast/card design
   - Reduced-motion fallback

2. Wire to practice/lesson completion

**Closes Gap:** Milestone cards ✅

---

#### Day 24 — Track B: Streak System 🟢 LOW

**Gap:** No streak system
**Tasks:**

1. Update `src/state/progress.ts`
   - Track last activity date
   - Increment streak daily
   - Grace day logic (1 per week)
   - Reset after 2 missed days

2. Create streak display component

**Closes Gap:** Streak system ✅

---

#### Day 25 — Track C: Sticker Assets (YOU)

**Gap:** No sticker files
**Tasks:**

1. Create 12-16 stickers (SVG or Lottie)
   - Common (8): star, checkmark, trophy, ribbon, medal, thumbs up, sparkle, heart
   - Rare (4): crown, diamond, rocket, rainbow
   - Epic (2-4): Golden Spark, Perfect Form, Streak Master, etc.

2. Update registry.json

**Closes Gap:** Sticker assets ✅

---

### **WEEK 6: Accessibility + QA (Days 26-30)**

#### Day 26 — Track A: ARIA-live Regions 🟢 LOW

**Gap:** No ARIA-live
**Tasks:**

1. Add `aria-live="polite"` to:
   - StatusChip
   - TranscriptBubble
   - MilestoneCard
   - Toast

2. Test with VoiceOver/NVDA

**Closes Gap:** ARIA-live ✅

---

#### Day 27 — Track A: VTT Captions 🟢 LOW

**Gap:** No captions
**Tasks:**

1. Create `.vtt` files for lesson videos
2. Update `SignVideo.tsx` to load captions
3. Enable by default

**Closes Gap:** VTT captions ✅

---

#### Day 28 — Track A: "How to Use" Button 🟢 LOW

**Gap:** No persistent help
**Tasks:**

1. Add "How to Use" button to:
   - Top rail (Settings menu)
   - Help sheet
   - Bottom actions

2. Shows onboarding carousel on demand

**Closes Gap:** Persistent help ✅

---

#### Day 29 — Track B: Analytics Expansion 🟢 LOW

**Gap:** Limited analytics
**Tasks:**

1. Update `src/utils/logger.ts`
   - Add UI 2.0 event taxonomy
   - Voice text hashing

2. Wire events to all touchpoints

**Closes Gap:** Analytics ✅

---

#### Day 30 — Track A+B: QA & Testing 🟢 LOW

**Tasks:**

1. End-to-end testing
   - Adult mode flow
   - Kid mode flow
   - Recovery patterns
2. Accessibility audit
   - VoiceOver/NVDA
   - Keyboard navigation
3. Regression testing
4. Performance audit

**Closes Gap:** QA complete ✅

---

### **DAYS 31-32: Rollout**

#### Day 31 — Internal QA

- Enable `VITE_UI2_ENABLED=1` for team
- Gather feedback
- Fix critical bugs

#### Day 32 — Beta Launch

- Enable for 10% users
- Monitor analytics
- Plan full rollout

---

## 📊 Gap Closure Tracking

### By Week

| Week | Gaps Closed | Components Created | State Files | Remaining Gaps |
| ---- | ----------- | ------------------ | ----------- | -------------- |
| 1    | 10          | 7                  | 1           | 28             |
| 2    | 8           | 6                  | 1           | 20             |
| 3    | 5           | 4                  | 0           | 15             |
| 4    | 6           | 4                  | 1           | 9              |
| 5    | 5           | 3                  | 1           | 4              |
| 6    | 4           | 0                  | 0           | 0 ✅           |

### By Priority

| Priority | Total Gaps | Closed Week 1-2 | Closed Week 3-4 | Closed Week 5-6 |
| -------- | ---------- | --------------- | --------------- | --------------- |
| Critical | 3          | 3 ✅            | 0               | 0               |
| High     | 5          | 3               | 2 ✅            | 0               |
| Medium   | 12         | 2               | 6               | 4 ✅            |
| Low      | 8          | 2               | 0               | 6 ✅            |

---

## ✅ Success Criteria

### Daily

- [ ] No build errors
- [ ] No linter errors
- [ ] Git commit with clear message
- [ ] Manual smoke test of new feature

### Weekly

- [ ] Feature demo to team
- [ ] Update progress in task tracker
- [ ] Performance check (Lighthouse)
- [ ] Accessibility spot check

### Final (Day 32)

- [ ] All 38 gaps closed
- [ ] All tests passing
- [ ] VoiceOver/NVDA happy paths work
- [ ] No regressions in existing features
- [ ] Analytics events firing
- [ ] Ready for beta launch

---

## 🚨 Risk Mitigation

| Risk               | Mitigation                              | Owner         |
| ------------------ | --------------------------------------- | ------------- |
| Asset delays       | Use SVG placeholders                    | You (Track C) |
| Theme breaks UI    | Feature flag + incremental testing      | Dev (Track A) |
| Performance issues | 30fps cap, lazy load, pause when hidden | Dev (Track A) |
| Accessibility gaps | Weekly VoiceOver tests                  | Dev (Track A) |
| Scope creep        | Stick to this plan, defer enhancements  | PM            |

---

## 🎯 Current Status

**Assets Ready (You):**

- ✅ Palma files in `/public/palma/`
- 🟡 Lottie files (adding now)
- 🟡 Stickers (1 hour timeline)

**Code Status:**

- ❌ Not started (waiting on this plan approval)

**Next Action:**

- Start Day 1 (Theme + Reduced Motion + Registry) immediately

---

## 📞 Daily Standups

**Format:**

- Yesterday: What gaps closed?
- Today: Which gaps targeting?
- Blockers: Any issues?

---

**Ready to start? Let's close these gaps! 🚀**
