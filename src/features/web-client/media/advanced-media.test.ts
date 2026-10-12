/** @jest-environment node */
import { afterEach, expect, jest, test } from '@jest/globals';
import { hbb } from '../protocol';
import { av1CodecPrivate } from './av1-format';
import { RECORD_LIMITS, StreamRecorder } from './recorder';
import {
  decodingOptions,
  videoBatch,
  videoCapabilities,
  vp9Format,
  supportsTrueColor,
  decoderConfig,
  VIDEO_CONFIGS,
} from './video-codecs';
import { VoiceEncoder } from './voice';
import { durationBytes, durationOffset, webmFrame, webmHeader } from './webm';
const av1Main = {
  codec: 'av1' as const,
  profile: 0,
  bitDepth: 8,
  codecString: 'av01.0.00M.08.0.110.02.02.02.0',
};
// 序列头+Frame OBU首部前缀用于容器门禁测试，不作为真实解码样本。
const av1MainKey = new Uint8Array([
  10, 6, 24, 12, 255, 192, 0, 128, 0x32, 1, 0x10,
]);
const av1ColorKey = new Uint8Array([
  0x12, 0, 0x0a, 13, 32, 0, 0, 2, 175, 247, 155, 95, 52, 8, 8, 4, 64, 0x32, 1,
  0x10,
]);

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});
test('只声明探测成功的编码与444能力，原生偏好可往返', async () => {
  Object.assign(globalThis, {
    VideoDecoder: {
      isConfigSupported: async (c: VideoDecoderConfig) => ({
        supported: c.codec === 'vp8',
      }),
    },
  });
  const caps = await videoCapabilities();
  expect(caps).toEqual({
    vp9: false,
    vp8: true,
    av1: false,
    vp9_444: false,
    av1_444: false,
  });
  const wire = hbb.Message.decode(
    hbb.Message.encode({
      misc: {
        option: { supportedDecoding: decodingOptions(caps, 'vp8', true) },
      },
    }).finish(),
  );
  expect(wire.misc?.option?.supportedDecoding).toMatchObject({
    abilityVp8: 1,
    abilityVp9: 0,
    prefer: hbb.SupportedDecoding.PreferCodec.VP8,
    preferChroma: hbb.Chroma.I420,
  });
  expect(videoBatch({ av1s: { frames: [] } })?.codec).toBe('av1');
});
test('VP9头解析区分420/444，截断与非关键帧不伪造格式', () => {
  expect(vp9Format(new Uint8Array([0x82, 0x49, 0x83, 0x42, 0]))).toMatchObject({
    profile: 0,
    chroma: '4:2:0',
  });
  expect(vp9Format(new Uint8Array([0xa2, 0x49, 0x83, 0x42, 0]))).toMatchObject({
    profile: 1,
    chroma: '4:4:4',
  });
  expect(vp9Format(new Uint8Array([0x82]))).toBeUndefined();
});

