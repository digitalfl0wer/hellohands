# Hello Hands - Product Requirements

## Purpose and Positioning
Deliver a playful, mobile-first ASL micro-lesson experience that can be demoed end to end in roughly 90 seconds. The product should feel welcoming to beginners while showcasing optional multimodal inputs and parallel agent orchestration.

## Problem and Hypothesis
- **Problem:** New learners (parents, teachers, kids) struggle to find low-friction ASL practice tools that balance accessibility, delight, and clear attribution.
- **Hypothesis:** A touch-first flow with optional air gestures and lightweight voice commands, plus a dedicated Kid Mode and quick help surfaces, will boost first-session completion and perceived delight.

## Users
- **Primary:** ASL beginners and the adults guiding them.
- **Secondary:** Hackathon judges evaluating agent orchestration, UX quality, and accessibility depth.

## Product Goals (MVP)
- Learners finish Level 1 (10 signs), earn five stars, and unlock Level 2 within a guided session.
- Manual controls always work; gestures and voice remain opt-in layers.
- Each clip surfaces signer, source, and license attribution.
- Goose agents visibly coordinate prep, practice, and status messaging.

## Non-Goals (Version 1)
- No authentication, personalization, analytics, or cloud sync.
- No sentence-level instruction, pose scoring, or custom model training.

## Experience Blueprint
- **Welcome:** Level cards (Level 1 unlocked, Level 2 and 3 locked), Kid Mode toggle, floating Settings pill exposing gesture and voice tips.
- **Directions Gate:** Three onboarding bullets, delayed "Begin" affordance (with touch fallback), 3-2-1 countdown into lessons.
- **Lesson Loop:** Poster preview then video playback with Replay, Slow-mo, and Next controls; feedback banner shows Pass, Almost, or Miss.
- **Help Surfaces:** Compact help sheet with looping clip, one actionable tip, and a "Replay in slow-mo" shortcut.
- **Progress and Toasts:** Locked level messaging, unlock celebration, mic/gesture onboarding nudges, low-light hints.

## Input Modes
- **Manual Baseline:** Touch controls and swipes function even when other modes are disabled.
- **Air Gestures:** Optional detection for right-swipe Next, left-swipe Replay, up Slow-mo, down Help. A three-second palm hold pauses; thumbs-up resumes. Provide confirmation overlays, debounce, and cooldown.
- **Voice:** Optional commands for navigation (Next, Replay, Slow-mo, Pause, Resume, Help), level selection, and Kid Mode toggles. Offer polite hints on uncertain recognition.

## Accessibility Requirements
- Captions enabled by default; every instruction appears in text and icons.
- Interactive targets at least 44 points, larger in Kid Mode.
- Honor prefers-reduced-motion by toning down animations and confetti.
- All flows must succeed without gestures or voice.

## Content and Attribution
- Level 1 signs: hello, thank-you, more, help, please, yes, no, eat, drink, stop (exact list may flex with dataset availability).
- Each sign folder contains `poster.jpg`, `front.mp4`, and `meta.json` with signer, source, license text, and link.
- Attribution chip is visible during playback and opens a modal with full license text.

## Visual and Interaction Design
- Tone: bubbly, approachable, inspired by Duolingo and Drops.
- Tailwind tokens define colors, radii, spacing, and typography scale.
- Core components: Level Card, Settings pill, Kid/Adult buttons, Toast, Directions sheet, Help sheet, Feedback banner, Attribution chip/modal, Gesture confirmations.
- Responsive layout optimized for mobile screens, with tablet support.

## Technology and Architecture
- **Frontend:** React with Vite and Tailwind. Zustand powers state with localStorage persistence.
- **State Model:** Track Kid Mode, voiceOn, gesturesOn, level, stars, lesson index, clip queue, and feedback states. Derived `manualMode` flips on when both gesture and voice toggles are off.
- **Data Stubs:** Provide local JSON files (`labels.jsonl`, MCP mocks) so the UI works before the full pipeline lands.
- **MCP Tools:** `packs.list`, `packs.get`, `practice.next`, and `license.info` return static JSON/URIs and are deployable on serverless/edge targets such as Vercel.
- **Agent Plan:** Goose recipes keep voice and gesture listeners running in parallel while lesson planning, prefetching, and attribution checks fan out. Unlock flows remain sequential (unlock, toast, navigation).

## Success Metrics
- **Demo:** Level 1 to five stars and Level 2 unlock in under 90 seconds using touch-only controls; palm pause works at least 90 percent of the time in normal lighting; judges observe parallel agent activity via logs or on-screen indicators.
- **Operational:** Smooth playback on iPhone Safari and Android Chrome; unlock and toast timing feels responsive; attribution modal is keyboard and screen-reader accessible.

## Risks and Mitigations
- **Licensing:** Avoid shipping non-compliant media; surface attribution everywhere; keep large assets outside Git.
- **Lighting and Noise:** Provide low-light guidance; keep voice optional; default to manual controls.
- **Gesture Accuracy:** Apply thresholds, countdowns, and cooldowns; suspend gesture detection during modals.
- **Performance:** Limit clip lengths, lazy-load assets, and keep bundle size modest.

## Definition of Done
- Local build runs start to finish; Level 1 to Level 2 unlock path works; Kid Mode and reduced-motion behaviors validated; attribution displayed.
- Goose demo logs confirm parallel agents; final demo recording captured; README documents run instructions, MCP tools, and licensing.
