# Demo Readiness Checklist

This playbook captures the final polish tasks from the MVP tracker (Section 16) so you can repeatably ship a 90-second Hello Hands walkthrough.

## 1. Performance Sweep

- **Build output:** `pnpm build` (Vite) produces chunks totalling ≈300 KB gzip. The hero bundle stays under the 350 KB target, and code-splitting keeps the Subagents panel behind a dynamic import.
- **Lazy loading:** Camera and Goose proxy modules load on demand when the Practice page or Subagents panel mounts; gesture and voice hooks guard against SSR.
- **Clip durations:** Level 1 sample MP4s stay below 8 seconds with H.264 baseline profile. Confirm lengths under `public/signs/level1/*/front.mp4` before capture.
- **Runtime audit:** Run Lighthouse (mobile) against `pnpm preview` and ensure First Contentful Paint <2.5 s and Time to Interactive <3.5 s on a midrange laptop. Document metrics in release notes.

## 2. Capture the Demo

1. Launch the local stack: `pnpm dev:all` and, in a second terminal, `pnpm mcp:server`.
2. Open the Practice page in a modern browser with good lighting and allow camera access.
3. Use QuickTime (macOS) or OBS to record a 1280×720 window. Start recording before switching from the Welcome screen.
4. Walkthrough script (≈90 s):
   - Welcome → toggle Kid Mode → start Level 1.
   - Complete one sign with manual controls; trigger Replay and Slow-mo via gestures or voice.
   - Earn five stars (use manual override controls if needed) and celebrate Level 2 unlock.
   - Open the Practice page, hold a thumbs-up to emit a planner success event, and show the Subagents console streaming logs.
   - Pop open the attribution modal before exiting.
5. Stop recording, trim dead air, and export as `hellohands-demo.mp4`. Store in shared drive (not Git) alongside run notes.

## 3. Final README Pass

- Confirm the Quickstart block matches your environment (`pnpm dev`, `goose:proxy`, `mcp:server`).
- Link to `docs/practice-pipeline.md` and this checklist so future contributors can repeat the polish.
- Add the latest Lighthouse metrics and demo link to the release section.

## 4. Handoff Notes

- Verify `practice/packs.missing.json` is empty before the demo; rerun `pnpm practice:generate` if the whitelist changes.
- Keep `public/hand_landmarker.task` bundled or documented for offline environments (`pnpm hand:model`).
- Document any deviations (e.g., fallback from voice to manual controls) in the demo notes attached to the video.

Completing this list satisfies the “Demo Readiness” tasks from the MVP tracker and leaves a paper trail for future rehearsals.
