import type { ExpectedGesture } from '../gestures/gestureEvaluator';
import type { GestureThresholdsMap } from '../gestures/thresholds';

const STORAGE_KEY = 'hh_gesture_thresholds_v1';

interface CalibrationProfile {
  deviceId: string;
  thresholds: GestureThresholdsMap;
  updatedAtIso: string;
}

let cachedThresholds: GestureThresholdsMap | null = null;

function getDeviceId(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent ?? 'unknown';
  return ua.slice(0, 120);
}

function readCalibrationProfile(): CalibrationProfile | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CalibrationProfile;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getCalibrationThresholds(): GestureThresholdsMap {
  if (!cachedThresholds) {
    const profile = readCalibrationProfile();
    cachedThresholds = profile?.thresholds ?? ({} as GestureThresholdsMap);
  }
  return cachedThresholds;
}

export function saveGestureThresholds(thresholds: GestureThresholdsMap): void {
  if (!thresholds || typeof thresholds !== 'object') return;
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const existing = readCalibrationProfile();
    const merged: GestureThresholdsMap = {
      ...(existing?.thresholds ?? {}),
      ...thresholds,
    };
    const profile: CalibrationProfile = {
      deviceId: getDeviceId(),
      thresholds: merged,
      updatedAtIso: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    cachedThresholds = merged;
  } catch {
    // ignore storage errors; fall back to base thresholds
  }
}

type CalibrationSample = {
  gesture: ExpectedGesture;
  score: number;
};

let calibrationActive = false;
let calibrationSamples: CalibrationSample[] = [];

export function startCalibration(): void {
  calibrationActive = true;
  calibrationSamples = [];
}

export function recordSample(gesture: ExpectedGesture, data: { score: number }): void {
  if (!calibrationActive) return;
  if (typeof data?.score !== 'number') return;
  calibrationSamples.push({ gesture, score: data.score });
}

export function finalizeCalibration(): void {
  if (!calibrationActive) return;
  calibrationActive = false;
  if (!calibrationSamples.length) return;

  const byGesture = new Map<ExpectedGesture, number[]>();
  for (const sample of calibrationSamples) {
    if (!byGesture.has(sample.gesture)) {
      byGesture.set(sample.gesture, []);
    }
    byGesture.get(sample.gesture)!.push(sample.score);
  }

  const nextThresholds: GestureThresholdsMap = {} as GestureThresholdsMap;
  byGesture.forEach((scores, gesture) => {
    if (!scores.length) return;
    const avg =
      scores.reduce((sum, value) => sum + value, 0) / Math.max(scores.length, 1);
    const threshold = Math.min(Math.max(avg, 0), 1);
    nextThresholds[gesture] = threshold;
  });

  if (Object.keys(nextThresholds).length > 0) {
    saveGestureThresholds(nextThresholds);
  }
  calibrationSamples = [];
}
