export type ExpectedGesture = 'thumbs_up' | 'open_palm' | 'point' | 'pinch';
import { DEFAULT_GESTURE_THRESHOLDS, type GestureThresholdsMap } from './thresholds';
import { logger } from '../utils/logger';
import {
  getCalibrationThresholds,
  saveGestureThresholds as saveCalibrated,
} from '../state/calibration';

export const isCorrectGesture = (
  expected: ExpectedGesture | null,
  actual: string,
  score = 0,
  kidMode = false,
): boolean => {
  if (!expected) return false;
  const calibrated = getCalibrationThresholds()[expected];
  const baseThreshold =
    (typeof calibrated === 'number' && calibrated > 0 && calibrated < 1
      ? calibrated
      : DEFAULT_GESTURE_THRESHOLDS.baseDetectionThresholds[expected]) ?? 0.6;
  const offset = DEFAULT_GESTURE_THRESHOLDS.kidModeOffset;
  const threshold = kidMode ? Math.max(0, baseThreshold - offset) : baseThreshold;
  const isCorrect = expected === actual && score >= threshold;

  const devMeterOn = (import.meta as any)?.env?.VITE_MP_DEV_METER === '1';
  if (devMeterOn) {
    const margin = score - threshold;
    const ambiguousBand = 0.05;
    if (Math.abs(margin) <= ambiguousBand) {
      logger.mp.info('ambiguous_gesture', {
        expected,
        actual,
        score,
        threshold,
        kidMode,
        margin,
        accepted: isCorrect,
      });
    }
  }

  return isCorrect;
};

export const saveGestureThresholds = (thresholds: GestureThresholdsMap): void => {
  saveCalibrated(thresholds);
};
