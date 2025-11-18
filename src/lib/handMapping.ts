import type { HandLandmarkerResult } from '@mediapipe/tasks-vision';

export type MappedHands = {
  leftHand?: {
    landmarks: any;
    handednessScore: number;
  };
  rightHand?: {
    landmarks: any;
    handednessScore: number;
  };
};

export function mapResultToHands(result: HandLandmarkerResult): MappedHands {
  const mapped: MappedHands = {};
  const landmarks = result.multiHandLandmarks ?? [];
  const handedness = result.multiHandedness ?? [];

  for (let i = 0; i < landmarks.length; i++) {
    const categories = handedness[i]?.categories ?? [];
    const best = categories[0];
    if (!best) continue;
    const label = best.categoryName;
    const score = best?.score ?? 0;
    if (label === 'Left') {
      mapped.leftHand = { landmarks: landmarks[i], handednessScore: score };
    } else if (label === 'Right') {
      mapped.rightHand = { landmarks: landmarks[i], handednessScore: score };
    }
  }

  return mapped;
}
