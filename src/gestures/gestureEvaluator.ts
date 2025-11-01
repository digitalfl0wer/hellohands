export type ExpectedGesture = 'thumbs_up' | 'open_palm' | 'point' | 'pinch';

export const isCorrectGesture = (
  expected: ExpectedGesture | null,
  actual: string,
  score = 0,
): boolean => {
  if (!expected) return false;
  const raw = (import.meta as any)?.env?.VITE_GESTURE_THRESHOLD;
  const parsed = Number(raw);
  const threshold = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 0.6;
  return expected === actual && score >= threshold;
};
