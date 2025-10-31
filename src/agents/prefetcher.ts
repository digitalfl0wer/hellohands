import { bus } from '../gestures/gestureBus';

export const startPrefetcher = () => {
  bus.addEventListener('message', (event: MessageEvent) => {
    if (event.data?.intent === 'prefetch') {
      // Placeholder – real implementation can warm caches or fetch assets.
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug('[prefetch]', event.data.resource);
      }
    }
  });
};