test('AV1真彩色独立探测，auto保留自动且结合实际两端资格', async () => {
  const configs: string[] = [];
  Object.assign(globalThis, {
    VideoDecoder: {
      isConfigSupported: async (config: VideoDecoderConfig) => {
        configs.push(config.codec);
        return { supported: config.codec.startsWith('av01.') };
      },
    },
  });
  const caps = await videoCapabilities();
  expect(caps).toMatchObject({ av1: true, av1_444: true, vp9_444: false });
  expect(configs).toContain(VIDEO_CONFIGS.av1_444.codec);
  expect(supportsTrueColor(caps, 'auto')).toBe(true);
  expect(
    supportsTrueColor(caps, 'av1', { av1: true, i444: { av1: true } }),
  ).toBe(true);
  expect(
    supportsTrueColor(caps, 'auto', { av1: false, i444: { vp9: true } }),
  ).toBe(false);
  expect(
    supportsTrueColor(caps, 'av1', { av1: true, i444: { av1: false } }),
  ).toBe(false);
  expect(supportsTrueColor(caps, 'vp9')).toBe(false);
  expect(supportsTrueColor(caps, 'vp8')).toBe(false);
  expect(decodingOptions(caps, 'auto', true)).toMatchObject({
    prefer: hbb.SupportedDecoding.PreferCodec.Auto,
    i444: { vp9: false, av1: true },
    preferChroma: hbb.Chroma.I444,
  });
  expect(decoderConfig({ codec: 'av1', profile: 1 }, caps)).toBeUndefined();
});
test('录制从关键帧开始、时间归零、单块确认后才能发送下一块，停止收尾有界', () => {
  const output = jest.fn<(seq: number, bytes: Uint8Array) => void>(),
    done = jest.fn();
  const r = new StreamRecorder(output, done);
  r.frame({ codec: 'vp8' }, 160, 96, new Uint8Array([1]), 100, false);
  expect(output).not.toHaveBeenCalled();
  r.frame({ codec: 'vp8' }, 160, 96, new Uint8Array([2]), 200, true);
  r.frame({ codec: 'vp8' }, 160, 96, new Uint8Array([3]), 400, false);
  expect(output).toHaveBeenCalledTimes(1);
  r.stop('user');
  expect(done).not.toHaveBeenCalled();
  r.consumed(99, true);
  expect(output).toHaveBeenCalledTimes(1);
  r.consumed(1, true);
  r.consumed(2, true);
  r.consumed(3, true);
  expect(done).toHaveBeenCalledWith('user', 400);
  r.consumed(3, true);
  expect(done).toHaveBeenCalledTimes(1);
});
test('尺寸/编码/倒退时间停止当前录制；写入超时和过大帧只结束录制', () => {
  jest.useFakeTimers();
  const done = jest.fn(),
    r = new StreamRecorder(() => {}, done);
  r.frame(
    { codec: 'vp9', profile: 0 },
    160,
    96,
    new Uint8Array([1]),
    100,
    true,
  );
  r.frame({ codec: 'vp8' }, 160, 96, new Uint8Array([1]), 200, true);
  r.consumed(1, true);
  r.consumed(2, true);
  expect(done).toHaveBeenCalledWith('changed', expect.any(Number));
  const timeout = jest.fn(),
    stalled = new StreamRecorder(() => {}, timeout);
  stalled.frame({ codec: 'vp8' }, 160, 96, new Uint8Array([1]), 100, true);
  jest.advanceTimersByTime(RECORD_LIMITS.timeoutMs);
  expect(timeout).toHaveBeenCalledWith('failed', expect.any(Number));
  expect(jest.getTimerCount()).toBe(0);
});
test('Blob录制限额及Duration固定位置补写不会改变头长度', () => {
  const header = webmHeader('av1', 160, 96, av1CodecPrivate(av1Main)),
    offset = durationOffset(header);
  header.set(durationBytes(800), offset);
  expect(new DataView(header.buffer).getFloat64(offset)).toBe(800);
  const done = jest.fn(),
    r = new StreamRecorder(() => {}, done, header.length + 2);
  r.frame(av1Main, 160, 96, av1MainKey, 0, true);
  r.consumed(1, true);
  expect(done).toHaveBeenCalledWith('limit', 0);
  expect(() => webmFrame(new Uint8Array(), 0, false)).toThrow();
});

test('已确认色彩格式变化停止录制，未知到已知不误判为切流', () => {
  const done = jest.fn(),
    record = new StreamRecorder(() => {}, done);
  record.frame(av1Main, 160, 96, av1MainKey, 0, true);
  record.frame(
    { ...av1Main, chroma: '4:2:0' },
    160,
    96,
    new Uint8Array([2]),
    200,
    false,
  );
  expect(done).not.toHaveBeenCalled();
  record.frame(
    { ...av1Main, chroma: '4:4:4' },
    160,
    96,
    new Uint8Array([3]),
    400,
    true,
  );
  record.consumed(1, true);
  record.consumed(2, true);
  record.consumed(3, true);
  expect(done).toHaveBeenCalledWith('changed', 400);
});

