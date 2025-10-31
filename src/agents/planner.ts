import { bus, post } from '../gestures/gestureBus';
import { isCorrectGesture, type ExpectedGesture } from '../gestures/gestureEvaluator';
import { tagAction } from './attribution';

let listenerBound = false;
let expectedGesture: ExpectedGesture | null = null;

export const setExpectedGesture = (gesture: ExpectedGesture | null) => {
  expectedGesture = gesture;
};

export const startPlanner = () => {
  if (listenerBound) return;
  listenerBound = true;

  bus.addEventListener('message', ({ data }) => {
    if (!data) return;

    if (data.intent === 'voice') {
      const text = String(data.text ?? '').toLowerCase();
      if (text.includes('start')) {
        post({ intent: 'planner', action: 'NAVIGATE_PRACTICE' });
        tagAction('voice', 'NAVIGATE_PRACTICE');
      }
    }

    if (data.intent === 'gesture') {
      if (isCorrectGesture(expectedGesture, data.type, data.score ?? 0)) {
        post({
          intent: 'planner',
          action: 'PRACTICE_CORRECT',
          meta: { actual: data.type, score: data.score },
        });
        tagAction('gesture', 'PRACTICE_CORRECT');
      } else {
        post({
          intent: 'planner',
          action: 'GESTURE_OBSERVED',
          meta: { type: data.type, score: data.score },
        });
      }
    }
  });
};
