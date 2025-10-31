import { post } from '../gestures/gestureBus';

type AttributionSource = 'voice' | 'gesture' | 'planner';

export const tagAction = (
  from: AttributionSource,
  action: string,
  meta?: { prefetch?: string },
) => {
  post({
    intent: 'attribution',
    from,
    action,
    ts: Date.now(),
  });

  if (meta?.prefetch) {
    post({
      intent: 'prefetch',
      resource: meta.prefetch,
    });
  }
};