test('AV1录制包含实际profile/chroma的av1C，不允许未确认配置冒充可播放录制', () => {
  const format = {
    codec: 'av1' as const,
    profile: 1,
    chroma: '4:4:4' as const,
    bitDepth: 8,
    codecString: 'av01.1.00M.08.0.000.02.02.01.0',
  };
  const chunks: Uint8Array[] = [],
    done = jest.fn();
  const recorder = new StreamRecorder(
    (_sequence, bytes) => chunks.push(bytes),
    done,
  );
  recorder.frame(format, 64, 48, av1ColorKey, 0, true);
  const header = chunks[0];
  const privateIndex = header.findIndex(
    (byte, i) => byte === 0x63 && header[i + 1] === 0xa2,
  );
  expect(privateIndex).toBeGreaterThan(0);
  expect(header.slice(privateIndex + 2, privateIndex + 7)).toEqual(
    new Uint8Array([0x84, 0x81, 0x20, 0, 0]),
  );
  recorder.dispose();
  const unknown = new StreamRecorder(() => {}, done);
  unknown.frame({ codec: 'av1' }, 64, 48, new Uint8Array([1]), 0, true);
  expect(done).toHaveBeenLastCalledWith('failed', 0);
  expect(() => webmHeader('av1', 64, 48)).toThrow(
    'actual sequence configuration',
  );
});

test('AV1录制等真实随机访问首单元，后续缺序列头的native key不虚标容器key', () => {
  const chunks: Uint8Array[] = [],
    done = jest.fn();
  const recorder = new StreamRecorder(
    (_sequence, bytes) => chunks.push(bytes),
    done,
  );
  const noSequence = new Uint8Array([0x32, 1, 0x10]);
  recorder.frame(av1Main, 16, 16, noSequence, 0, true);
  expect(chunks).toHaveLength(0);
  recorder.frame(av1Main, 16, 16, av1MainKey, 100, true);
  recorder.consumed(1, true);
  recorder.consumed(2, true);
  recorder.frame(av1Main, 16, 16, noSequence, 200, true);
  const block = chunks.at(-1)!;
  const simpleBlock = block.findIndex(
    (byte, index) => byte === 0xa3 && block[index + 2] === 0x81,
  );
  expect(simpleBlock).toBeGreaterThan(0);
  expect(block[simpleBlock + 5] & 0x80).toBe(0);
  recorder.dispose();
});

test('无效首帧或文件头尺寸只结束录制，不向桌面路径抛异常', () => {
  const output = jest.fn(),
    done = jest.fn();
  const invalidFrame = new StreamRecorder(output, done);
  invalidFrame.frame({ codec: 'vp8' }, 160, 96, new Uint8Array(), 0, true);
  expect(output).not.toHaveBeenCalled();
  expect(done).toHaveBeenCalledWith('failed', 0);
  const invalidDimensions = new StreamRecorder(output, done);
  expect(() =>
    invalidDimensions.frame(
      { codec: 'vp8' },
      0,
      0,
      new Uint8Array([1]),
      0,
      true,
    ),
  ).not.toThrow();
  expect(done).toHaveBeenLastCalledWith('failed', 0);
});
test('Opus编码只保留两个未确认帧、发送完成才还credit、销毁丢弃迟到输出', async () => {
  let output:
    | ((c: { byteLength: number; copyTo(b: Uint8Array): void }) => void)
    | undefined;
  const encode = jest.fn(),
    close = jest.fn(),
    consumed = jest.fn(),
    error = jest.fn();
  const waits: ((ok: boolean) => void)[] = [];
  Object.assign(globalThis, {
    AudioEncoder: class {
      static async isConfigSupported() {
        return { supported: true };
      }
      state = 'configured';
      encodeQueueSize = 0;
      constructor(c: { output: typeof output }) {
        output = c.output;
      }
      configure() {}
      encode = encode;
      close = close;
    },
    AudioData: class {
      close() {}
    },
  });
  const encoder = new VoiceEncoder(
    () => new Promise((resolve) => waits.push(resolve)),
    consumed,
    error,
  );
  expect(await encoder.start()).toBe(true);
  encoder.encode(new Float32Array(960));
  encoder.encode(new Float32Array(960));
  encoder.encode(new Float32Array(960));
  expect(encode).toHaveBeenCalledTimes(2);
  expect(consumed).toHaveBeenCalledTimes(1);
  output?.({ byteLength: 2, copyTo: (b) => b.set([0xf8, 0]) });
  waits[0](true);
  await Promise.resolve();
  expect(consumed).toHaveBeenCalledTimes(2);
  encoder.dispose();
  output?.({ byteLength: 2, copyTo: () => {} });
  expect(waits).toHaveLength(1);
  expect(close).toHaveBeenCalled();
  expect(error).not.toHaveBeenCalled();
});
