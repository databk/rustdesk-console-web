// Synthetic source only: no screen capture, clipboard, camera or network access.
// Run generateVp9Fixture() in a secure-context Chromium page, then save its JSON result.
async function generateVp9Fixture() {
  const frames = [];
  const failures = [];
  let index = 0;
  for (const [width, height] of [
    [64, 48],
    [128, 72],
  ]) {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    const encoder = new VideoEncoder({
      output: (chunk) => {
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        frames.push({
          width,
          height,
          pts: chunk.timestamp / 1000,
          key: chunk.type === 'key',
          data: btoa(String.fromCharCode(...data)),
        });
      },
      error: (error) => failures.push(error.message),
    });
    encoder.configure({
      codec: 'vp09.00.10.08',
      width,
      height,
      bitrate: 250000,
      framerate: 25,
      latencyMode: 'realtime',
      hardwareAcceleration: 'prefer-software',
    });
    for (let local = 0; local < 4; ++local) {
      context.fillStyle = local % 2 ? '#2040a0' : '#a04020';
      context.fillRect(0, 0, width, height);
      context.fillStyle = '#40d080';
      context.fillRect(local * 8, 8, 16, height - 16);
      const frame = new VideoFrame(canvas, { timestamp: index++ * 40000 });
      encoder.encode(frame, { keyFrame: local === 0 });
      frame.close();
    }
    await encoder.flush();
    encoder.close();
  }
  if (failures.length) throw Error(failures.join('; '));
  return {
    source: 'Locally generated moving colored rectangles; no user content',
    generator: 'scripts/web-client/generate-vp9-fixture.js',
    codec: 'vp09.00.10.08',
    browser: navigator.userAgent,
    frames,
  };
}
Object.assign(globalThis, { generateVp9Fixture });
