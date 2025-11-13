# UI 2.0 Action Plan — Step-by-Step Implementation Guide

> Practical roadmap for implementing HelloHands UI 2.0 updates

---

## 📋 Pre-Implementation Checklist

- [ ] Review all UI 2.0 documentation (`@create-prd.md`, `@generate-tasks.md`, `@ui2-migration-analysis.md`)
- [ ] Get stakeholder approval for 6-week timeline
- [ ] Confirm asset creation pipeline (Lottie files, stickers)
- [ ] Create feature flag system in `.env` and config
- [ ] Create `feat/ui2/foundation` branch
- [ ] Notify team of upcoming changes

---

## 🎯 Implementation Phases

### **Phase 0: Foundation (Week 1, Days 1-3)**

#### Day 1: Theme System
```bash
git checkout -b feat/ui2/themes
```

**Tasks:**
1. Update `tailwind.config.ts`
   - Add Adult A2 palette: `#0E0E0E`, `#1F1F1F`, `#7B2CBF`, `#5FC4B6`, `#CDAA62`, `#FF4DA1`
   - Add Kid K2 palette: `#FFF8EE`, `#FFF1DC`, `#FF7A59`, `#6ADCA0`, `#3A8DFF`, `#845EF7`, `#FFC94A`
   - Add motion tokens: `micro`, `scene`, `fps`

2. Update `src/styles/tokens.css`
   - Add CSS vars for adult/kid themes
   - Add `[data-theme="adult"]` and `[data-theme="kid"]` selectors
   - Map color tokens: `--color-bg`, `--color-surface`, `--color-text`, `--color-primary`, etc.

3. Update `src/components/AppShell.tsx`
   - Add theme class based on store state
   - Test theme switching

**Acceptance:**
- Theme switches without page reload
- All existing components render in both themes
- No visual regressions

---

#### Day 2: Reduced Motion
```bash
git checkout -b feat/ui2/reduced-motion
```

**Tasks:**
1. Create `src/hooks/useReducedMotion.ts`
```typescript
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return prefersReducedMotion;
}
```

2. Add global CSS class in `src/index.css`
```css
.reduce-motion * {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

3. Wire to `AppShell` or `App.tsx`

**Acceptance:**
- System setting disables animations
- Lottie assets have static fallback path (stub for now)

---

#### Day 3: Assets Registry
```bash
git checkout -b feat/ui2/assets-registry
```

**Tasks:**
1. Create `public/assets/registry.json` (stub)
```json
{
  "lottie": {
    "rocket_countdown": {
      "id": "rocket_countdown",
      "title": "Rocket Countdown",
      "variant": "kid",
      "path": "/assets/lottie/kid/rocket_countdown.json",
      "alt": "Animated rocket countdown for kid mode"
    }
  },
  "mascot": {},
  "stickers": {}
}
```

2. Create `ATTRIBUTION.md` at root
```markdown
# Attribution & Licenses

## Lottie Animations
- **Rocket Countdown**: [Source TBD] - License: [TBD]
- **Finger Countdown**: [Source TBD] - License: [TBD]

## Palma Mascot
- Design: HelloHands Team
- License: Proprietary

## Stickers
- [TBD]

