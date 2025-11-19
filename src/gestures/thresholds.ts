import type { ExpectedGesture } from './gestureEvaluator';

export type GestureThresholdsMap = Record<ExpectedGesture, number>;

export interface GestureThresholdConfig {
  baseDetectionThresholds: GestureThresholdsMap;
  kidModeOffset: number;
}

export const DEFAULT_GESTURE_THRESHOLDS: GestureThresholdConfig = {
  baseDetectionThresholds: {
    thumbs_up: 0.6,
    open_palm: 0.6,
    point: 0.6,
    pinch: 0.6,
  },
  kidModeOffset: 0.05,
};
