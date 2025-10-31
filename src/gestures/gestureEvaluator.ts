export type ExpectedGesture = 'thumbs_up' | 'open_palm' | 'point' | 'pinch';

export const isCorrectGesture = (
  expected: ExpectedGesture | null,
  actual: string,
  score = 0,
): boolean => {
  if (!expected) return false;
  return expected === actual && score >= 0.6;
};
