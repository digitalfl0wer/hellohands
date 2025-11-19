import {
  DEFAULT_GESTURE_WORKER_CONFIG,
  type GestureWorkerCommand,
  type GestureWorkerConfig,
  type GestureWorkerEvent,
  type GestureWorkerStatus,
} from './gestureWorker.types';
export type GestureWorkerClientEventHandler = (event: GestureWorkerEvent) => void;

export interface GestureWorkerClientOptions {
  onEvent?: GestureWorkerClientEventHandler;
  createWorker?: () => Worker;
}

// Detection currently runs on the main thread; keep the worker
// implementation parked for future use.
const USE_GESTURE_WORKER = false;

const createDefaultWorker = () => {
  if ((import.meta as any)?.env?.DEV) {
    // eslint-disable-next-line no-console
    console.info('[gesture_worker_client] using module worker');
  }
  return new Worker(new URL('./gesture-worker.ts', import.meta.url), {
    type: 'module',
  });
};

export interface SendFrameOptions {
  frame: ImageBitmap;
  sentAt?: number;
}

export class GestureWorkerClient {
  private worker: Worker | null = null;
  private status: GestureWorkerStatus = 'idle';
  private frameId = 0;
  private config: GestureWorkerConfig = { ...DEFAULT_GESTURE_WORKER_CONFIG };

  constructor(private readonly options: GestureWorkerClientOptions = {}) {}

  init(payload?: { modelAssetUrl?: string; warmupFrames?: number }) {
    this.ensureWorker();
    this.status = 'starting';
    this.postMessage({
      type: 'init',
      modelAssetUrl: payload?.modelAssetUrl,
      warmupFrames: payload?.warmupFrames,
    });
  }

  configure(config: Partial<GestureWorkerConfig>) {
    if (!config || Object.keys(config).length === 0) {
      return;
    }
    this.config = { ...this.config, ...config };
    this.postMessage({ type: 'config', config });
  }

  sendFrame({ frame, sentAt }: SendFrameOptions) {
    if (!frame) return;
    this.ensureWorker();
    const frameId = this.frameId++;
    const message: GestureWorkerCommand = {
      type: 'frame',
      frame,
      frameId,
      sentAt: sentAt ?? performance.now(),
    };
    this.postMessage(message, [frame]);
  }

  reset(reason?: string) {
    if (!this.worker) return;
    this.postMessage({ type: 'reset', reason });
  }

  terminate() {
    if (!this.worker) return;
    this.postMessage({ type: 'terminate' });
    this.worker.terminate();
    this.worker = null;
    this.status = 'idle';
  }

  getStatus() {
    return this.status;
  }

  private ensureWorker() {
    if (!USE_GESTURE_WORKER) {
      if ((import.meta as any)?.env?.DEV) {
        // eslint-disable-next-line no-console
        console.info(
          '[gesture_worker_client] worker disabled; detection runs on main thread',
        );
      }
      return;
    }
    if (this.worker) return;
    const create = this.options.createWorker ?? createDefaultWorker;
    this.worker = create();
    this.worker!.addEventListener(
      'message',
      (event: MessageEvent<GestureWorkerEvent>) => {
        const data = event.data;
        if (data.type === 'status') {
          this.status = data.status;
        }
        this.options.onEvent?.(data);
      },
    );
    this.worker!.addEventListener('error', (error) => {
      this.status = 'error';
      this.options.onEvent?.({
        type: 'status',
        status: 'error',
        details: (error as ErrorEvent)?.message ?? 'worker_error',
        ts: performance.now(),
      });
    });
  }

  private postMessage(command: GestureWorkerCommand, transfer?: Transferable[]) {
    if (!this.worker) {
      if (command.type === 'frame') {
        command.frame.close();
      }
      return;
    }

    if (transfer) {
      this.worker.postMessage(command, transfer);
    } else {
      this.worker.postMessage(command);
    }
  }
}

export const createGestureWorkerClient = (options?: GestureWorkerClientOptions) =>
  new GestureWorkerClient(options);
