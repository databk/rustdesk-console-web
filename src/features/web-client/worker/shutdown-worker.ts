import type { Command, WorkerEvent } from './contract';

export const WORKER_SHUTDOWN_TIMEOUT_MS = 1000;

export function shutdownSessionWorker(worker: Worker, generation: number) {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    worker.onmessage = null;
    worker.onerror = null;
    worker.terminate();
  };
  const timer = setTimeout(finish, WORKER_SHUTDOWN_TIMEOUT_MS);
  // Detach the page immediately, but let previously queued releases run.
  worker.onmessage = (event: MessageEvent<WorkerEvent>) => {
    if (event.data.type === 'frame') event.data.frame.close();
    if (
      event.data.type === 'shutdown-complete' &&
      event.data.generation === generation
    )
      finish();
  };
  worker.onerror = finish;
  try {
    worker.postMessage({ type: 'shutdown', generation } satisfies Command);
  } catch {
    finish();
  }
}
