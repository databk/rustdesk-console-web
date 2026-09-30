/** @jest-environment node */
import { expect, jest, test } from '@jest/globals';
import { AudioPlayer } from './audio-player';

test('播放缓冲、音量、停止和关闭均作用于同一有界音频上下文', async () => {
  const original = Reflect.get(globalThis, 'AudioContext');
  const sources: {
    stop: ReturnType<typeof jest.fn>;
    disconnect: ReturnType<typeof jest.fn>;
    start: ReturnType<typeof jest.fn>;
  }[] = [];
  const gain = {
    gain: { value: 1 },
    connect: jest.fn(),
    disconnect: jest.fn(),
  };
  const close = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  Object.assign(globalThis, {
    AudioContext: class {
      state = 'running';
      currentTime = 0;
      destination = {};
      async resume() {}
      close = close;
      createGain() {
        return gain;
      }
      createBuffer(_channels: number, length: number, rate: number) {
        return { duration: length / rate, copyToChannel: jest.fn() };
      }
      createBufferSource() {
        const source = {
          stop: jest.fn(),
          disconnect: jest.fn(),
          start: jest.fn(),
          connect: jest.fn(),
          onended: null,
          buffer: null,
        };
        sources.push(source);
        return source;
      }
    },
  });
  try {
    const player = new AudioPlayer();
    await player.start();
    player.volume(0.4);
    expect(gain.gain.value).toBe(0.4);
    for (let i = 0; i < 40; i++)
      player.play({ sampleRate: 48000, planes: [new Float32Array(480)] });
    expect(
      sources.filter((source) => source.stop.mock.calls.length === 0).length,
    ).toBeLessThanOrEqual(26);
    player.volume(0);
    expect(gain.gain.value).toBe(0);
    player.dispose();
    player.dispose();
    expect(sources.every((source) => source.stop.mock.calls.length === 1)).toBe(
      true,
    );
    expect(close).toHaveBeenCalledTimes(1);
    expect(gain.disconnect).toHaveBeenCalledTimes(1);
  } finally {
    Object.assign(globalThis, { AudioContext: original });
  }
});
