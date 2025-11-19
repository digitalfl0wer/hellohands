# Gesture Runtime & ASLLVD — Task Tracker (v0.1)

Labels: `gesture`, `dataset`, `infra`, `ui`, `docs`, `metrics`, `flag` • Estimates: `S` <=1h, `M` 1–3h, `L` 3–6h

---

## A. Gesture Runtime Migration

- [ ] **gesture | L | Worker skeleton:** scaffold `gesture-worker` package, wire message contract (`candidate`, `accepted`, `lost`, `countdown_done`), add integration test stub.
- [ ] **infra | M | Frame throttle + backpressure:** add fps governor (15–24 fps), queue depth monitor, and droppable frame policy driven by config.
- [ ] **gesture | M | Smoothing filters:** add EMA + One-Euro filter utilities for landmarks with per-gesture tuning fields.
- [ ] **gesture | M | Hysteresis envelope:** introduce entry/exit thresholds and dwell timers to stabilize accepts; document defaults.
- [ ] **gesture | M | Hold + refractory timers:** centralize `hold_ms`, `release_ms`, `refractory_ms`; freeze HUD and emit payload metadata.
- [ ] **ui | S | Countdown overlay refresh:** ensure 3-2-1 (visual/audio) triggered by both gesture and voice accepts; add SR-only text.
- [ ] **voice | M | Parity channel:** route voice accepts through same countdown/backpressure path; resolve conflicts (`voice > gesture` tie-breaker rules).
- [ ] **config | S | Shared tunables:** add `packages/config/runtime.ts` (fps presets, timer presets, per-gesture thresholds).
- [ ] **metrics | M | Instrumentation:** log fps, stage timings, dropped frames, queue depth, jitter; ship to logger/bus.
- [ ] **flag | S | Runtime toggles:** add `WORKER_ON`, `COUNTDOWN`, `REFRACTORY`, `RUNTIME=hands|tasks`; expose via env + store.
- [ ] **docs | S | Playbook update:** capture worker import steps, asset hosting, troubleshooting.
- [ ] **qa | M | Benchmark script:** add perf harness to compare legacy vs tasks runtime (frame time, accept latency).

### Optional Backlog

- [ ] **gesture | L | Landmarks classifier v0:** add landmarks recording toggle, JSONL exporter, Goose recipes `gesture_seq_train|eval|export`, load tiny sequence model in worker.

---

## B. ASLLVD Dataset Integration

- [ ] **docs | S | License & attribution:** capture ASLLVD citation text, update Attribution modal + README/playbook.
- [ ] **data | S | Sign lists:** lock Essentials/Social Basics gloss + alias mapping (ASLLVD → pack ids) under `practice/`.
- [ ] **data | M | Ingest manifest tooling:** script to emit CSV/JSON rows (`gloss, signer, token_id, camera, src, start_frame, end_frame, fps, checksum`).
- [ ] **data | M | Canonical view selection:** encode view priority rules, persist `view_id`, flag ambiguous cases.
- [ ] **infra | L | Normalization pipeline:** ffmpeg trim/resize to target fps/size, deterministic filenames `asllvd/{gloss}/{signer}/{token}_{cam}.mp4`, retry + checksum verification.
- [ ] **ui | S | Poster generation:** snapshot mid-sign frames, ensure face/hands visible, save alongside clips.
- [ ] **data | M | labels.jsonl writer:** include clip_id, gloss, signer, view, bounds, fps, license, checksum metadata.
- [ ] **data | M | packs.generated.json:** assemble Essentials + Social Basics packs, validate coverage, emit summary.
- [ ] **data | S | Coverage report:** compute expected vs found per pack, log top 10 gaps, store report artifact.
- [ ] **infra | S | Dataset flag:** add `DATASET=MSASL|ASLLVD`, ensure Planner/Prefetch toggles behave.
- [ ] **qa | M | Checklist:** framing, playback, countdown flow, attribution, logs export; add to docs.
- [ ] **docs | S | Playbook update:** ingest steps, storage guidance, flag usage, troubleshooting.

### Optional Backlog

- [ ] **ml | L | Skeleton/pose stream:** evaluate ASLLVD-Skeleton parity, map `token_id`, prep for tiny sequence classifier training.

---

## Shared Integration & Goose Alignment

- [ ] **infra | M | SSE bridge hardening:** ensure Goose proxy + optional `/agent/accept` coordinator log countdown/accept flow events.
- [ ] **metrics | S | Central dashboard:** extend logger viewer/Subagents panel to chart fps, latency, dropped frames.
- [ ] **ops | S | Release checklist:** combine Gesture Runtime + ASLLVD acceptance criteria, tie into `docs/demo-readiness.md`.
