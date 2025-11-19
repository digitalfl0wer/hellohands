import { describe, expect, it, vi } from 'vitest';
import { GestureWorkerClient, createGestureWorkerClient } from '../gestureWorkerClient';
import type { GestureWorkerEvent } from '../gestureWorker.types';

class MockWorker {
  public messages: Array<{ data: unknown; transfer?: Transferable[] }> = [];
  public terminated = false;
  private messageListeners = new Set<(event: MessageEvent<unknown>) => void>();

  postMessage(data: unknown, transfer?: Transferable[]) {
    this.messages.push({ data, transfer });
  }

  addEventListener(type: string, listener: (event: MessageEvent<unknown>) => void) {
    if (type === 'message') {
      this.messageListeners.add(listener);
    }
  }

  removeEventListener(type: string, listener: (event: MessageEvent<unknown>) => void) {
    if (type === 'message') {
      this.messageListeners.delete(listener);
    }
  }

  emit(event: GestureWorkerEvent) {
    const messageEvent = { data: event } as MessageEvent<GestureWorkerEvent>;
    this.messageListeners.forEach((listener) => listener(messageEvent));
  }

  terminate() {
    this.terminated = true;
  }
}

describe('GestureWorkerClient', () => {
  it('sends init/config commands to the worker', () => {
    const worker = new MockWorker();
    const client = new GestureWorkerClient({
      createWorker: () => worker as unknown as Worker,
    });

    client.init({ modelAssetUrl: '/hand.task' });
    client.configure({ fpsTarget: 20 });

    expect(worker.messages[0]?.data).toMatchObject({
      type: 'init',
      modelAssetUrl: '/hand.task',
    });
    expect(worker.messages[1]?.data).toMatchObject({
      type: 'config',
      config: { fpsTarget: 20 },
    });
  });

  it('invokes event handler when worker posts messages', () => {
    const worker = new MockWorker();
    const onEvent = vi.fn();
    const client = createGestureWorkerClient({
      createWorker: () => worker as unknown as Worker,
      onEvent,
    });

    client.init();
    worker.emit({ type: 'status', status: 'ready', ts: 123 });

    expect(onEvent).toHaveBeenCalledWith({
      type: 'status',
      status: 'ready',
      ts: 123,
    });
    expect(client.getStatus()).toBe('ready');
  });

  it('posts frames with incrementing ids', () => {
    const worker = new MockWorker();
    const client = createGestureWorkerClient({
      createWorker: () => worker as unknown as Worker,
    });

    client.sendFrame({ frame: {} as ImageBitmap });

    expect(worker.messages[0]?.data).toMatchObject({
      type: 'frame',
      frameId: 0,
    });
  });
});