## Icons & Illustrations
- [TBD]
```

3. Create placeholder asset directories
```bash
mkdir -p public/assets/lottie/kid
mkdir -p public/assets/lottie/adult
mkdir -p public/assets/mascot/adult
mkdir -p public/assets/mascot/kid
mkdir -p public/assets/stickers
```

**Acceptance:**
- Registry loads without errors
- ATTRIBUTION.md exists and is linked in app footer

---

### **Phase 1: Entry & Permissions (Week 1, Days 4-5)**

#### Day 4: Unified Permissions Screen
```bash
git checkout -b feat/ui2/permissions
```

**Tasks:**
1. Create `src/components/PermissionsScreen.tsx`
   - Camera + mic request UI
   - Privacy note with link to policy
   - "Explore without camera" secondary path
   - Error states (denied → retry + settings link)

2. Add demo video fallback logic
   - Stub video player component
   - Wire to practice/lesson flows

3. Update `src/App.tsx`
   - Gate entry on permissions
   - Show PermissionsScreen before Welcome

**Acceptance:**
- Grants both permissions on approval
- Denied state shows retry + demo path
- Demo video path works for practice

**Analytics:** Add `perm:prompted`, `perm:granted`, `perm:denied` events

---

#### Day 5: Recovery Patterns
```bash
git checkout -b feat/ui2/recovery
```

**Tasks:**
1. Create `src/components/recovery/NoHandFoundScreen.tsx`
   - Big "Try again" button
   - 3 quick tips (lighting, distance, background)

2. Create `src/components/recovery/LowLightToggle.tsx`
   - Detect low brightness (camera feed analysis)
   - "High gain mode" toggle
   - Tip text

3. Create `src/components/recovery/VoicePermissionBanner.tsx`
   - Banner when mic permission denied
   - "Open Settings" link
   - Retry button

4. Wire to existing error states in `CameraFeed` and voice hooks

**Acceptance:**
- Each recovery pattern reachable via dev tools
- No page reload required to recover

---

### **Phase 2: Layout & IA (Week 2)**

#### Day 6-7: Top Rail & Bottom Actions
```bash
git checkout -b feat/ui2/layout
```

**Tasks:**
1. Create `src/components/layout/TopRail.tsx`
   - Navigation: Learn | Practice
   - Toggles: Kid Mode, Voice, Settings (⋯)
   - Wire to store state
   - Active route highlighting

2. Create `src/components/layout/BottomActions.tsx`
   - Mobile-only action row
   - Buttons: Replay, Slow, Next, Help
   - Large touch targets (≥44px)
   - Wire to lesson controls

3. Update `src/components/AppShell.tsx`
   - Add TopRail to header
   - Add BottomActions to footer (mobile only)
   - Adjust safe areas

4. Add responsive breakpoints
   - Desktop: `min-width: 1024px` → split view
   - Mobile: `max-width: 1023px` → bottom actions

**Acceptance:**
- Top rail renders on all pages
- Bottom actions show only on mobile
- Keyboard navigation works
- State syncs with URL

---

#### Day 8: Learn Mode & Path Cards
```bash
git checkout -b feat/ui2/learn-mode
```

**Tasks:**
1. Create `src/components/PathCard.tsx`
   - Card design (title, description, star goal, badge)
   - Adult/Kid visual variants
   - Locked/unlocked states

2. Create `src/screens/LearnScreen.tsx`
   - Grid of paths: Basics, Everyday, Feelings
   - Star progress per path
   - Wire to store

3. Update routing
   - Add `/learn` route
   - Wire to Top Rail "Learn" link

**Acceptance:**
- Path cards grid renders
- Locked paths show motivational copy
- Star progress updates

---

### **Phase 3: HUDs & Overlays (Week 3)**

#### Day 9-11: Camera Status HUD
```bash
git checkout -b feat/ui2/camera-hud
```

**Tasks:**
1. Create `src/components/hud/StatusChip.tsx`
   - States: Scanning | Hand found | Hold steady | Nice!
   - Top-left overlay
   - Auto-transitions based on gesture bus

2. Create `src/components/hud/HandProgressRing.tsx`
   - SVG ring around detected hand
   - Progress fill during hold timer
   - Respects reduced-motion (text only)

3. Create `src/components/hud/ConfidenceBar.tsx`
   - Horizontal bar + percentage
   - Label: "Thumbs Up 92%"
   - Color: green (high), yellow (medium), red (low)

4. Create `src/components/hud/TipsRail.tsx`
   - Right-side floating rail
   - 1-line contextual tips
   - Tips rotate based on state

5. Wire to `src/components/CameraFeed.tsx`
   - Subscribe to gesture bus
   - Update HUD on detection events

**Acceptance:**
- HUD updates through scanning→success flow
- Reduced-motion disables ring animation
- Tips relevant to current state

**Analytics:** Add `hud:state` transitions

---

#### Day 12-13: Voice Listening HUD
```bash
git checkout -b feat/ui2/voice-hud
```

**Tasks:**
1. Create `src/components/voice/MicOrb.tsx`
   - States: idle, listening (pulse), command (glow)
   - CSS animations with reduced-motion fallback
   - Floating position (top-right or bottom-center)

2. Create `src/components/voice/TranscriptBubble.tsx`
   - Live transcript text
   - Auto-hide after 2-3s
   - `aria-live="polite"` for screen readers
   - Hint chips after 2 misfires

3. Update `src/hooks/useVoiceInput.ts`
   - Expose transcript state
   - Track misfire count
   - Trigger hint logic

4. Wire to `src/App.tsx` or practice page

**Acceptance:**
- Transcript bubble shows heard phrases
- Hint appears after 2 misfires
- Screen reader announces transcripts

**Analytics:** Add `voice:heard`, `voice:hint_shown`

---

### **Phase 3.5: Palma Mascot (Week 3, Days 14-15)**

#### Day 14-15: Palma System
```bash
git checkout -b feat/ui2/palma
```

**Tasks:**
1. Create `src/components/mascot/Palma.tsx`
   - Render SVG or Lottie based on current state
   - States: idle, listening, thinking, encouraging, success, oops
   - Adult/Kid variant switching
   - Reduced-motion → static SVG fallback

2. Create `src/components/mascot/PalmaManager.tsx`
   - Subscribe to gesture bus + voice events
   - Map events to Palma states:
     - `voice:listening_start` → listening
     - `hud:state=scanning` → idle
     - `hud:state=found` → encouraging
     - `hud:state=success` → success
     - `recovery:*` → oops
   - Pause when off-screen (Intersection Observer)

3. Create placeholder assets (SVG only for now)
   - `public/assets/mascot/adult/palma_idle.svg` (simple hand or spark icon)
   - Copy for all 6 states
   - Copy for kid variant

4. Wire to `src/App.tsx`
   - Render Palma in corner (bottom-right)
   - Decorative by default (`aria-hidden="true"`)

**Acceptance:**
- Palma responds to voice/gesture events
- Switches states smoothly
- Paused when off-screen
- CPU <5% on idle

**Analytics:** Add `mascot:state_enter`, `mascot:nudge_shown`

---

### **Phase 4: Onboarding & Calibration (Week 4)**

#### Day 16-17: Onboarding Carousel
```bash
git checkout -b feat/ui2/onboarding
```

**Tasks:**
1. Create `src/components/onboarding/OnboardingCarousel.tsx`
   - Slide 1: Camera + mic magic (why we need permissions)
   - Slide 2: The 4 gestures (tiny loops or SVG frames)
   - Slide 3: Choose Learn or Practice
   - Navigation: dots, next/back buttons
   - Skippable with "Skip" link
   - Persist completion flag in localStorage

2. Wire to `src/App.tsx`
   - Show after permissions, before main app
   - Check completion flag

**Acceptance:**
- 3 slides navigate smoothly
- Skip works
- Doesn't show on repeat visits

---

#### Day 18-19: Calibration Flow
```bash
git checkout -b feat/ui2/calibration
```

**Tasks:**
1. Create `src/components/calibration/CalibrationFlow.tsx`
   - 4 gesture prompts: thumbs_up, open_palm, point, pinch
   - Live meter showing detection confidence
   - "Hold steady" instruction
   - Save thresholds to localStorage as device profile
   - Re-run from Settings

2. Update `src/gestures/gestureEvaluator.ts`
   - Load device profile on init
   - Apply custom thresholds if available
   - Fallback to defaults

3. Wire to onboarding (optional step) or Settings

**Acceptance:**
- Calibration saves thresholds
- Thresholds applied on next practice session
- Re-runnable from Settings

**Analytics:** Add `calibration:done`

---

### **Phase 5: Kid Mode Engine (Week 4, Days 20-22)**

#### Day 20-21: Kid Mode Behavioral Engine
```bash
git checkout -b feat/ui2/kid-mode
```

**Tasks:**
1. Create `src/state/kidMode.ts`
   - Config: theme, pacing (FPS, hold duration, margins)
   - Helpers: `getKidConfig()`, `isKidMode()`

2. Update `src/gestures/gestureEvaluator.ts`
   - Check kid mode state
   - Throttle FPS to 10-12 in kid mode (vs 24-30 adult)
   - Increase hold duration to 2s (vs 1.2s adult)
   - Widen success margins

3. Apply visual changes
   - Bigger UI elements (buttons, text)
   - Chunky shapes (border-radius)
   - Larger transcript bubble

**Acceptance:**
- Kid mode applies pacing changes
- UI visually distinct
- FPS throttle observable in console

**Analytics:** Add `kid:enabled`

---

#### Day 22: Countdown Variants
```bash
git checkout -b feat/ui2/countdowns
```

**Tasks:**
1. Create `src/components/overlays/CountdownRocket.tsx` (kid)
   - Lottie rocket animation (stub with static SVG for now)
   - 3-2-1-Go sequence
   - 1s grace period after "Go" (no input blocking)
   - Non-blocking overlay

2. Create `src/components/overlays/CountdownFinger.tsx` (adult)
   - Finger countdown mini overlay
   - 1.2-1.5s duration
   - Non-blocking

3. Wire to calibration/drills
   - Show Rocket in kid mode
   - Show Finger in adult mode

**Acceptance:**
- Rocket countdown shows in kid mode
- Finger countdown shows in adult mode
- Grace period works (1s no-detect after Go)

**Analytics:** Add `countdown:shown`, `countdown:completed`, `countdown:skipped`

---

### **Phase 6: Gamification (Week 5)**

#### Day 23-24: Sticker Board
```bash
git checkout -b feat/ui2/stickers
```

**Tasks:**
1. Create `src/components/progress/StickerBoard.tsx`
   - Grid or canvas for placeable stickers
   - Drag-and-drop (desktop) or tap-to-place (mobile)
   - Save layout to localStorage
   - Award stickers on sign mastery

2. Create `src/state/progress.ts`
   - Track earned stickers
   - Track placement layout
   - Helpers: `awardSticker()`, `isStickerUnlocked()`

3. Create placeholder sticker assets
   - SVG icons (star, trophy, checkmark, etc.)
   - 12 stickers minimum

4. Wire to lesson completion
   - Award sticker on first time mastering a sign

**Acceptance:**
- Stickers placeable and persist
- Awards trigger on events
- Board accessible from settings or profile

**Analytics:** Add `progress:sticker_awarded`

---

#### Day 25: Milestone Cards
```bash
git checkout -b feat/ui2/milestones
```

**Tasks:**
1. Create `src/components/progress/MilestoneCard.tsx`
   - Toast/card design
   - Types: 5 signs, 10 signs, path complete, Golden Spark (perfect form)
   - Dismissible
   - Honors reduced-motion (no sparkle if disabled)

2. Update `src/state/progress.ts`
   - Track milestone triggers
   - Deduplicate (don't show twice)

3. Wire to lesson/practice completion
   - Check thresholds on each pass

**Acceptance:**
- Milestone cards appear on triggers
- Golden Spark shows on perfect form (100% confidence)
- Cards dismiss cleanly

**Analytics:** Add `milestone:reached {type}`

---

#### Day 26: Streak System
```bash
git checkout -b feat/ui2/streaks
```

**Tasks:**
1. Update `src/state/progress.ts`
   - Track last activity date
   - Increment streak on daily activity
   - Grace day logic (1 auto-grace per week)
   - Reset after 2 missed days (unless grace)

2. Create streak display component
   - Show current streak number
   - Flame icon (Kid) or checkmark (Adult)
   - Visible in Top Rail or Welcome

3. Wire to lesson/practice completion
   - Update streak on any activity

**Acceptance:**
- Streak increments daily
- Grace day auto-applied once per week
- Resets after 2 missed days

---

### **Phase 7: Backgrounds & Polish (Week 5, Days 27-28)**

#### Day 27: Backgrounds
```bash
git checkout -b feat/ui2/backgrounds
```

**Tasks:**
1. Create `src/styles/backgrounds.css`
   - Adult: radial gradient using `--color-accent`, soft grain (CSS noise or SVG)
   - Kid: light gradient `#FFF8EE → #FFEBCB` with sun/star tiling (opacity 6-8%)

