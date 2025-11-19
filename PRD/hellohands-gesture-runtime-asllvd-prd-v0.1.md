# HelloHands — Gesture Runtime & ASLLVD — PRDs + Cursor Tasks (v0.1)

> Scope: ship smooth, reliable gesture acceptance (with countdown + refractory) and integrate ASLLVD packs (Essentials, Social Basics) with correct attribution. No code in this doc.

---

## PRD A — Gesture Runtime Migration Spike (MediaPipe Tasks + Worker + Countdown)

### Problem

Legacy `@mediapipe/hands` runs on the main thread and feels twitchy. We need stable gesture acceptance, a visible countdown, and refractory behavior — with parity for voice accepts — without introducing UI jank.

### Goals

- Run **MediaPipe Tasks → GestureRecognizer** inside a **Web Worker**.
- Add **frame throttling** (15–24 fps) and **backpressure** (drop policy under load).
- Apply **landmark smoothing** and **gesture hysteresis**, require **hold_ms** and **refractory_ms**.
- On accept: **freeze HUD**, show **3-2-1 countdown**, advance to next clip; mirror the same flow for **voice** accepts.
- Centralize tunables (fps/timers/thresholds) in shared config; log perf + accept quality.
- Keep legacy `@mediapipe/hands` behind a feature flag for A/B and fallback.

### Non-Goals

- Creating new gesture classes beyond the current set.
- Visual redesign beyond the minimal, accessible countdown overlay.

### Success Metrics

- Main-thread frame time stable (no stutter) at **15–24 fps**.
- **≥30%** fewer false accepts (candidate→accepted→cancel flaps) vs legacy.
- Accept→next latency: **≤1.2s** desktop, **≤1.6s** mobile.
- Zero hydration/layout warnings introduced.

### Constraints

- Offline-capable model hosting; pinned versions.
- Target browsers: Chrome/Safari desktop, recent mobile Chromium baseline.

### Risks

- WASM + model load size; cache warm time.
- Worker import quirks; OffscreenCanvas support variance.

### Deliverables

- `gesture-worker` (Tasks API + smoothing/hysteresis + hold/refractory).
- Countdown overlay + audio tick hook; frozen HUD lock state.
- Shared config surface; presets (desktop/mobile/low_power).
- Metrics + timeline logs; A/B flags and docs.

### Milestones

- **M0**: Worker skeleton + message contract + frame throttle.
- **M1**: GestureRecognizer wired + smoothing + hysteresis.
- **M2**: Accept slow-down: hold/refractory + countdown + voice parity.
- **M3**: Metrics + A/B vs legacy + docs/playbook update.

### Cursor Tasks — A (gesture-runtime)

- [ ] **Worker skeleton**: create `gesture-worker` module; define message contract (`candidate | accepted | lost | countdown_done`).
- [ ] **Throttle & backpressure**: target 15–24 fps; drop/skip policy under load; expose `fps_target`.
- [ ] **Smoothing**: add EMA/One-Euro filter for landmarks; configurable `alpha` / `min_cutoff`.
- [ ] **Hysteresis**: entry/exit thresholds for classifier/heuristics; reduce twitch.
- [ ] **Timers**: implement `hold_ms` + `refractory_ms`; freeze HUD on accept; emit `accepted` payload (type, score, hold_ms).
- [ ] **Countdown overlay**: 3-2-1 visual + optional audio tick; emit `countdown_done`.
- [ ] **Voice parity**: route voice accepts into the same Accepted→Countdown→Next path; resolve conflicts.
- [ ] **Config surface**: create shared config (`packages/config`): `fps`, `hold_ms`, `release_ms`, `refractory_ms`, per-gesture thresholds, `countdown_ms`; presets for desktop/mobile/low_power.
- [ ] **Metrics**: log fps, per-stage ms, dropped frames, queue depth, accept jitter; push to logger/bus.
- [ ] **Flags**: add `WORKER_ON`, `COUNTDOWN`, `REFRACTORY`, `RUNTIME=hands|tasks` (A/B switch).
- [ ] **Docs**: README/playbook updates; troubleshooting (assets, worker import, fallback).

> Optional backlog (A):
>
> - [ ] Landmarks Classifier v0: add recording toggle; write landmarks-sequence JSONL; Goose recipes `gesture_seq_train|eval|export`; load tiny sequence model in Worker and replace most heuristics with `model_score + hold`.

---

