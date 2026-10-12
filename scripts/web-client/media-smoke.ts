import fixture from '../../src/features/web-client/media/fixtures/vp9-color-bars.json';
import { Vp9Decoder } from '../../src/features/web-client/media/vp9-decoder';

// A private validation entry, never included in the Console route/build.
async function validateMedia() {
  if (!(await Vp9Decoder.supported())) throw new Error('VP9 unavailable');
  const decoded: { width: number; height: number; timestamp: number }[] = [];
  let acknowledgements = 0;
  let errors = 0;
  const stream = new Vp9Decoder(
    (frame) => {
      decoded.push({
        width: frame.displayWidth,
        height: frame.displayHeight,
        timestamp: frame.timestamp,
      });
      frame.close();
    },
    () => {
      ++acknowledgements;
    },
    () => {
      ++errors;
    },
  );
  async function waitFor(predicate: () => boolean) {
    const deadline = Date.now() + 7000;
    while (!predicate()) {
      if (Date.now() >= deadline) throw new Error('Media validation timeout');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  try {
    for (const [index, frame] of fixture.frames.entries()) {
      stream.decode({
        frames: [
          {
            pts: frame.pts,
            key: frame.key,
            data: Uint8Array.from(atob(frame.data), (value) =>
              value.charCodeAt(0),
            ),
          },
        ],
      });
      await waitFor(() => decoded.length > index || errors > 0);
      if (errors) throw new Error('Valid fixture failed decoding');
    }
  } finally {
    stream.dispose();
  }
  let corruptedErrors = 0;
  let corruptedFrames = 0;
  const corrupted = new Vp9Decoder(
    (frame) => {
      ++corruptedFrames;
      frame.close();
    },
    () => {},
    () => {
      ++corruptedErrors;
    },
  );
  try {
    corrupted.decode({
      frames: [{ pts: 0, key: true, data: new Uint8Array([255, 0, 1, 2]) }],
    });
    await waitFor(() => corruptedErrors > 0);
  } finally {
    corrupted.dispose();
  }
  return {
    decoded,
    acknowledgements,
    errors,
    corruptedErrors,
    corruptedFrames,
  };
}
Object.assign(globalThis, { webClientMediaCheck: validateMedia });
