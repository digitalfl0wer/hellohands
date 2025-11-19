/// <reference lib="webworker" />

import {
  DEFAULT_GESTURE_WORKER_CONFIG,
  type GestureWorkerCommand,
  type GestureWorkerConfig,
  type GestureWorkerEvent,
  type GestureWorkerHandsEvent,
  type GestureWorkerStatus,
} from './gestureWorker.types';
import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';

declare const self: DedicatedWorkerGlobalScope;

const ctx = self;
const VISION_WASM_ROOT = '/vendor/mediapipe/tasks-vision/wasm';
const HAND_LANDMARKER_TASK = '/models/hand_landmarker.task';

let status: GestureWorkerStatus = 'idle';
let config: GestureWorkerConfig = { ...DEFAULT_GESTURE_WORKER_CONFIG };
let lastFrameTimestamp = performance.now();
let droppedFrames = 0;
let handLandmarker: HandLandmarker | null = null;
let noFramesErrorEmitted = false;

const post = (event: GestureWorkerEvent) => {
  ctx.postMessage(event);
};

const setStatus = (next: GestureWorkerStatus, details?: string) => {
  status = next;
  post({ type: 'status', status: next, details, ts: performance.now() });
};

const postMetrics = (frameId: number, sentAt: number) => {
  const now = performance.now();
  const delta = Math.max(1, now - lastFrameTimestamp);
  const latency = Math.max(0, now - sentAt);
  lastFrameTimestamp = now;
  post({
    type: 'metrics',
    fps: 1000 / delta,
    latencyMs: latency,
    droppedFrames,
    ts: now,
  });
};

const initHandLandmarker = async () => {
  const visionResolver = await FilesetResolver.forVisionTasks(VISION_WASM_ROOT);
  handLandmarker = await HandLandmarker.createFromOptions(visionResolver, {
    baseOptions: {
      modelAssetPath: HAND_LANDMARKER_TASK,
    },
    runningMode: 'VIDEO',
    numHands: 2,
  });
};

const logModelSizeDev = async () => {
  const isDev = (import.meta as any)?.env?.DEV;
  if (!isDev) return;
  try {
    const response = await fetch(HAND_LANDMARKER_TASK, { method: 'GET' });
    if (!response.ok) {
      post({
        type: 'log',
        level: 'warn',
        tag: 'gesture_worker',
        message: `model_size_fetch_failed:${response.status}`,
        ts: performance.now(),
      });
      return;
    }
    let size = 0;
    const length = response.headers.get('content-length');
    if (length) {
      size = Number.parseInt(length, 10) || 0;
    } else {
      const blob = await response.blob();
      size = blob.size;
    }
    post({
      type: 'log',
      level: 'info',
      tag: 'gesture_worker',
      message: `model_size_bytes:${size}`,
      ts: performance.now(),
    });
    // Very lightweight integrity hint: warn if model is unexpectedly small.
    if (size > 0 && size < 100_000) {
      post({
        type: 'log',
        level: 'warn',
        tag: 'gesture_worker',
        message: `model_size_suspicious:${size}`,
        ts: performance.now(),
      });
    }
  } catch (error) {
    post({
      type: 'log',
      level: 'warn',
      tag: 'gesture_worker',
      message: `model_size_error:${String(error)}`,
      ts: performance.now(),
    });
  }
};

const handleInit = async () => {
  setStatus('starting');
  try {
    await initHandLandmarker();
    void logModelSizeDev();
    post({
      type: 'log',
      level: 'info',
      tag: 'gesture_worker',
      message: 'hand_landmarker_init:ready',
      ts: performance.now(),
    });
    setStatus('ready', 'hand_landmarker_init:ready');
  } catch (error) {
    const message = String(error ?? '');
    const lower = message.toLowerCase();
    const code =
      lower.includes('gpu') || lower.includes('gl') || lower.includes('webgl')
        ? 'gpu_unavailable'
        : 'model_load_fail';
    post({
      type: 'mp:error',
      code,
      ts: performance.now(),
      details: message,
    });
    post({
      type: 'log',
      level: 'error',
      tag: 'gesture_worker',
      message: `hand_landmarker_init:error:${String(error)}`,
      ts: performance.now(),
    });
    setStatus('error', `hand_landmarker_init:${String(error)}`);
  }
};

const handleConfig = (partial: Partial<GestureWorkerConfig>) => {
  config = { ...config, ...partial };
  post({
    type: 'log',
    level: 'info',
    tag: 'gesture_worker',
    message: `config_applied:fps=${config.fpsTarget}`,
    ts: performance.now(),
  });
};

const handleFrame = (frame: ImageBitmap, frameId: number, sentAt: number) => {
  if (status !== 'ready' || !handLandmarker) {
    try {
      frame?.close();
    } catch {}
    droppedFrames += 1;
    if (!noFramesErrorEmitted && droppedFrames >= 60) {
      noFramesErrorEmitted = true;
      post({
        type: 'mp:error',
        code: 'no_frames',
        ts: performance.now(),
        details: 'no_frames_detected_after_60_drops',
      });
    }
    post({ type: 'lost', frameId, ts: performance.now(), reason: 'dropped' });
    return;
  }

  try {
    const result: HandLandmarkerResult = handLandmarker.detectForVideo(frame, sentAt);
    const handsEvent: GestureWorkerHandsEvent & {
      payload?: HandLandmarkerResult & { frameId: number; ts: number };
    } = {
      type: 'hands',
      multiHandLandmarks: result?.multiHandLandmarks ?? [],
      multiHandedness: result?.multiHandedness ?? [],
      frameId,
      ts: sentAt,
      payload: {
        ...result,
        frameId,
        ts: sentAt,
      },
    };
    post(handsEvent);
    postMetrics(frameId, sentAt);
  } catch (error) {
    droppedFrames += 1;
    post({
      type: 'log',
      level: 'error',
      tag: 'gesture_worker',
      message: `detection_failed:${error}`,
      ts: performance.now(),
    });
    post({ type: 'lost', frameId, ts: performance.now(), reason: 'dropped' });
  } finally {
    try {
      frame.close();
    } catch {}
  }
};

const handleReset = (reason?: string) => {
  droppedFrames = 0;
  lastFrameTimestamp = performance.now();
  post({
    type: 'log',
    level: 'info',
    tag: 'gesture_worker',
    message: `reset:${reason ?? 'manual'}`,
    ts: performance.now(),
  });
  setStatus('idle');
};

const handleTerminate = () => {
  setStatus('idle', 'terminated');
  try {
    handLandmarker?.close?.();
  } catch {}
  ctx.close();
};

ctx.addEventListener('message', (event: MessageEvent<GestureWorkerCommand>) => {
  const message = event.data;
  switch (message.type) {
    case 'init':
      void handleInit();
      break;
    case 'config':
      handleConfig(message.config);
      break;
    case 'frame':
      handleFrame(message.frame, message.frameId, message.sentAt);
      break;
    case 'reset':
      handleReset(message.reason);
      break;
    case 'terminate':
      handleTerminate();
      break;
    default: {
      const never: never = message;
      post({
        type: 'log',
        level: 'warn',
        tag: 'gesture_worker',
        message: `unknown_message:${JSON.stringify(never)}`,
        ts: performance.now(),
      });
    }
  }
});

export {};