## PRD B — ASLLVD Dataset Integration (Ingest → Packs → App)

### Problem

We need a consistent, licensed ASL source to power one-hand MVP packs with reliable metadata and coverage.

### Goals

- Ingest **ASLLVD** subset via existing login; pick **canonical view** per sign.
- Normalize clips (trim by annotated start/end; fixed fps/size) + posters.
- Emit **labels.jsonl** + **packs.generated.json**; enforce **coverage ≥90%** for Essentials/Social Basics.
- Add **attribution modal** with required citation.
- Gate with `DATASET=MSASL|ASLLVD`; reuse Planner/Prefetch/Attribution paths.

### Non-Goals

- Full-corpus ingestion.
- Research-grade ASL recognition training in this pass.

### Success Metrics

- Packs load (no broken links); Prefetch warms next clip; countdown flow preserved.
- Coverage per pack **≥90%**; attribution visible and correct.

### Constraints

- Respect dataset license; keep raw sources out of git if restricted.
- Consistent naming + checksums for reproducibility.

### Risks

- Inconsistent framing (partial body), lighting variance.
- Mislabeled/duplicate tokens; view selection ambiguity.

### Deliverables

- Ingest manifest; processed clips + posters.
- `labels.jsonl`, `packs.generated.json`, coverage report.
- Attribution copy/modal; dataset feature flag; docs/playbook.

### Milestones

- **M0**: Licensing/attribution captured; sign lists locked.
- **M1**: Ingest manifests + trimming/normalization rules.
- **M2**: Pack generation + coverage validation; posters generated.
- **M3**: App integration + QA + playbook update.

### Cursor Tasks — B (asllvd-integration)

- [ ] **License & attribution**: capture required citation text; add to Attribution modal copy; document in README.
- [ ] **Sign lists**: lock Essentials & Social Basics gloss mapping (ASLLVD → pack ids); store under `practice/`.
- [ ] **Ingest manifest**: build CSV/JSON with `gloss, signer, token_id, camera, src, start_frame, end_frame, fps`; keep checksums.
- [ ] **Canonical view rule**: prefer front A/B; fallback side; record `view_id` in metadata.
- [ ] **Normalize clips**: trim by start/end; target fps (e.g., 30) & size (e.g., 256/320); deterministic filenames `asllvd/{gloss}/{signer}/{token}_{cam}.mp4`.
- [ ] **Generate posters**: mid-sign frame rule; ensure face + hands in view.
- [ ] **labels.jsonl**: write per-clip metadata (clip_id, gloss, signer, view, bounds, fps, src, license, checksum).
- [ ] **packs.generated.json**: assemble Essentials/Social Basics packs; validate paths.
- [ ] **Coverage check**: compute expected vs found; log top 10 gaps per pack; save report.
- [ ] **Dataset flag**: add `DATASET=ASLLVD|MSASL`; verify Planner/Prefetch unaffected.
- [ ] **QA checklist**: framing (hands+face), playback, countdown flow, attribution keys; export logs.
- [ ] **Docs**: README + playbook updates (ingest steps, flags, storage guidance).

> Optional backlog (B):
>
> - [ ] Skeleton/pose stream: evaluate ASLLVD-Skeleton for training the tiny sequence classifier; map `token_id` across assets.

---

## Shared Integration Notes

- **Goose alignment**: keep SSE proxy for logs; optionally add a small Node "Bridge" with `/agent/accept` to coordinate next-clip decisions using existing recipes (`asl_mvp`, `asl_practice`, verifier). Stage behind a feature flag.
- **Flags summary**: `RUNTIME=hands|tasks`, `WORKER_ON`, `COUNTDOWN`, `REFRACTORY`, `DATASET=MSASL|ASLLVD`.
- **Metrics to watch**: fps, per-stage ms, dropped frames, queue depth, accept jitter, accept→next latency.

---

## Acceptance Checklists (Ship Gates)

### Gesture Runtime

- [ ] UI stable at 15–24 fps; no hydration/layout warnings.
- [ ] Flap rate reduced ≥30% vs legacy.
- [ ] Accept→next latency within target on desktop & mobile.
- [ ] Voice/gesture parity: identical countdown flow.

### ASLLVD Integration

- [ ] Coverage ≥90% per pack; zero broken asset links.
- [ ] Posters match clips; framing quality passes spot checks.
- [ ] Attribution visible and correct; license text included.
- [ ] Prefetch warms next; logs export clean.
