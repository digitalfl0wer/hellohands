# Hello Hands - Manual QA Checklist

## Environments
- iOS Safari (latest), Android Chrome (latest), Desktop Chrome/Firefox/Safari
- Network: good Wi‑Fi, throttled 3G (DevTools)
- Motion: prefers-reduced-motion on/off

## App Basics
- Load app without console errors; background and Welcome render
- Navigate Welcome → Directions → Countdown → Lesson; back to Welcome
- Local storage persists Kid Mode, voice/gesture toggles, level, stars

## Inputs
- Voice: toggle on, verify listening badge; commands: Next, Replay, Slow, Help, Pause, Resume; fallback toast on error
- Gestures: swipes → Next/Replay/Slow/Help; long palm-hold → Pause; tap Resume
- Manual: buttons always responsive when inputs off

## Progression
- Pass five times → Level 2 unlock toast; confetti or reduced-motion badge
- Stars reset on level advance; Welcome shows Level 2 unlocked

## Accessibility
- Keyboard: focus outlines visible; Attribution chip/modal reachable; ESC closes modal and focus restores
- Screen reader: toasts announce; Feedback banner role="status"; buttons have descriptive labels
- Color contrast: tokens meet contrast targets on light/dark surfaces

## Performance
- Video playback: Replay/Slow responsive; next clip loads promptly
- Prefetch (if enabled): minimal flicker when moving to next clip

## Error Handling
- Voice unavailable: cleanly disables and shows toast; toggling back on works
- Missing media: helpful toast or fallback UI, no unhandled exception

## Logging
- Console shows gesture/voice/progress logs
- Optional: download logs via logger utility if exposed
