/** @jest-environment node */
import { afterEach, expect, jest, test } from '@jest/globals';
import { OpusDecoder, opusDuration } from './opus';

afterEach(() => {
  jest.restoreAllMocks();
});
test('Opus TOC 覆盖 SILK/CELT、可变帧数和非法时长', () => {
  expect(opusDuration(new Uint8Array([0]))).toBe(10000);
  expect(opusDuration(new Uint8Array([8]))).toBe(20000);
  expect(opusDuration(new Uint8Array([24]))).toBe(60000);
  expect(opusDuration(new Uint8Array([128]))).toBe(2500);
  expect(opusDuration(new Uint8Array([131, 4]))).toBe(10000);
  expect(() => opusDuration(new Uint8Array([27, 3]))).toThrow();
  expect(() => opusDuration(new Uint8Array([3, 0]))).toThrow();
});
test('解码时间累计、背压和撤销后的输出关闭', async () => {
  let output!: (data: { close: () => void }) => void;
  const chunks: unknown[] = [];
  const closed = jest.fn();
  const error = jest.fn();
  const old = {
    AudioDecoder: Reflect.get(globalThis, 'AudioDecoder'),
    EncodedAudioChunk: Reflect.get(globalThis, 'EncodedAudioChunk'),
  };
  class Decoder {
    state = 'configured';
    decodeQueueSize = 0;
    static async isConfigSupported() {
      return { supported: true };
    }
    constructor(init: { output: typeof output }) {
      output = init.output;
    }
    configure() {}
    decode(chunk: unknown) {
      chunks.push(chunk);
    }
    close = closed;
  }
  Object.assign(globalThis, {
    AudioDecoder: Decoder,
    EncodedAudioChunk: class {
      constructor(init: object) {
        Object.assign(this, init);
      }
    },
  });
  try {
    const decoder = new OpusDecoder(jest.fn(), error);
    await decoder.configure({ sampleRate: 48000, channels: 2 });
    decoder.decode(new Uint8Array([128]));
    decoder.decode(new Uint8Array([8]));
    expect(chunks).toEqual([
      expect.objectContaining({ timestamp: 0, duration: 2500 }),
      expect.objectContaining({ timestamp: 2500, duration: 20000 }),
    ]);
    decoder.dispose();
    const close = jest.fn();
    output({ close });
    expect(close).toHaveBeenCalledTimes(1);
    expect(closed).toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  } finally {
    Object.assign(globalThis, old);
  }
});

test('PCM 在途数量有界，解码队列超限停止音频', async () => {
  type Data = {
    numberOfChannels: number;
    numberOfFrames: number;
    sampleRate: number;
    copyTo: (target: Float32Array) => void;
    close: () => void;
  };
  let output: (data: Data) => void = () => {};
  let queue = 0;
  const original = {
    AudioDecoder: Reflect.get(globalThis, 'AudioDecoder'),
    EncodedAudioChunk: Reflect.get(globalThis, 'EncodedAudioChunk'),
  };
  const close = jest.fn();
  const result = jest.fn();
  const error = jest.fn();
  Object.assign(globalThis, {
    AudioDecoder: class {
      state = 'configured';
      get decodeQueueSize() {
        return queue;
      }
      static async isConfigSupported() {
        return { supported: true };
      }
      constructor(init: { output: typeof output }) {
        output = init.output;
      }
      configure() {}
      decode() {}
      close() {}
    },
    EncodedAudioChunk: class {},
  });
  try {
    const decoder = new OpusDecoder(result, error);
    await decoder.configure({ sampleRate: 48000, channels: 2 });
    const data = {
      numberOfChannels: 2,
      numberOfFrames: 480,
      sampleRate: 48000,
      copyTo: (target: Float32Array) => {
        target.fill(0.1);
      },
      close,
    };
    for (let i = 0; i < 6; i++) output(data);
    expect(result).toHaveBeenCalledTimes(4);
    expect(close).toHaveBeenCalledTimes(6);
    decoder.acknowledge();
    output(data);
    expect(result).toHaveBeenCalledTimes(5);
    queue = 16;
    decoder.decode(new Uint8Array([128]));
    expect(error).toHaveBeenCalledTimes(1);
    decoder.dispose();
  } finally {
    Object.assign(globalThis, original);
  }
});
