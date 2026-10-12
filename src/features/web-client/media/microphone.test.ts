import { afterEach, expect, jest, test } from '@jest/globals';
import { Microphone } from './microphone';

afterEach(() => {
  jest.restoreAllMocks();
});
test('取消后迟到getUserMedia必须立即stop全部轨道，不创建采集图', async () => {
  let resolve: ((stream: MediaStream) => void) | undefined;
  const stop = jest.fn();
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: () =>
        new Promise<MediaStream>((r) => {
          resolve = r;
        }),
    },
  });
  const mic = new Microphone(jest.fn(), jest.fn());
  const start = mic.start();
  mic.dispose();
  resolve?.({ getTracks: () => [{ stop }] } as unknown as MediaStream);
  expect(await start).toBe(false);
  expect(stop).toHaveBeenCalledTimes(1);
});
test('麦克风拒绝不产生采集或遗留资源，能够取消重复清理', async () => {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: async () => {
        throw new Error('Denied');
      },
    },
  });
  const output = jest.fn(),
    mic = new Microphone(output, jest.fn());
  await expect(mic.start()).rejects.toThrow('Denied');
  mic.dispose();
  mic.dispose();
  mic.enable(true);
  mic.mute(true);
  expect(output).not.toHaveBeenCalled();
});
