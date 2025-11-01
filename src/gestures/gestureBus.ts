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
  | {
      intent: 'log';
      level: 'info' | 'warn' | 'error';
      tag: string;
      message: string;
      data?: unknown;
    }
  | {
      intent: 'attribution';
      from: 'voice' | 'gesture' | 'planner';
      action: string;
      ts: number;
    };

const createBus = (): BroadcastChannel => {
  if (typeof BroadcastChannel !== 'undefined') {
    return new BroadcastChannel(BUS_NAME);
  }

  // Fallback: in-page event bus via EventTarget
  const target: EventTarget = new EventTarget();
  const shim: BroadcastChannel = {
    name: BUS_NAME,
    postMessage: (data: unknown) => {
      const evt = new MessageEvent('message', { data });
      target.dispatchEvent(evt);
    },
    close: () => undefined,
    addEventListener: (type: any, listener: any, options?: any) =>
      (target.addEventListener as any)(type, listener, options),
    removeEventListener: (type: any, listener: any, options?: any) =>
      (target.removeEventListener as any)(type, listener, options),
    dispatchEvent: (event: Event) => target.dispatchEvent(event),
    onmessage: null as any,
    onmessageerror: null as any,
  } as any;
  return shim;
};

export const bus: BroadcastChannel = createBus();

export const post = (event: HHEvent) => {
  bus.postMessage(event);
};
