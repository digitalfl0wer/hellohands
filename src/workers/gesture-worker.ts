import {
  DEFAULT_GESTURE_WORKER_CONFIG,
  type GestureWorkerCommand,
  type GestureWorkerConfig,
  type GestureWorkerEvent,
  type GestureWorkerStatus,
} from './gestureWorker.types';

declare const self: DedicatedWorkerGlobalScope;

const ctx = self;

let status: GestureWorkerStatus = 'idle';
let config: GestureWorkerConfig = { ...DEFAULT_GESTURE_WORKER_CONFIG };
let lastFrameId = -1;
let droppedFrames = 0;

const post = (event: GestureWorkerEvent) => {
  ctx.postMessage(event);
};

const setStatus = (next: GestureWorkerStatus, details?: string) => {
  status = next;
  post({
    type: 'status',
    status: next,
    details,
    ts: performance.now(),
  });
};

const disposeFrame = (frame: ImageBitmap | undefined | null) => {
  try {
    frame?.close();
  } catch {
    // ignore
  }
};

const handleInit = () => {
  setStatus('starting');
  // Placeholder for model loading / warmup.
  setStatus('ready');
};

const handleConfig = (partial: Partial<GestureWorkerConfig>) => {
  config = { ...config, ...partial };
  post({
    type: 'log',
    level: 'info',
    tag: 'gesture_worker',
    message: `config_applied:fps=${config.fpsTarget}`,
    ts: performance.now(),
  });
};

const handleFrame = (frame: ImageBitmap, frameId: number, sentAt: number) => {
  if (status !== 'ready') {
    disposeFrame(frame);
    droppedFrames += 1;
    post({
      type: 'lost',
      frameId,
      ts: performance.now(),
      reason: 'dropped',
    });
    return;
  }

  lastFrameId = frameId;
  disposeFrame(frame);

  // Skeleton placeholder: real gesture recognition will land in future commits.
  post({
    type: 'log',
    level: 'info',
    tag: 'gesture_worker',
    message: `frame_ack:${frameId}:lag=${Math.max(0, performance.now() - sentAt).toFixed(1)}ms`,
    ts: performance.now(),
  });
};

const handleReset = (reason?: string) => {
  lastFrameId = -1;
  droppedFrames = 0;
  post({
    type: 'log',
    level: 'info',
    tag: 'gesture_worker',
    message: `reset:${reason ?? 'manual'}`,
    ts: performance.now(),
  });
  setStatus('idle');
};

const handleTerminate = () => {
  setStatus('idle', 'terminated');
  ctx.close();
};

ctx.addEventListener('message', (event: MessageEvent<GestureWorkerCommand>) => {
  const message = event.data;
  switch (message.type) {
    case 'init':
      handleInit();
      break;
    case 'config':
      handleConfig(message.config);
      break;
    case 'frame':
      handleFrame(message.frame, message.frameId, message.sentAt);
      break;
    case 'reset':
      handleReset(message.reason);
      break;
    case 'terminate':
      handleTerminate();
      break;
    default: {
      const never: never = message;
      post({
        type: 'log',
        level: 'warn',
        tag: 'gesture_worker',
        message: `unknown_message:${JSON.stringify(never)}`,
        ts: performance.now(),
      });
    }
  }
});

export {};
