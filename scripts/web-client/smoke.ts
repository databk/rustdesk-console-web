import { createSessionWorker } from '../../src/features/web-client/worker/create-worker';

async function initialize() {
  const worker = await createSessionWorker();
  const events: unknown[] = [];
  const canvas = document.createElement('canvas');
  canvas.style.maxWidth = '100%';
  document.body.appendChild(canvas);
  let frames = 0;
  let generation = 0;
  worker.onmessage = (event) => {
    if (event.data.type === 'frame') {
      const frame: VideoFrame = event.data.frame;
      canvas.width = frame.displayWidth;
      canvas.height = frame.displayHeight;
      canvas.getContext('2d')?.drawImage(frame, 0, 0);
      frame.close();
      ++frames;
      worker.postMessage({
        type: 'rendered',
        generation: event.data.generation,
      });
    } else events.push(event.data);
  };
  worker.onerror = () => {
    events.push({ type: 'worker-error' });
  };
  Object.assign(globalThis, {
    webClientSmoke: {
      events,
      get frames() {
        return frames;
      },
      send: (data: { type: string }) => {
        if (data.type === 'connect' || data.type === 'disconnect') ++generation;
        worker.postMessage({ ...data, generation });
      },
      dispose: () => worker.terminate(),
    },
  });
}
void initialize();
