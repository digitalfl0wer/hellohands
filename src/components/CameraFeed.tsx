import { useCallback, useEffect, useRef, useState } from 'react';
import { post } from '../gestures/gestureBus';
import { isCorrectGesture, type ExpectedGesture } from '../gestures/gestureEvaluator';
import { logger } from '../utils/logger';
import type { MpStatus } from '../types/mp';
import { createHandLandmarker } from '../lib/handLandmarker';
import { mapResultToHands } from '../lib/handMapping';
import { type HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { getMediaPipeCaps } from '../lib/mpCaps';
import {
  DEFAULT_GESTURE_WORKER_CONFIG,
  type GestureWorkerEvent,
  type RecognizedGesture,
} from '../workers/gestureWorker.types';
import {
  createGestureWorkerClient,
  type GestureWorkerClient,
} from '../workers/gestureWorkerClient';

type CameraFeedProps = {
  enabled?: boolean;
  expectedGesture?: ExpectedGesture | null;
  onMatch?: (payload: { gesture: ExpectedGesture; score: number }) => void;
  onCandidate?: (payload: { gesture: RecognizedGesture; score: number }) => void;
  kidMode?: boolean;
  highGain?: boolean;
  onCameraError?: (message: string) => void;
  onNoHandTimeout?: () => void;
  suppressHud?: boolean;
};

const GESTURE_TASK_URL = (import.meta as any)?.env?.VITE_GESTURE_TASK_URL;

let lastClampedTimestampMs = 0;
let tsClampCount = 0;
const resetTimestampClamping = () => {
  lastClampedTimestampMs = 0;
  tsClampCount = 0;
};
const nextTimestampMsFromMediaTime = (mediaTimeSec?: number): number => {
  const source =
    typeof mediaTimeSec === 'number' && Number.isFinite(mediaTimeSec)
      ? mediaTimeSec
      : performance.now() / 1000;
  const candidate = Math.floor(source * 1000);
  if (!Number.isFinite(candidate)) {
    lastClampedTimestampMs += 1;
    tsClampCount += 1;
  } else if (candidate <= lastClampedTimestampMs) {
    lastClampedTimestampMs += 1;
    tsClampCount += 1;
  } else {
    lastClampedTimestampMs = candidate;
  }
  return lastClampedTimestampMs;
};

export function CameraFeed({
  enabled = true,
  expectedGesture = null,
  onMatch,
  onCandidate,
  kidMode = false,
  highGain = false,
  onCameraError,
  onNoHandTimeout,
  suppressHud = false,
}: CameraFeedProps) {
  const caps = getMediaPipeCaps();
  const rawMainthread = (import.meta as any)?.env?.VITE_MP_MAINTHREAD;
  const rawDisable = (import.meta as any)?.env?.VITE_MP_DISABLE;
  const MP_MAINTHREAD = rawMainthread === '1' || rawMainthread === 1;
  const MP_DISABLE = rawDisable === '1' || rawDisable === 1;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hud, setHud] = useState<string | null>(null);
  const [mpErrorCode, setMpErrorCode] = useState<string | null>(null);
  const lastTypeRef = useRef<string | null>(null);
  const lastStableStartMsRef = useRef<number | null>(null);
  const lastPostMsRef = useRef<number>(0);
  const handLandmarkerRef = useRef<Awaited<
    ReturnType<typeof createHandLandmarker>
  > | null>(null);
  const workerClientRef = useRef<GestureWorkerClient | null>(null);
  const workerLastFrameSentRef = useRef<number>(0);
  const lastVideoTimeRef = useRef(-1);
  const baseHoldMs = Math.max(
    300,
    Number((import.meta as any)?.env?.VITE_GESTURE_HOLD_MS ?? 1200),
  );
  const holdMs = kidMode ? Math.max(2000, baseHoldMs) : baseHoldMs;
  const envFps =
    Number((import.meta as any)?.env?.VITE_MP_FPS) ||
    Number((import.meta as any)?.env?.VITE_GESTURE_FPS_TARGET);
  const safariOrIos = caps.isSafariIos;
  let baseFpsTarget = envFps || DEFAULT_GESTURE_WORKER_CONFIG.fpsTarget;
  if (safariOrIos && baseFpsTarget > 10) {
    logger.mp.info('fps_cap', {
      reason: 'safari_or_ios',
      from: baseFpsTarget,
      to: 10,
    });
    baseFpsTarget = 10;
  }
  const fpsTarget = kidMode ? Math.min(12, Math.max(8, baseFpsTarget)) : baseFpsTarget;
  const lastHandSeenAtRef = useRef<number | null>(null);
  const noHandNotifiedRef = useRef(false);
  const isTabHiddenRef = useRef(false);
  const warmupFramesRef = useRef(0);
  const devMeterEnabled = (import.meta as any)?.env?.VITE_MP_DEV_METER === '1';
  const devMeterWindowMs = 5000;
  const devMeterFrameTimesRef = useRef<number[]>([]);
  const devMeterDtSumRef = useRef(0);
  const devMeterDtCountRef = useRef(0);
  const lastDevMeterTsRef = useRef<number | null>(null);
  const [devMeterState, setDevMeterState] = useState({
    fps: 0,
    avgDt: 0,
    tsClamp: tsClampCount,
  });
  // For now, always run detection on the main thread.
  const runtimePath: 'disabled' | 'main_thread_flag' | 'main_thread_ios' | 'worker' =
    MP_DISABLE ? 'disabled' : 'main_thread_flag';

  const matchCallbackRef = useRef<
    ((payload: { gesture: ExpectedGesture; score: number }) => void) | null
  >(onMatch ?? null);
  const candidateCallbackRef = useRef<
    ((payload: { gesture: RecognizedGesture; score: number }) => void) | null
  >(onCandidate ?? null);
  const expectedGestureRef = useRef<ExpectedGesture | null>(expectedGesture);

  const resetDevMeterTracking = useCallback(() => {
    devMeterFrameTimesRef.current = [];
    devMeterDtSumRef.current = 0;
    devMeterDtCountRef.current = 0;
    lastDevMeterTsRef.current = null;
    if (devMeterEnabled) {
      setDevMeterState({
        fps: 0,
        avgDt: 0,
        tsClamp: tsClampCount,
      });
    }
  }, [devMeterEnabled]);

  const resetTimingState = useCallback(() => {
    lastVideoTimeRef.current = -1;
    resetTimestampClamping();
    resetDevMeterTracking();
  }, [resetDevMeterTracking]);

  useEffect(() => {
    if (!enabled) {
      setHud(null);
      setError(null);
      lastTypeRef.current = null;
      lastStableStartMsRef.current = null;
      lastHandSeenAtRef.current = null;
      noHandNotifiedRef.current = false;
      workerClientRef.current?.terminate();
      workerClientRef.current = null;
      try {
        handLandmarkerRef.current?.close?.();
      } catch {
        // ignore
      }
      handLandmarkerRef.current = null;
      return;
    }

    let animationId: number | null = null;
    let stream: MediaStream | null = null;
    let active = true;

    const cleanup = () => {
      active = false;
      if (animationId) {
        window.cancelAnimationFrame(animationId);
        animationId = null;
      }
      stream?.getTracks().forEach((track) => track.stop());
      workerClientRef.current?.terminate();
      workerClientRef.current = null;
      try {
        handLandmarkerRef.current?.close?.();
      } catch {
        // ignore
      }
      handLandmarkerRef.current = null;
    };

    const setupCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          const message = 'Camera API unavailable.';
          setError(message);
          onCameraError?.(message);
          return false;
        }
        const baseVideoConstraints: MediaTrackConstraints = {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          aspectRatio: 640 / 480,
        };
        const videoConstraints: MediaTrackConstraints = highGain
          ? {
              ...baseVideoConstraints,
              advanced: [{ exposureMode: 'continuous' } as any],
            }
          : baseVideoConstraints;
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch((err) => {
            if (err?.name !== 'AbortError') {
              throw err;
            }
          });
        }
        resetTimingState();
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? `${err.name ?? 'Error'}: ${err.message}`
            : 'Unable to access camera';
        if (err instanceof Error && err.name === 'NotAllowedError') {
          logger.mp.error('permission_denied', {
            name: err.name,
            message: err.message,
          });
        }
        setError(errorMessage);
        onCameraError?.(errorMessage);
        return false;
      }
    };

    const emitAcceptedGesture = (gesture: RecognizedGesture, score: number) => {
      const now = performance.now();
      lastPostMsRef.current = now;
      post({
        intent: 'gesture',
        type: gesture,
        score,
      });
      const expected = expectedGestureRef.current;
      const matchHandler = matchCallbackRef.current;
      if (
        matchHandler &&
        expected &&
        isCorrectGesture(expected, gesture, score, kidMode)
      ) {
        matchHandler({ gesture, score });
      }
    };

    const classifyLandmarks = (
      landmarks: any[],
    ): {
      type: 'thumbs_up' | 'open_palm' | 'point' | 'pinch';
      score: number;
    } | null => {
      const dist = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y);
      let best: {
        type: 'thumbs_up' | 'open_palm' | 'point' | 'pinch';
        score: number;
      } | null = null;
      for (const pts of landmarks) {
        if (!pts) continue;
        if (dist(pts[4], pts[8]) < 0.08) {
          const cand = { type: 'pinch' as const, score: 0.9 };
          best = !best || cand.score > best.score ? cand : best;
        }
        if (dist(pts[4], pts[12]) < 0.09) {
          const cand = { type: 'pinch' as const, score: 0.88 };
          best = !best || cand.score > best.score ? cand : best;
        }
        if (dist(pts[5], pts[17]) > 0.17) {
          const cand = { type: 'open_palm' as const, score: 0.85 };
          best = !best || cand.score > best.score ? cand : best;
        }
        const indexLong = dist(pts[8], pts[5]) > 0.16;
        const middleShort = dist(pts[12], pts[9]) < 0.17;
        if (indexLong && middleShort) {
          const cand = { type: 'point' as const, score: 0.78 };
          best = !best || cand.score > best.score ? cand : best;
        }
        if (pts[4].y < pts[5].y && middleShort) {
          const cand = { type: 'thumbs_up' as const, score: 0.72 };
          best = !best || cand.score > best.score ? cand : best;
        }
      }
      return best;
    };

    const emitStatus = (
      status: MpStatus,
      payload?: { confidence?: number; holdProgress?: number },
    ) => {
      const devMeterOn = (import.meta as any)?.env?.VITE_MP_DEV_METER === '1';
      if (devMeterOn) {
        logger.mp.info('status', {
          status,
          confidence: payload?.confidence,
          holdProgress: payload?.holdProgress,
        });
      }
    };
    const resolveHandLabel = (entry: any, index: number): 'Left' | 'Right' | null => {
      if (entry) {
        const candidate = Array.isArray(entry) ? entry[0] : entry;
        const name = candidate?.categoryName ?? candidate?.label;
        if (typeof name === 'string') {
          const normalized = name.trim().toLowerCase();
          if (normalized === 'left') return 'Left';
          if (normalized === 'right') return 'Right';
        }
      }
      if (index === 0) return 'Left';
      if (index === 1) return 'Right';
      return null;
    };

    const mapHandsByLabel = (
      landmarks: any[],
      handednessList: any[],
    ): {
      leftHand: any | null;
      rightHand: any | null;
    } => {
      let leftHand: any | null = null;
      let rightHand: any | null = null;
      for (let i = 0; i < landmarks.length; i += 1) {
        const pts = landmarks[i];
        if (!pts) continue;
        const label = resolveHandLabel(handednessList?.[i], i);
        if (label === 'Left') {
          leftHand = pts;
        } else if (label === 'Right') {
          rightHand = pts;
        }
      }
      return { leftHand, rightHand };
    };

    const drawHands = (handsToDraw: any[]) => {
      const canvas = overlayRef.current;
      const video = videoRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !video || !ctx) {
        return;
      }
      const container = overlayRef.current?.parentElement as HTMLElement | null;
      const cssW = (container?.clientWidth ?? video.clientWidth) || video.videoWidth;
      const cssH = (container?.clientHeight ?? video.clientHeight) || video.videoHeight;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const targetW = Math.floor(cssW * dpr);
      const targetH = Math.floor(cssH * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (handsToDraw.length === 0) {
        return;
      }
      const drawConnectors = (window as any).drawConnectors;
      const drawLandmarks = (window as any).drawLandmarks;
      const HAND_CONNECTIONS = (window as any).HAND_CONNECTIONS;
      if (typeof drawConnectors === 'function' && typeof drawLandmarks === 'function') {
        for (const pts of handsToDraw) {
          try {
            drawConnectors(ctx, pts, HAND_CONNECTIONS, {
              color: '#00FF66',
              lineWidth: 5,
            });
            drawLandmarks(ctx, pts, {
              color: '#FF3B3B',
              lineWidth: 2,
              radius: 3,
            });
            ctx.fillStyle = '#FFD166';
            for (const idx of [5, 6, 7, 8]) {
              const p = pts[idx];
              if (!p) continue;
              ctx.beginPath();
              ctx.arc(
                p.x * canvas.width,
                p.y * canvas.height,
                idx === 8 ? 6 : 4,
                0,
                Math.PI * 2,
              );
              ctx.fill();
            }
          } catch {}
        }
        return;
      }
      const line = (a: any, b: any) => {
        ctx.beginPath();
        ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
        ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
        ctx.stroke();
      };
      const drawHand = (pts: any[]) => {
        if (!pts || pts.length < 21) return;
        ctx.strokeStyle = '#00FF66';
        ctx.lineWidth = 5;
        const chains = [
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
          [13, 14, 15, 16],
          [17, 18, 19, 20],
        ];
        for (const chain of chains) {
          for (let i = 0; i < chain.length - 1; i++) {
            line(pts[chain[i]], pts[chain[i + 1]]);
          }
        }
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          ctx.beginPath();
          const r = i >= 5 && i <= 8 ? (i === 8 ? 6 : 4) : 3;
          ctx.fillStyle = i >= 5 && i <= 8 ? '#FFD166' : '#FF3B3B';
          ctx.arc(p.x * canvas.width, p.y * canvas.height, r, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      for (const pts of handsToDraw) drawHand(pts);
    };

    const handleHandResults = (landmarks: any[], handedness: any[]) => {
      // Dev-only: surface whether MediaPipe is returning any hands.
      // eslint-disable-next-line no-console
      console.info('[hands_frame]', {
        landmarksCount: landmarks?.length ?? 0,
        handednessCount: handedness?.length ?? 0,
      });
      const { leftHand, rightHand } = mapHandsByLabel(landmarks, handedness);
      const handsToDraw: any[] = [];
      if (leftHand && rightHand) {
        handsToDraw.push(leftHand, rightHand);
      } else if (leftHand) {
        handsToDraw.push(leftHand);
      } else if (rightHand) {
        handsToDraw.push(rightHand);
      }
      const handCount = handsToDraw.length;
      const hasHands = handCount > 0;
      setHud(hasHands ? `hands: ${handCount}` : null);
      if (!hasHands) {
        drawHands([]);
        lastTypeRef.current = null;
        lastStableStartMsRef.current = null;
        emitStatus('no_hand');
        return;
      }
      warmupFramesRef.current += 1;
      lastHandSeenAtRef.current = performance.now();
      noHandNotifiedRef.current = false;
      drawHands(handsToDraw);
      if (warmupFramesRef.current <= 3) {
        emitStatus('hand_found');
        return;
      }
      const classification = classifyLandmarks(handsToDraw);
      if (!classification) {
        lastTypeRef.current = null;
        lastStableStartMsRef.current = null;
        emitStatus('hand_found');
        return;
      }
      const now = performance.now();
      if (lastTypeRef.current !== classification.type) {
        lastTypeRef.current = classification.type;
        lastStableStartMsRef.current = now;
      }
      const started = lastStableStartMsRef.current ?? now;
      const stableFor = Math.max(0, now - started);
      if (stableFor >= holdMs && now - lastPostMsRef.current >= holdMs) {
        emitAcceptedGesture(classification.type, classification.score);
        lastStableStartMsRef.current = now;
        emitStatus('success', {
          confidence: classification.score,
          holdProgress: 1,
        });
      } else {
        const remainingMs =
          holdMs -
          (lastStableStartMsRef.current ? now - lastStableStartMsRef.current : 0);
        const holdSeconds = Math.ceil(Math.max(0, remainingMs) / 1000);
        const goalSuffix =
          expectedGesture && expectedGesture !== classification.type
            ? ` · goal: ${expectedGesture.replace('_', ' ')}`
            : '';
        setHud(
          `${classification.type} (${Math.round(
            (classification.score || 0) * 100,
          )}%) · hold ${holdSeconds}s${goalSuffix}`,
        );
        const holdProgress =
          holdMs > 0 ? Math.max(0, Math.min(1, (holdMs - remainingMs) / holdMs)) : 0;
        emitStatus('holding', {
          confidence: classification.score,
          holdProgress,
        });
      }
    };

    const handleWorkerEvent = (event: GestureWorkerEvent) => {
      switch (event.type) {
        case 'status':
          setHud(`worker: ${event.status}`);
          break;
        case 'log':
          logger.info('gesture_worker', event.message);
          break;
        case 'hands':
          handleHandResults(event.multiHandLandmarks ?? [], event.multiHandedness ?? []);
          break;
        case 'candidate': {
          const pct = Math.round((event.score || 0) * 100);
          setHud(`candidate: ${event.gesture} (${pct}%)`);
          lastHandSeenAtRef.current = performance.now();
          noHandNotifiedRef.current = false;
          const candidateHandler = candidateCallbackRef.current;
          if (candidateHandler) {
            candidateHandler({
              gesture: event.gesture,
              score: event.score ?? 0,
            });
          }
          break;
        }
        case 'accepted':
          setHud(`accepted: ${event.gesture}`);
          lastHandSeenAtRef.current = performance.now();
          noHandNotifiedRef.current = false;
          emitAcceptedGesture(event.gesture, event.score);
          break;
        case 'lost':
          setHud(null);
          break;
        case 'countdown_done':
          logger.info('gesture_worker', 'countdown_done');
          post({ intent: 'gesture', type: 'countdown_done' });
          break;
        case 'metrics':
          logger.info('gesture_worker_metrics', 'metrics', {
            fps: Math.round(event.fps),
            latencyMs: Math.round(event.latencyMs),
            droppedFrames: event.droppedFrames,
          });
          break;
        case 'mp:error': {
          const code = event.code;
          setMpErrorCode(code);
          if (code === 'model_load_fail') {
            logger.mp.error('model_load_fail', { details: event.details });
            setHud('Hand model failed to load.');
          } else if (code === 'gpu_unavailable') {
            logger.mp.warn('gpu_unavailable', { details: event.details });
            setHud('GPU unavailable; gestures may be limited.');
          } else if (code === 'no_frames') {
            logger.mp.warn('no_frames', { details: event.details });
            setHud('No frames received from camera.');
          }
          break;
        }
        default:
          break;
      }
    };

    const startWorkerRuntime = async () => {
      const client = createGestureWorkerClient({
        onEvent: handleWorkerEvent,
      });
      workerClientRef.current = client;
      workerLastFrameSentRef.current = 0;
      client.init({
        modelAssetUrl: GESTURE_TASK_URL,
      });
      client.configure({
        fpsTarget,
        holdMs,
      });

      const frameIntervalMs = 1000 / fpsTarget;
      const video = videoRef.current;
      const useVideoFrameCallback =
        !!video && 'requestVideoFrameCallback' in (video as any);

      const shouldSendFrame = (now: number) => {
        const minInterval = isTabHiddenRef.current ? 1000 : frameIntervalMs;
        if (now - workerLastFrameSentRef.current < minInterval) {
          return false;
        }
        workerLastFrameSentRef.current = now;
        return true;
      };

      const sendCurrentFrame = async (now: number) => {
        if (!active || !videoRef.current) return;
        if (!shouldSendFrame(now)) return;
        try {
          const bitmap = await createImageBitmap(videoRef.current);
          client.sendFrame({ frame: bitmap, sentAt: now });
        } catch (err) {
          logger.warn('gesture', 'frame_capture_failed', { err });
        }
      };

      const pumpWorkerRaf = async () => {
        const now = performance.now();
        await sendCurrentFrame(now);
        if (!active) return;
        animationId = window.requestAnimationFrame(() => {
          void pumpWorkerRaf();
        });
      };

      const pumpWorkerVideoFrame = async (
        _now: number,
        metadata: VideoFrameCallbackMetadata,
      ) => {
        const now = performance.now();
        const ts = metadata?.mediaTime ? metadata.mediaTime * 1000 : now;
        await sendCurrentFrame(ts);
        if (!active || !videoRef.current) return;
        (videoRef.current as any).requestVideoFrameCallback(pumpWorkerVideoFrame);
      };

      if (useVideoFrameCallback && video) {
        (video as any).requestVideoFrameCallback(pumpWorkerVideoFrame);
      } else {
        animationId = window.requestAnimationFrame(() => {
          void pumpWorkerRaf();
        });
      }
    };

    const startMainThreadRuntime = async () => {
      if (!videoRef.current) return;
      try {
        const detector = await createHandLandmarker();
        handLandmarkerRef.current = detector;
      } catch (err) {
        logger.mp.error('model_load_fail', {
          message: err instanceof Error ? err.message : String(err),
        });
        setMpErrorCode('model_load_fail');
        return;
      }
      const frameIntervalMs = 1000 / fpsTarget;
      let lastDetectAt = 0;
      let videoStateLogged = false;
      const safariThrottleMs = safariOrIos ? 1000 / 11 : 0;
      let fastResetInFlight = false;

      const resetDetectionTiming = () => {
        lastDetectAt = 0;
        resetTimingState();
      };

      resetDetectionTiming();

      const updateDevMeter = (tsMs: number) => {
        if (!devMeterEnabled) return;
        const history = devMeterFrameTimesRef.current;
        history.push(tsMs);
        const cutoff = tsMs - devMeterWindowMs;
        while (history.length > 0 && history[0] < cutoff) {
          history.shift();
        }
        const earliest = history[0] ?? tsMs;
        const spanMs = tsMs - earliest;
        const fps =
          history.length > 1
            ? history.length / Math.max(spanMs / 1000, 0.001)
            : history.length;
        const lastTs = lastDevMeterTsRef.current;
        if (lastTs !== null) {
          devMeterDtSumRef.current += tsMs - lastTs;
          devMeterDtCountRef.current += 1;
        }
        lastDevMeterTsRef.current = tsMs;
        const avgDt =
          devMeterDtCountRef.current > 0
            ? devMeterDtSumRef.current / devMeterDtCountRef.current
            : 0;
        setDevMeterState({
          fps,
          avgDt,
          tsClamp: tsClampCount,
        });
      };

      const fastResetDetector = async (message: string) => {
        if (fastResetInFlight) {
          return;
        }
        fastResetInFlight = true;
        try {
          handLandmarkerRef.current?.close?.();
        } catch {}
        handLandmarkerRef.current = null;
        resetTimingState();
        try {
          const fresh = await createHandLandmarker();
          handLandmarkerRef.current = fresh;
          resetDetectionTiming();
        } catch (resetErr) {
          logger.mp.error('fast_reset_failed', {
            message: resetErr instanceof Error ? resetErr.message : String(resetErr),
            context: message,
          });
        } finally {
          fastResetInFlight = false;
        }
      };

      const processFrame = (tsMs: number) => {
        const video = videoRef.current;
        const detector = handLandmarkerRef.current;
        if (!video || !detector) {
          return;
        }
        const minInterval = isTabHiddenRef.current ? 1000 : frameIntervalMs;
        const requiredInterval = Math.max(minInterval, safariThrottleMs);
        const w = video.videoWidth;
        const h = video.videoHeight;
        const ready = !video.paused && !video.ended;
        if (!videoStateLogged) {
          // eslint-disable-next-line no-console
          console.info('[video_state]', { w, h, ready });
          videoStateLogged = true;
        }
        if (!w || !h) {
          return;
        }
        if (tsMs - lastDetectAt < requiredInterval) {
          return;
        }
        lastDetectAt = tsMs;
        updateDevMeter(tsMs);
        try {
          const result: HandLandmarkerResult = detector.detectForVideo(video, tsMs);
          if ((import.meta as any)?.env?.DEV && !(processFrame as any)._keysLogged) {
            // eslint-disable-next-line no-console
            console.info('[result_keys]', Object.keys(result ?? {}));
            (processFrame as any)._keysLogged = true;
          }
          const landmarksAny: any =
            (result as any).landmarks ?? (result as any).multiHandLandmarks ?? [];
          const handednessAny: any =
            (result as any).handednesses ?? (result as any).multiHandedness ?? [];
          handleHandResults(landmarksAny, handednessAny);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logger.mp.error('detect_failed', {
            message,
          });
          if (
            typeof message === 'string' &&
            (message.includes('Packet timestamp mismatch') ||
              (message.includes('INVALID_ARGUMENT') && message.includes('norm_rect')))
          ) {
            void fastResetDetector(message);
          }
        }
      };

      const video = videoRef.current as HTMLVideoElement | null;
      if (!video || typeof (video as any).requestVideoFrameCallback !== 'function') {
        logger.mp.error('rVFC_unavailable', { reason: 'callback_unsupported' });
        return;
      }

      const frameCallback = (_: number, metadata: VideoFrameCallbackMetadata) => {
        const videoElement = videoRef.current;
        if (!active || !videoElement) {
          return;
        }
        const mediaTime =
          typeof metadata?.mediaTime === 'number' && Number.isFinite(metadata.mediaTime)
            ? metadata.mediaTime
            : (videoElement.currentTime ?? 0);
        if (mediaTime === lastVideoTimeRef.current) {
          (videoElement as any).requestVideoFrameCallback(frameCallback);
          return;
        }
        lastVideoTimeRef.current = mediaTime;
        const tsMs = nextTimestampMsFromMediaTime(mediaTime);
        processFrame(tsMs);
        (videoElement as any).requestVideoFrameCallback(frameCallback);
      };
      (video as any).requestVideoFrameCallback(frameCallback);
    };

    const boot = async () => {
      const cameraReady = await setupCamera();
      if (!cameraReady) return;
      if (runtimePath === 'disabled') {
        logger.mp.info('runtime_disabled', { reason: 'VITE_MP_DISABLE' });
        return;
      }
      logger.mp.info('runtime_mode', {
        mode: 'main_thread',
        reason: 'forced',
      });
      await startMainThreadRuntime();
    };

    void boot();

    return cleanup;
  }, [
    enabled,
    holdMs,
    fpsTarget,
    kidMode,
    highGain,
    onCameraError,
    resetTimingState,
    devMeterEnabled,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const wasHidden = isTabHiddenRef.current;
      const nowHidden = document.visibilityState !== 'visible';
      isTabHiddenRef.current = nowHidden;
      if (!nowHidden && wasHidden) {
        resetTimingState();
      }
    };
    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resetTimingState]);

  useEffect(() => {
    if (!enabled || !onNoHandTimeout) {
      return;
    }
    const interval = window.setInterval(() => {
      if (!enabled) return;
      const lastSeen = lastHandSeenAtRef.current;
      if (!lastSeen) return;
      const now = performance.now();
      if (!noHandNotifiedRef.current && now - lastSeen > 8000) {
        noHandNotifiedRef.current = true;
        onNoHandTimeout();
      }
    }, 2500);
    return () => window.clearInterval(interval);
  }, [enabled, onNoHandTimeout]);

  return (
    <div className="relative h-full w-full">
      <div className="relative h-full w-full overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full rounded-xl object-cover shadow-lg transform -scale-x-100"
        />
        <canvas
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full rounded-xl"
        />
      </div>
      {mpErrorCode && !suppressHud && (
        <div className="absolute top-2 left-2 max-w-xs rounded bg-black/75 px-3 py-2 text-xs text-white shadow-lg">
          <p className="font-semibold">
            {mpErrorCode === 'model_load_fail' && 'Hand model failed to load.'}
            {mpErrorCode === 'gpu_unavailable' &&
              'GPU unavailable. Gestures may be limited.'}
            {mpErrorCode === 'no_frames' && 'No frames received from camera.'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-white/10 px-2 py-1 font-semibold text-[10px]"
              onClick={() => {
                logger.mp.info('recovery_action', { action: 'retry', code: mpErrorCode });
                setMpErrorCode(null);
              }}
            >
              Retry
            </button>
            <button
              type="button"
              className="rounded bg-white/10 px-2 py-1 font-semibold text-[10px]"
              onClick={() => {
                logger.mp.info('recovery_action', { action: 'demo', code: mpErrorCode });
                setMpErrorCode(null);
              }}
            >
              Use demo
            </button>
            <button
              type="button"
              className="rounded bg-white/10 px-2 py-1 font-semibold text-[10px]"
              onClick={() => {
                logger.mp.info('recovery_action', {
                  action: 'lower_res',
                  code: mpErrorCode,
                });
                setMpErrorCode(null);
              }}
            >
              Lower resolution
            </button>
          </div>
        </div>
      )}
      {!suppressHud && (
        <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded px-2 py-1 text-xs font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.45)]">
          <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
          <span>{enabled ? 'Camera Active' : 'Gestures Off'}</span>
        </div>
      )}
      {!suppressHud && hud ? (
        <div className="absolute bottom-2 right-2 rounded px-2 py-1 text-xs font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.35)]">
          {hud}
        </div>
      ) : null}
      {devMeterEnabled && (
        <div className="pointer-events-none absolute top-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] font-mono text-white shadow-lg">
          <div className="leading-none">fps: {devMeterState.fps.toFixed(1)}</div>
          <div className="leading-none">avg dt: {devMeterState.avgDt.toFixed(1)}ms</div>
          <div className="leading-none">tsClamp: {devMeterState.tsClamp}</div>
        </div>
      )}
      {!suppressHud ? (
        <p className="sr-only" aria-live="polite">
          {hud ?? ''}
        </p>
      ) : null}
      {error ? (
        <div className="absolute bottom-2 left-2 rounded bg-red-600/80 px-2 py-1 text-xs font-semibold text-white">
          {error}
        </div>
      ) : null}
    </div>
  );
}

export default CameraFeed;
