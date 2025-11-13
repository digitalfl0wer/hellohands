import { useEffect, useRef, useState } from 'react';
import { post } from '../gestures/gestureBus';
import { isCorrectGesture, type ExpectedGesture } from '../gestures/gestureEvaluator';
import { logger } from '../utils/logger';
import { useLessonStore } from '../state/useLessonStore';
import {
  GestureWorkerClient,
  createGestureWorkerClient,
} from '../workers/gestureWorkerClient';
import {
  DEFAULT_GESTURE_WORKER_CONFIG,
  type GestureWorkerEvent,
  type RecognizedGesture,
} from '../workers/gestureWorker.types';

type CameraFeedProps = {
  enabled?: boolean;
  expectedGesture?: ExpectedGesture | null;
  onMatch?: (payload: { gesture: ExpectedGesture; score: number }) => void;
  onCandidate?: (payload: { gesture: RecognizedGesture; score: number }) => void;
  kidMode?: boolean;
  highGain?: boolean;
  onCameraError?: (message: string) => void;
  onNoHandTimeout?: () => void;
};

const GESTURE_TASK_URL = (import.meta as any)?.env?.VITE_GESTURE_TASK_URL;
const TASKS_FPS_TARGET =
  Number((import.meta as any)?.env?.VITE_GESTURE_FPS_TARGET) ||
  DEFAULT_GESTURE_WORKER_CONFIG.fpsTarget;

