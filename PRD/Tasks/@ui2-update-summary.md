# UI 2.0 Update Summary — Quick Reference

> One-page overview of changes needed to existing PRDs and task lists

---

## 🎯 What's New in UI 2.0

**Big Additions:**
- 🎨 Dual themes (Adult A2 + Kid K2) with automatic switching
- 🤖 Palma mascot (6 states: idle, listening, thinking, encouraging, success, oops)
- 📊 Camera HUD (status chip, progress ring, confidence bar, tips rail)
- 🎤 Voice HUD (mic orb, live transcript bubble, hint chips)
- 🎓 Onboarding carousel (3 slides) + mini calibration (4 gestures)
- 🏆 Gamification (sticker board, milestone cards, streak tracking)
- ♿ Accessibility overhaul (ARIA-live, reduced-motion, VTT captions)
- 🔐 Unified permissions (camera+mic in one screen)

---

## 📝 PRD Updates Required

### `PRD/hellohands-prd-current.md`

**Add to "Experience Goals" (line ~15):**
- Adult and Kid Modes provide distinct visual palettes and pacing
- Onboarding + calibration establish device-specific gesture thresholds
- Gamification motivates continued practice

**Add to "Primary Flows" (line ~22):**
- Flow 1.5: Permissions Gate (camera+mic unified)
- Flow 2.5: Onboarding & Calibration (3 slides + 4 gestures)

**Add to "Feature Inventory" (line ~30):**
- Design System v2 (dual themes, motion tokens, reduced-motion)
- Camera/Voice HUD (chips, rings, orbs, transcripts)
- Palma Mascot (6-state animation system)
- Gamification (stickers, milestones, streaks)
- Recovery Patterns (no camera, no hand, low light, voice denied)

**Add new section "Outstanding Work - UI 2.0":**
- Reference `@generate-tasks.md` Phases 0-10

---

### `PRD/Tasks/task-list.md`

**Add 12 new sections (Sections 18-29):**
```
18. UI 2.0 Foundations (Phase 0) — 3 tasks
19. UI 2.0 Entry & Permissions (Phase 1) — 2 tasks
20. UI 2.0 Layout & IA (Phase 2) — 3 tasks
21. UI 2.0 HUDs & Overlays (Phase 3) — 2 tasks
22. UI 2.0 Onboarding & Calibration (Phase 4) — 2 tasks
23. UI 2.0 Mode Behaviors (Phase 5) — 2 tasks
24. UI 2.0 Recovery Patterns (Phase 6) — 4 tasks
25. UI 2.0 Progress & Gamification (Phase 7) — 3 tasks
26. UI 2.0 Backgrounds & Motion (Phase 8) — 2 tasks
27. UI 2.0 Accessibility & QA (Phase 9) — 3 tasks
28. UI 2.0 Analytics & Attribution (Phase 10) — 2 tasks
29. Palma Mascot (Phase 3.5) — 5 tasks
```

**Total: ~33 new tasks** (15 S, 12 M, 6 L)

---

## 🗂️ New Files to Create

### Components (21 new files)
```
src/components/
  hud/
    ├── StatusChip.tsx
    ├── HandProgressRing.tsx
    ├── ConfidenceBar.tsx
    └── TipsRail.tsx
  voice/
    ├── MicOrb.tsx
    └── TranscriptBubble.tsx
  overlays/
    ├── CountdownRocket.tsx (kid)
    └── CountdownFinger.tsx (adult)
  onboarding/
    └── OnboardingCarousel.tsx
  calibration/
    └── CalibrationFlow.tsx
  progress/
    ├── StickerBoard.tsx
    └── MilestoneCard.tsx
  layout/
    ├── TopRail.tsx
    └── BottomActions.tsx
  mascot/
    ├── Palma.tsx
    └── PalmaManager.tsx
  PermissionsScreen.tsx
```

### State & Hooks (4 new files)
```
src/hooks/useReducedMotion.ts
src/state/kidMode.ts
src/state/voice.ts (if doesn't exist)
src/state/progress.ts
```

### Styles (1 new file)
```
src/styles/backgrounds.css
```

### Assets & Docs (2 new files + asset folders)
```
ATTRIBUTION.md
public/assets/registry.json
public/assets/lottie/kid/rocket_countdown.json
public/assets/lottie/adult/finger_countdown.json
public/assets/mascot/adult/ (6 state files x 2 formats = 12)
public/assets/mascot/kid/ (6 state files x 2 formats = 12)
public/assets/stickers/ (12-16 files)
```