2. Add parallax component (optional)
   - Light parallax on kid background
   - Disabled on reduced-motion
   - Performance check on mobile

3. Wire to `AppShell` or body class

**Acceptance:**
- Adult background has neon rim + grain
- Kid background has playful pattern
- Parallax disabled on reduced-motion

---

#### Day 28: Motion & Performance Audit
```bash
git checkout -b feat/ui2/performance
```

**Tasks:**
1. Enforce motion tokens
   - Audit all animations
   - Replace hard-coded durations with tokens
   - Ensure 30fps cap on Lottie

2. Lottie performance budgets
   - Each asset <150KB
   - Pause when hidden (Intersection Observer)
   - Preload idle/listening; lazy load others

3. Mobile performance test
   - CPU <5% on idle
   - No thermal throttling after 2 minutes
   - 60fps scrolling

**Acceptance:**
- All animations honor motion tokens
- Lottie pauses when off-screen
- Mobile performance acceptable

---

### **Phase 8: Accessibility & QA (Week 6)**

#### Day 29: ARIA-live Regions
```bash
git checkout -b feat/ui2/aria-live
```

**Tasks:**
1. Add `aria-live="polite"` to:
   - StatusChip (HUD state changes)
   - TranscriptBubble (voice heard)
   - MilestoneCard (milestone reached)
   - Toast (unlock/error messages)