export function CameraFeed({
  enabled = true,
  expectedGesture = null,
  onMatch,
  onCandidate,
  kidMode = false,
  highGain = false,
  onCameraError,
  onNoHandTimeout,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hud, setHud] = useState<string | null>(null);
  const lastTypeRef = useRef<string | null>(null);
  const lastStableStartMsRef = useRef<number | null>(null);
  const lastPostMsRef = useRef<number>(0);
  const workerClientRef = useRef<GestureWorkerClient | null>(null);
  const workerLastFrameSentRef = useRef<number>(0);
  const baseHoldMs = Math.max(
    300,
    Number((import.meta as any)?.env?.VITE_GESTURE_HOLD_MS ?? 1200),
  );
  const holdMs = kidMode ? Math.max(2000, baseHoldMs) : baseHoldMs;
  const baseFpsTarget =
    Number((import.meta as any)?.env?.VITE_GESTURE_FPS_TARGET) ||
    DEFAULT_GESTURE_WORKER_CONFIG.fpsTarget;
  const fpsTarget = kidMode ? Math.min(12, Math.max(8, baseFpsTarget)) : baseFpsTarget;
  const runtimeMode = useLessonStore((state) => state.runtimeMode);
  const workerOn = useLessonStore((state) => state.workerOn);
  const useTasksRuntime = runtimeMode === 'tasks' && workerOn;
  const lastHandSeenAtRef = useRef<number | null>(null);
  const noHandNotifiedRef = useRef(false);

  const matchCallbackRef = useRef<
    ((payload: { gesture: ExpectedGesture; score: number }) => void) | null
  >(onMatch ?? null);
  const expectedGestureRef = useRef<ExpectedGesture | null>(expectedGesture);

  useEffect(() => {
    matchCallbackRef.current = onMatch ?? null;
  }, [onMatch]);

  const candidateCallbackRef = useRef<
    ((payload: { gesture: RecognizedGesture; score: number }) => void) | null
  >(onCandidate ?? null);

  useEffect(() => {
    candidateCallbackRef.current = onCandidate ?? null;
  }, [onCandidate]);

  useEffect(() => {
    expectedGestureRef.current = expectedGesture ?? null;
  }, [expectedGesture]);

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
      return;
    }

    let animationId: number | null = null;
    let stream: MediaStream | null = null;
    let detector: any = null;
    let active = true;

    const cleanup = () => {
      active = false;
      if (animationId) {
        window.cancelAnimationFrame(animationId);
        animationId = null;
      }
      stream?.getTracks().forEach((track) => track.stop());
      detector?.close?.();
      workerClientRef.current?.terminate();
      workerClientRef.current = null;
    };

    const setupCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          const message = 'Camera API unavailable.';
          setError(message);
          onCameraError?.(message);
          return false;
        }
        const videoConstraints: MediaTrackConstraints = highGain
          ? {
              facingMode: 'user',
              advanced: [{ exposureMode: 'continuous' } as any],
            }
          : { facingMode: 'user' };
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
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? `${err.name ?? 'Error'}: ${err.message}`
            : 'Unable to access camera';
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

    const handleWorkerEvent = (event: GestureWorkerEvent) => {
      switch (event.type) {
        case 'status':
          setHud(`worker: ${event.status}`);
          break;
        case 'log':
          logger.info('gesture_worker', event.message);
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
          break;
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
      const pumpWorker = async () => {
        if (!active || !videoRef.current) {
          return;
        }
        const now = performance.now();
        if (now - workerLastFrameSentRef.current < frameIntervalMs) {
          animationId = window.requestAnimationFrame(() => {
            void pumpWorker();
          });
          return;
        }
        workerLastFrameSentRef.current = now;
        try {
          const bitmap = await createImageBitmap(videoRef.current);
          client.sendFrame({ frame: bitmap, sentAt: now });
        } catch (err) {
          logger.warn('gesture', 'frame_capture_failed', { err });
        }

        animationId = window.requestAnimationFrame(() => {
          void pumpWorker();
        });
      };

      animationId = window.requestAnimationFrame(() => {
        void pumpWorker();
      });
    };

    const startLegacyRuntime = async () => {
      try {
        const handsBaseUsed = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/';
        const loadHands = async () =>
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector(
              'script[data-hh-hands="1"]',
            ) as HTMLScriptElement | null;
            if (existing) return resolve();
            const script = document.createElement('script');
            script.src = `${handsBaseUsed}hands.js`;
            script.async = true;
            script.defer = true;
            (script as any).dataset.hhHands = '1';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load hands.js'));
            document.head.appendChild(script);
          });

        await loadHands();
        const HandsCtor = (window as any).Hands as
          | (new (...args: any[]) => any)
          | undefined;
        if (!HandsCtor) throw new Error('Hands constructor not found on window');

        detector = new HandsCtor({
          locateFile: (file: string) => `${handsBaseUsed}${file}`,
        });
        detector.setOptions({
          selfieMode: true,
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.6,
        });
        // Try to load drawing utils (non-fatal)
        try {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector(
              'script[data-hh-draw="1"]',
            ) as HTMLScriptElement | null;
            if (existing) return resolve();
            const script = document.createElement('script');
            script.src =
              'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.4/drawing_utils.js';
            script.async = true;
            script.defer = true;
            (script as any).dataset.hhDraw = '1';
            script.onload = () => resolve();
            script.onerror = () => {
              // fallback to unpkg
              const fallback = document.createElement('script');
              fallback.src =
                'https://unpkg.com/@mediapipe/drawing_utils@0.4/drawing_utils.js';
              fallback.async = true;
              fallback.defer = true;
              (fallback as any).dataset.hhDraw = '1';
              fallback.onload = () => resolve();
              fallback.onerror = () => resolve(); // proceed without overlay
              document.head.appendChild(fallback);
            };
            document.head.appendChild(script);
          });
        } catch {}
      } catch (err) {
        const message =
          err instanceof Error
            ? `Detector init failed: ${err.message}`
            : 'Unable to initialise hand tracker.';
        setError(message);
        return;
      }

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

      (detector as any).onResults((results: any) => {
        try {
          const lm = results?.multiHandLandmarks ?? [];
          const hasHands = lm.length > 0;
          setHud(hasHands ? `hands: ${lm.length}` : null);
          if (hasHands) {
            lastHandSeenAtRef.current = performance.now();
            noHandNotifiedRef.current = false;
          }

          const canvas = overlayRef.current;
          const video = videoRef.current;
          const ctx = canvas?.getContext('2d');
          if (canvas && video && ctx) {
            const container = overlayRef.current?.parentElement as HTMLElement | null;
            const cssW =
              (container?.clientWidth ?? video.clientWidth) || video.videoWidth;
            const cssH =
              (container?.clientHeight ?? video.clientHeight) || video.videoHeight;
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
            const drawConnectors = (window as any).drawConnectors;
            const drawLandmarks = (window as any).drawLandmarks;
            const HAND_CONNECTIONS = (window as any).HAND_CONNECTIONS;
            if (
              typeof drawConnectors === 'function' &&
              typeof drawLandmarks === 'function'
            ) {
              for (const pts of lm) {
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
            } else {
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

              for (const pts of lm) drawHand(pts);
            }
          }

          const classification = classifyLandmarks(lm);
          if (classification) {
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
            }

            const remainingMs =
              holdMs -
              (lastStableStartMsRef.current ? now - lastStableStartMsRef.current : 0);
            const holdSeconds = Math.ceil(Math.max(0, remainingMs) / 1000);
            const goalSuffix =
              expected && expected !== classification.type
                ? ` · goal: ${expected.replace('_', ' ')}`
                : '';
            setHud(
              `${classification.type} (${Math.round(
                (classification.score || 0) * 100,
              )}%) · hold ${holdSeconds}s${goalSuffix}`,
            );
          } else {
            lastTypeRef.current = null;
            lastStableStartMsRef.current = null;
          }
        } catch {}
      });

      const pump = async () => {
        if (!active || !videoRef.current || !detector) {
          return;
        }

        const video = videoRef.current;
        if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
          await (detector as any).send({ image: video });
        }

        animationId = window.requestAnimationFrame(() => {
          void pump();
        });
      };

      animationId = window.requestAnimationFrame(() => {
        void pump();
      });
    };

    const boot = async () => {
      const cameraReady = await setupCamera();
      if (!cameraReady) return;
      if (useTasksRuntime) {
        await startWorkerRuntime();
      } else {
        await startLegacyRuntime();
      }
    };

    void boot();

    return cleanup;
  }, [enabled, holdMs, fpsTarget, kidMode, useTasksRuntime, highGain, onCameraError]);

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
    <div className="relative">
      <div className="relative inline-block w-full max-w-md transform -scale-x-100">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full rounded-xl shadow-lg"
        />
        <canvas
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full rounded-xl"
        />
      </div>
      <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white">
        <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
        <span>{enabled ? 'Camera Active' : 'Gestures Off'}</span>
      </div>
      {hud ? (
        <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white">
          {hud}
        </div>
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