---

## 🔄 Files to Modify

| File | Change Type | What to Update |
|------|------------|---------------|
| `tailwind.config.ts` | Major | Add A2/K2 palette tokens + motion tokens |
| `src/styles/tokens.css` | Major | Add CSS vars for dual themes |
| `src/App.tsx` | Major | Wire permissions gate, top rail, mode switching |
| `src/components/AppShell.tsx` | Minor | Support theme class switching |
| `src/state/useLessonStore.ts` | Minor | Add streak tracking + milestone state |
| `src/hooks/useVoiceInput.ts` | Minor | Integrate transcript bubble |
| `src/gestures/gestureEvaluator.ts` | Minor | Add kid mode pacing (FPS throttle, hold duration) |
| `README.md` | Minor | Document UI 2.0 features + feature flags |

---

## 🚧 Key Gaps (What's Missing vs UI 2.0)

| Area | Current State | Required | Effort |
|------|--------------|----------|--------|
| **Theming** | Single palette | Dual A2/K2 palettes with mode switching | 🔴 Major |
| **HUDs** | None | Camera status + voice listening HUDs | 🔴 Major |
| **Mascot** | None | Palma with 6 states + event wiring | 🔴 Major |
| **Permissions** | Separate camera | Unified camera+mic gate | 🟡 Medium |
| **Onboarding** | Directions sheet | 3-slide carousel + calibration | 🟡 Medium |
| **Gamification** | Stars only | Sticker board + milestones + streaks | 🟡 Medium |
| **Kid Mode** | Boolean flag | Full behavioral + visual engine | 🟡 Medium |
| **Recovery** | Basic errors | 4 recovery patterns with UI | 🟢 Small |
| **Backgrounds** | Single gradient | Adult/kid variants with parallax | 🟢 Small |
| **Accessibility** | Partial | ARIA-live, reduced-motion, VTT | 🟢 Small |

---

## 📅 Suggested Timeline (6-Week Phased Rollout)

### Week 1: Foundation
- Theme tokens v2 + reduced-motion hook
- Assets registry + ATTRIBUTION.md

### Week 2: Entry & Layout
- Unified permissions screen
- Top rail + bottom actions + split view

### Week 3: HUDs & Mascot
- Camera Status HUD (4 components)
- Voice Listening HUD (2 components)
- Palma mascot + PalmaManager

### Week 4: Onboarding & Modes
- Onboarding carousel + calibration
- Kid Mode engine (rocket, pacing, theme)
- Adult countdown (finger)

### Week 5: Gamification & Polish
- Sticker board + milestone cards
- Streak system
- Recovery patterns + backgrounds

### Week 6: Accessibility & QA
- ARIA-live regions
- Keyboard audit + VTT captions
- Analytics expansion
- E2E testing (Adult + Kid flows)

---

## ❓ Open Questions (Need Decisions)

1. **Asset Creation:** Who creates Lottie files (Rocket, Finger, Palma states)? Timeline?
2. **Kid Palette:** Confirm final hex values for K2 palette
3. **Mascot Style:** Hand-sprite vs spark buddy?
4. **Sticker Count:** 12 or 16 for v1? Rarity tiers?
5. **Voice Wake Phrase:** Enabled or tap-to-talk only?
6. **Feature Flag:** Ship under `VITE_UI2_ENABLED=1` initially?
7. **Onboarding Persistence:** Skip carousel for repeat users?

---

## ✅ Success Criteria

- [ ] All UI 2.0 requirements mapped to tasks
- [ ] Task list updated with 33 new items + estimates
- [ ] File structure documented (21 new components + 4 state files)
- [ ] Migration timeline proposed (6 weeks, phased)
- [ ] Open questions surfaced for stakeholders
- [ ] No regression in existing MVP flows

---

## 🎬 Next Steps

1. **Review:** Share analysis with team for approval
2. **Assets:** Kickoff Lottie/SVG creation pipeline
3. **Branch:** Create `feat/ui2/*` branches per phase
4. **Flag:** Implement feature flag system for incremental rollout
5. **Docs:** Update README with UI 2.0 overview post-launch

---

**Quick Links:**
- Full analysis: `@ui2-migration-analysis.md`
- New PRD: `@create-prd.md`
- New tasks: `@generate-tasks.md`
- Current PRD: `PRD/hellohands-prd-current.md`
- Current tasks: `PRD/Tasks/task-list.md`