2. Test with VoiceOver (macOS/iOS)
   - Navigate HUD states
   - Hear voice transcripts
   - Hear milestone announcements

3. Test with NVDA (Windows)
   - Same checks as VoiceOver

**Acceptance:**
- Screen reader announces HUD changes
- Voice transcripts announced
- Milestones announced
- No announcement spam (debounced)

---

#### Day 30: Keyboard & Captions
```bash
git checkout -b feat/ui2/keyboard-captions
```

**Tasks:**
1. Keyboard audit
   - Tab through all controls
   - Verify focus order
   - Test Escape to close modals
   - Test Enter/Space on buttons

2. Add VTT captions
   - Create `.vtt` files for lesson videos
   - Wire to `SignVideo.tsx` or `LessonPlayer.tsx`
   - Enable captions by default

3. Focus-visible styles
   - Ensure all controls have visible focus
   - Test in high-contrast mode

**Acceptance:**
- Keyboard navigates all critical flows
- Captions render correctly
- Focus outlines visible

---

#### Day 31-32: Analytics & Final QA
```bash
git checkout -b feat/ui2/analytics-qa
```

**Tasks:**
1. Expand logger with UI 2.0 events
   - All events from PRD taxonomy
   - Voice text hashing for privacy

2. End-to-end testing
   - Adult mode: Permissions → Onboarding → Learn → Lesson → Sticker
   - Kid mode: Same flow with kid pacing/theme
   - Recovery: Trigger no camera, no hand, low light, voice denied
   - Accessibility: VoiceOver/NVDA happy path

