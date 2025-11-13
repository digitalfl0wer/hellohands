export type ExpectedGesture = 'thumbs_up' | 'open_palm' | 'point' | 'pinch';

export type GestureThresholds = Partial<Record<ExpectedGesture, number>>;

const STORAGE_KEY = 'hh_gesture_thresholds_v1';

interface StoredThresholdProfile {
  deviceId: string;
  thresholds: GestureThresholds;
  updatedAtIso: string;
}

let cachedThresholds: GestureThresholds | null = null;

function getDeviceId(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent ?? 'unknown';
  return ua.slice(0, 120);
}

function readThresholdProfile(): StoredThresholdProfile | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredThresholdProfile;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function getBaseThreshold(): number {
  const raw = (import.meta as any)?.env?.VITE_GESTURE_THRESHOLD;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 0.6;
}

export function getGestureThreshold(expected: ExpectedGesture | null): number {
  if (!expected) return getBaseThreshold();
  if (!cachedThresholds) {
    const profile = readThresholdProfile();
    cachedThresholds = profile?.thresholds ?? {};
  }
  const fromProfile = cachedThresholds?.[expected];
  if (typeof fromProfile === 'number' && fromProfile > 0 && fromProfile < 1) {
    return fromProfile;
  }
  return getBaseThreshold();
}

export function saveGestureThresholds(thresholds: GestureThresholds): void {
  if (!thresholds || typeof thresholds !== 'object') return;
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const existing = readThresholdProfile();
    const merged: GestureThresholds = {
      ...(existing?.thresholds ?? {}),
      ...thresholds,
    };
    const profile: StoredThresholdProfile = {
      deviceId: getDeviceId(),
      thresholds: merged,
      updatedAtIso: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    cachedThresholds = merged;
  } catch {
    // ignore storage errors; fall back to base threshold
  }
}

export const isCorrectGesture = (
  expected: ExpectedGesture | null,
  actual: string,
  score = 0,
  kidMode = false,
): boolean => {
  if (!expected) return false;
  const baseThreshold = getGestureThreshold(expected);
  const threshold = kidMode ? Math.max(0, baseThreshold - 0.05) : baseThreshold;
  return expected === actual && score >= threshold;
};

