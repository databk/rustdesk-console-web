/** @jest-environment node */
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import {
  shutdownSessionWorker,
  WORKER_SHUTDOWN_TIMEOUT_MS,
} from './shutdown-worker';

class QueuedWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  queue: { type: string; generation: number }[] = [];
  processed: string[] = [];
  postMessage = jest.fn((message: { type: string; generation: number }) => {
    this.queue.push(message);
  });
  terminate = jest.fn(() => {
    this.queue = [];
  });
  drain() {
    while (this.queue.length) {
      const message = this.queue.shift();
      if (!message) break;
      this.processed.push(message.type);
      if (message.type === 'shutdown') {
        this.processed.push('session-disposed');
        this.emit({
          type: 'shutdown-complete',
          generation: message.generation,
        });
      }
    }
  }
  emit(data: object) {
    this.onmessage?.({ data } as MessageEvent);
  }
}
beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

test('queued key releases and session disposal finish before Worker termination', () => {
  const worker = new QueuedWorker();
  worker.postMessage({ type: 'input-release', generation: 3 });
  shutdownSessionWorker(worker as unknown as Worker, 4);
  expect(worker.terminate).not.toHaveBeenCalled();
  worker.emit({ type: 'shutdown-complete', generation: 3 });
  expect(worker.terminate).not.toHaveBeenCalled();
  const close = jest.fn();
  worker.emit({ type: 'frame', generation: 3, frame: { close } });
  expect(close).toHaveBeenCalledTimes(1);
  worker.drain();
  expect(worker.processed).toEqual([
    'input-release',
    'shutdown',
    'session-disposed',
  ]);
  expect(worker.terminate).toHaveBeenCalledTimes(1);
  expect(worker.onmessage).toBeNull();
  expect(worker.onerror).toBeNull();
  expect(jest.getTimerCount()).toBe(0);
});

test('an unresponsive Worker is forcibly terminated at the bounded deadline', () => {
  const worker = new QueuedWorker();
  shutdownSessionWorker(worker as unknown as Worker, 4);
  jest.advanceTimersByTime(WORKER_SHUTDOWN_TIMEOUT_MS - 1);
  expect(worker.terminate).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(worker.terminate).toHaveBeenCalledTimes(1);
  worker.drain();
  expect(worker.processed).toEqual([]);
  expect(jest.getTimerCount()).toBe(0);
});

test.each(['post', 'error'])(
  'a Worker %s failure terminates and clears the shutdown timer',
  (failure) => {
    const worker = new QueuedWorker();
    if (failure === 'post')
      worker.postMessage.mockImplementation(() => {
        throw new Error('closed');
      });
    shutdownSessionWorker(worker as unknown as Worker, 4);
    if (failure === 'error') worker.onerror?.();
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  },
);
