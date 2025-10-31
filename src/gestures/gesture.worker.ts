// @ts-ignore External runtime import without bundled types.
import {
  FilesetResolver,
  HandLandmarker,
} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest';

import type { HHEvent } from './gestureBus';

const bus = new BroadcastChannel('hh_bus');

let detector: any = null;
let ready = false;

async function init() {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
  );

  detector = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      // CDN path keeps the bundle size small; swap for /hand_landmarker.task if packaged locally.
      modelAssetPath:
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/hand_landmarker.task',
    },
    runningMode: 'VIDEO',
    numHands: 1,
  });

  ready = true;
  (self as unknown as Worker)['postMessage']?.({ ready: true });
}

void init();

type GestureClassification = {
  type: 'thumbs_up' | 'open_palm' | 'point' | 'pinch';
  score: number;
};

function classifyLandmarks(landmarks: any[]): GestureClassification | null {
  const pts = landmarks[0];
  if (!pts) return null;

  const dist = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y);

  const pinch = dist(pts[4], pts[8]) < 0.05;
  if (pinch) {
    return { type: 'pinch', score: 0.9 };
  }

  const spread = dist(pts[5], pts[17]); // index knuckle to pinky knuckle
  if (spread > 0.25) {
    return { type: 'open_palm', score: 0.8 };
  }

  const indexLong = dist(pts[8], pts[5]) > 0.2;
  const middleShort = dist(pts[12], pts[9]) < 0.12;
  if (indexLong && middleShort) {
    return { type: 'point', score: 0.75 };
  }

  if (pts[4].y < pts[5].y && middleShort) {
    return { type: 'thumbs_up', score: 0.7 };
  }

  return null;
}

self.onmessage = async (event: MessageEvent<{ video: HTMLVideoElement }>) => {
  if (!ready || !detector) return;

  const { video } = event.data;
  if (!video) return;

  const detection = await detector.detectForVideo(video, performance.now());
  const classification = detection.landmarks?.length
    ? classifyLandmarks(detection.landmarks)
    : null;

  if (classification) {
    const payload: HHEvent = {
      intent: 'gesture',
      type: classification.type,
      score: classification.score,
    };
    bus.postMessage(payload);
  }
};

export {};
