import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';

const VISION_WASM_ROOT =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm';
// All-CDN sanity check: point directly at the official hand_landmarker model
// for this Tasks release to rule out any local .task mismatch.
const HAND_LANDMARKER_TASK =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

/**
 * Canonical HelloHands hand detector helper.
 * Runs on the main thread and exposes the MediaPipe HandLandmarker instance
 * so camera components can call detectForVideo directly.
 * Uses locally hosted WASM and model assets to avoid CDN drift.
 */
export async function createHandLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(VISION_WASM_ROOT);
  const useCpuDelegate = (import.meta as any)?.env?.VITE_MP_CPU === '1';
  const delegate = useCpuDelegate ? 'CPU' : 'GPU';
  const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: HAND_LANDMARKER_TASK,
      delegate,
    },
    runningMode: 'VIDEO',
    // For sanity, keep detection generous until we see non-zero results.
    numHands: 1,
    minHandDetectionConfidence: 0.3,
    minHandPresenceConfidence: 0.3,
    minTrackingConfidence: 0.3,
  });
  return handLandmarker;
}

export type HandDetectionResult = HandLandmarkerResult;