3. Regression testing
   - Existing lesson flow works
   - Existing practice flow works
   - Goose panel works
   - Voice commands work

4. Performance testing
   - Lighthouse audit (desktop + mobile)
   - Memory profiling (no leaks)
   - Network profiling (asset sizes)

**Acceptance:**
- All UI 2.0 flows complete without errors
- No regressions in existing features
- Analytics events fire correctly
- Performance targets met

---

## 🚀 Rollout Plan

### Week 6, Day 33-35: Staged Rollout

1. **Internal QA** (Day 33)
   - Enable `VITE_UI2_ENABLED=1` for dev team
   - Gather feedback
   - Fix critical bugs

2. **Beta Users** (Day 34)
   - Enable for 10% of users (feature flag)
   - Monitor analytics for errors
   - Fix P0/P1 bugs

3. **Full Launch** (Day 35)
   - Enable for 100% of users
   - Announce in release notes
   - Update README with UI 2.0 overview

---

## 📊 Success Metrics (Post-Launch)

**Track for 2 weeks:**
- [ ] Time-to-first-scan < 15s (Adult), < 30s (Kid)
- [ ] Lesson completion rate +15% vs baseline
- [ ] Error exits < 5%
- [ ] Accessibility: 0 critical issues from user reports
- [ ] Performance: Lighthouse score >90 (mobile)

---

## 🐛 Known Issues & Workarounds

| Issue | Workaround | Priority |
|-------|-----------|----------|
| Lottie assets TBD | Use static SVG placeholders | P0 |
| Safari voice recognition flaky | Fall back to manual | P1 |
| Parallax jank on low-end mobile | Disable on reduced-motion | P2 |
| Calibration confusing | Add skip option + better copy | P2 |

---

## 📚 Documentation Updates

- [ ] Update `README.md` with UI 2.0 features
- [ ] Update `PRD/hellohands-prd-current.md` (see `@ui2-migration-analysis.md`)
- [ ] Update `PRD/Tasks/task-list.md` (add Sections 18-29)
- [ ] Create `docs/ui2-design-system.md` (palettes, tokens, components)
- [ ] Create `docs/ui2-accessibility.md` (ARIA-live, reduced-motion, VTT)
- [ ] Update `CONTRIBUTING.md` with feature flag conventions

---

## ✅ Final Checklist

- [ ] All 33 tasks complete
- [ ] All PRDs updated
- [ ] All docs updated
- [ ] Feature flags configured
- [ ] Rollout plan executed
- [ ] Success metrics tracked
- [ ] Post-launch retrospective scheduled

---

## 🎉 Launch Day

**Announce:**
- Blog post or release notes
- Social media (if applicable)
- Team celebration 🎊

**Monitor:**
- Error tracking (Sentry/etc.)
- Analytics dashboard
- User feedback channels

---

**Good luck! 🚀**

