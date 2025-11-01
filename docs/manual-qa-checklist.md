# Manual QA Checklist

## Target Browsers / Devices
- [ ] Chrome (latest) — desktop, 1280x800 and 1920x1080
- [ ] Safari (latest) — iPhone simulator, portrait and landscape
- [ ] Chrome (latest) — Android handset, portrait

## Core Flows
- [ ] Welcome → Directions → Countdown → Lesson loop
- [ ] Kid Mode toggle switches copy/affordances
- [ ] Voice toggle shows listening badge and handles Next/Replay/Pause commands
- [ ] Gesture swipe Next/Replay/Slow and palm pause/resume operate within thresholds
- [ ] Manual controls remain functional when voice/gestures disabled
- [ ] Stars increment/reset correctly; Level 2 unlock confetti respects reduced motion

## Practice Workspace
- [ ] Camera prompt appears; mirrored video renders
- [ ] Worker emits gesture events for thumbs_up / open_palm / point / pinch
- [ ] Planner marks PRACTICE_CORRECT when expected gesture matched
- [ ] Subagents panel logs voice, gesture, planner, goose events
- [ ] Log export button downloads JSONL file

## Accessibility
- [ ] All actionable controls reachable via keyboard (Tab/Shift+Tab)
- [ ] Attribution modal traps focus and closes via Escape/click-out
- [ ] Reduced-motion preference switches confetti to static badge
- [ ] Screen reader announces toasts and modal titles

## Performance / Resilience
- [ ] Reload preserves Kid Mode / level / stars state
- [ ] Denying camera gracefully surfaces error badge
- [ ] Goose SSE reconnection handles proxy restarts without freezing UI
- [ ] Voice feature degrades without console spam on unsupported browsers
