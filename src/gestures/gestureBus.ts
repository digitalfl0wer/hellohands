export const BUS_NAME = 'hh_bus';

export type HHEvent =
  | {
      intent: 'gesture';
      type: 'thumbs_up' | 'open_palm' | 'point' | 'pinch';
      score?: number;
    }
  | { intent: 'voice'; text: string }
  | { intent: 'planner'; action: string; meta?: Record<string, unknown> }
  | { intent: 'prefetch'; resource: string }
  | { intent: 'attribution'; from: 'voice' | 'gesture' | 'planner'; action: string; ts: number };

const createBus = (): BroadcastChannel => {
  if (typeof BroadcastChannel === 'undefined') {
    return {
      name: BUS_NAME,
      postMessage: () => undefined,
      close: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
      onmessage: null,
      onmessageerror: null,
    } as unknown as BroadcastChannel;
  }
  return new BroadcastChannel(BUS_NAME);
};

export const bus: BroadcastChannel = createBus();

export const post = (event: HHEvent) => {
  bus.postMessage(event);
};
