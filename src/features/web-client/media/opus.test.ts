/** @jest-environment node */
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { OpusDecoder, opusDuration } from './opus';
import {
  AudioDiagnostics,
  audioErrorName,
  type AudioDiagnostic,
} from './audio-diagnostics';

const originalCodecs = {
  AudioDecoder: Reflect.get(globalThis, 'AudioDecoder'),
  EncodedAudioChunk: Reflect.get(globalThis, 'EncodedAudioChunk'),
};

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
  Object.assign(globalThis, originalCodecs);
});

type AudioData = {
  numberOfChannels: number;
  numberOfFrames: number;
  sampleRate: number;
  copyTo: (target: Float32Array) => void;
  close: () => void;
};
function pcm(overrides: Partial<AudioData> = {}): AudioData {
  return {
    numberOfChannels: 2,
    numberOfFrames: 480,
    sampleRate: 48000,
    copyTo: (target) => target.fill(0.1),
    close: jest.fn(),
    ...overrides,
  };
}
function mockCodecs(
  options: {
    supported?: boolean;
    supportError?: Error;
    createError?: Error;
    configureError?: Error;
    decodeError?: Error;
    chunkError?: Error;
    closeError?: Error;
  } = {},
) {
  const instances: MockDecoder[] = [];
  class MockDecoder {
    state = 'configured';
    decodeQueueSize = 0;
    chunks: unknown[] = [];
    close = jest.fn(() => {
      this.state = 'closed';
      if (options.closeError) throw options.closeError;
    });
    static async isConfigSupported() {
      if (options.supportError) throw options.supportError;
      return { supported: options.supported !== false };
    }
    constructor(
      public init: {
        output: (data: AudioData) => void;
        error: (error?: unknown) => void;
      },
    ) {
      if (options.createError) throw options.createError;
      instances.push(this);
    }
    configure() {
      if (options.configureError) throw options.configureError;
    }
    decode(chunk: unknown) {
      if (options.decodeError) throw options.decodeError;
      this.chunks.push(chunk);
      ++this.decodeQueueSize;
    }
    emit(data = pcm()) {
      this.decodeQueueSize = Math.max(0, this.decodeQueueSize - 1);
      this.init.output(data);
    }
  }
  Object.assign(globalThis, {
    AudioDecoder: MockDecoder,
    EncodedAudioChunk: class {
      constructor(init: object) {
        if (options.chunkError) throw options.chunkError;
        Object.assign(this, init);
      }
    },
  });
  return instances;
}

test('17包原生突发不永久停音，16包总预算和4个PCM credit有界', async () => {
  jest.spyOn(performance, 'now').mockReturnValue(0);
  const instances = mockCodecs();
  const error = jest.fn();
  const decoder = new OpusDecoder(jest.fn(), error);
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  const native = instances[0];
  for (let index = 0; index < 17; ++index) decoder.decode(new Uint8Array([0]));
  expect(native.chunks).toHaveLength(0);
  expect(decoder.metrics()).toMatchObject({
    receivedPackets: 17,
    receivedDurationUs: 170000,
    pendingPackets: 16,
    submittedPending: 0,
    maxBufferedPackets: 16,
    droppedPackets: 1,
    droppedPacketDurationUs: 10000,
  });
  jest.advanceTimersByTime(0);
  expect(native.chunks).toHaveLength(4);
  expect(native.chunks[0]).toEqual(
    expect.objectContaining({ timestamp: 10000 }),
  );
  expect(decoder.metrics()).toMatchObject({
    pendingPackets: 12,
    submittedPending: 4,
  });
  for (let batch = 0; batch < 4; ++batch) {
    for (let index = 0; index < 4; ++index) native.emit();
    expect(decoder.metrics()).toMatchObject({
      inFlight: 4,
      submittedPending: 0,
    });
    jest.advanceTimersByTime(0);
    expect(native.chunks).toHaveLength(4 * (batch + 1));
    for (let index = 0; index < 4; ++index) decoder.acknowledge();
    jest.advanceTimersByTime(0);
  }
  expect(error).not.toHaveBeenCalled();
  expect(native.close).not.toHaveBeenCalled();
  expect(decoder.metrics()).toMatchObject({
    maxDecodeQueue: 4,
    maxSubmittedPending: 4,
    maxInFlight: 4,
    maxBufferedPackets: 16,
    decodedPcm: 16,
    deliveredPcm: 16,
    pendingPackets: 0,
    submittedPending: 0,
    inFlight: 0,
    droppedPcm: 0,
  });
  decoder.decode(new Uint8Array([0]));
  jest.advanceTimersByTime(0);
  expect(native.chunks).toHaveLength(17);
  decoder.dispose();
});

test('未输出提交也占16包预算，满FIFO只丢待解码包，不撤销原生提交', async () => {
  jest.spyOn(performance, 'now').mockReturnValue(0);
  const instances = mockCodecs();
  const error = jest.fn();
  const decoder = new OpusDecoder(jest.fn(), error);
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  for (let index = 0; index < 4; ++index) decoder.decode(new Uint8Array([0]));
  jest.advanceTimersByTime(0);
  const native = instances[0];
  for (let index = 0; index < 17; ++index) decoder.decode(new Uint8Array([0]));
  jest.advanceTimersByTime(0);
  expect(native.chunks).toHaveLength(4);
  expect(decoder.metrics()).toMatchObject({
    receivedPackets: 21,
    submittedPending: 4,
    pendingPackets: 12,
    maxBufferedPackets: 16,
    droppedPackets: 5,
    droppedPacketDurationUs: 50000,
  });
  for (let index = 0; index < 4; ++index) native.emit();
  decoder.acknowledge();
  jest.advanceTimersByTime(0);
  expect(native.chunks).toHaveLength(5);
  expect(native.chunks[4]).toEqual(
    expect.objectContaining({ timestamp: 90000 }),
  );
  expect(decoder.metrics()).toMatchObject({
    submittedPending: 1,
    inFlight: 3,
    pendingPackets: 11,
    droppedPcm: 0,
  });
  expect(error).not.toHaveBeenCalled();
  expect(native.close).not.toHaveBeenCalled();
  decoder.dispose();
});

test('延迟ACK保留credit，后续ACK按空余credit恢复，不批量解码后丢PCM', async () => {
  jest.spyOn(performance, 'now').mockReturnValue(0);
  const instances = mockCodecs();
  const error = jest.fn();
  const result = jest.fn();
  const decoder = new OpusDecoder(result, error);
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  for (let index = 0; index < 8; ++index) decoder.decode(new Uint8Array([0]));
  jest.advanceTimersByTime(0);
  const native = instances[0];
  for (let index = 0; index < 4; ++index) native.emit();
  jest.advanceTimersByTime(0);
  expect(native.chunks).toHaveLength(4);
  expect(decoder.metrics()).toMatchObject({
    pendingPackets: 4,
    submittedPending: 0,
    inFlight: 4,
    droppedPcm: 0,
  });
  decoder.acknowledge();
  jest.advanceTimersByTime(0);
  expect(native.chunks).toHaveLength(5);
  expect(decoder.metrics()).toMatchObject({
    pendingPackets: 3,
    submittedPending: 1,
    inFlight: 3,
  });
  native.emit();
  expect(result).toHaveBeenCalledTimes(5);
  expect(decoder.metrics()).toMatchObject({ inFlight: 4, droppedPcm: 0 });
  expect(error).not.toHaveBeenCalled();
  decoder.dispose();
});

test('待解码过期包丢弃并保留TOC时间缺口，输入包独立复制', async () => {
  let now = 0;
  jest.spyOn(performance, 'now').mockImplementation(() => now);
  const instances = mockCodecs();
  const decoder = new OpusDecoder(jest.fn(), jest.fn());
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  const packet = new Uint8Array([0]);
  for (let index = 0; index < 6; ++index) decoder.decode(packet);
  packet[0] = 8;
  jest.advanceTimersByTime(0);
  const native = instances[0];
  expect(native.chunks[0]).toEqual(
    expect.objectContaining({
      duration: 10000,
      data: new Uint8Array([0]),
    }),
  );
  for (let index = 0; index < 4; ++index) native.emit();
  now = 350;
  decoder.acknowledge();
  jest.advanceTimersByTime(0);
  expect(native.chunks).toHaveLength(4);
  expect(decoder.metrics()).toMatchObject({
    pendingPackets: 0,
    droppedPackets: 2,
    droppedPacketDurationUs: 20000,
  });
  decoder.decode(new Uint8Array([0]));
  jest.advanceTimersByTime(0);
  expect(native.chunks[4]).toEqual(
    expect.objectContaining({ timestamp: 60000 }),
  );
  decoder.dispose();
});

test('dispose和configure清task/FIFO，旧输出和错误不会续泵或重开新声音', async () => {
  const instances = mockCodecs();
  const error = jest.fn();
  const decoder = new OpusDecoder(jest.fn(), error);
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  decoder.decode(new Uint8Array([0]));
  expect(jest.getTimerCount()).toBe(1);
  decoder.dispose();
  expect(jest.getTimerCount()).toBe(0);
  jest.advanceTimersByTime(0);
  expect(instances[0].chunks).toHaveLength(0);
  expect(decoder.metrics()).toMatchObject({
    pendingPackets: 0,
    submittedPending: 0,
  });

  await decoder.configure({ sampleRate: 48000, channels: 2 });
  decoder.decode(new Uint8Array([0]));
  await decoder.configure({ sampleRate: 24000, channels: 1 });
  instances[0].init.output(pcm());
  instances[1].init.output(pcm());
  instances[0].init.error(new Error('old'));
  decoder.acknowledge();
  jest.advanceTimersByTime(0);
  expect(instances[1].chunks).toHaveLength(0);
  expect(instances[2].chunks).toHaveLength(0);
  expect(error).not.toHaveBeenCalled();
  expect(decoder.metrics()).toMatchObject({
    pendingPackets: 0,
    submittedPending: 0,
    inFlight: 0,
    receivedPackets: 0,
  });
  decoder.dispose();
});

test('异步提交失败释放剩余FIFO与credit，旧任务不能提交新代包', async () => {
  jest.spyOn(performance, 'now').mockReturnValue(0);
  const instances = mockCodecs({
    decodeError: new DOMException('private', 'DataError'),
  });
  const error = jest.fn<(diagnostic: AudioDiagnostic) => void>();
  const decoder = new OpusDecoder(jest.fn(), error);
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  for (let index = 0; index < 6; ++index) decoder.decode(new Uint8Array([0]));
  expect(jest.getTimerCount()).toBe(1);
  jest.advanceTimersByTime(0);
  expect(error).toHaveBeenCalledTimes(1);
  expect(error).toHaveBeenCalledWith(
    expect.objectContaining({
      reason: 'decode-submit',
      pendingPackets: 5,
      submittedPending: 1,
    }),
  );
  const failedEpoch = error.mock.calls[0][0].decoderEpoch;
  expect(instances[0].close).toHaveBeenCalledTimes(1);
  expect(decoder.metrics()).toMatchObject({
    decoderEpoch: failedEpoch + 1,
    sampleRate: 0,
    channels: 0,
    receivedPackets: 0,
    submittedPackets: 0,
    pendingPackets: 0,
    submittedPending: 0,
    inFlight: 0,
  });
  expect(jest.getTimerCount()).toBe(0);

  const next = mockCodecs();
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  decoder.decode(new Uint8Array([8]));
  const stale = pcm();
  instances[0].emit(stale);
  instances[0].init.error(new Error('late'));
  expect(stale.close).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(1);
  jest.advanceTimersByTime(0);
  expect(next[0].chunks).toEqual([
    expect.objectContaining({ timestamp: 0, duration: 20000 }),
  ]);
  expect(error).toHaveBeenCalledTimes(1);
  decoder.dispose();
  expect(jest.getTimerCount()).toBe(0);
});

test('停止后的idle指标归属新epoch，旧包/PCM/ACK累计与峰值全部归零', async () => {
  jest.spyOn(performance, 'now').mockReturnValue(0);
  const instances = mockCodecs();
  const error = jest.fn();
  const decoder = new OpusDecoder(jest.fn(), error);
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  for (let index = 0; index < 17; ++index) decoder.decode(new Uint8Array([0]));
  jest.advanceTimersByTime(0);
  for (let index = 0; index < 4; ++index) instances[0].emit();
  decoder.acknowledge();
  const before = decoder.metrics();
  expect(before).toMatchObject({
    receivedPackets: 17,
    submittedPackets: 4,
    decodedPcm: 4,
    deliveredPcm: 4,
    acknowledgements: 1,
    maxBufferedPackets: 16,
    maxSubmittedPending: 4,
    maxInFlight: 4,
    droppedPackets: 1,
  });
  expect(jest.getTimerCount()).toBe(1);
  decoder.dispose();
  const { decoderEpoch, ...idle } = decoder.metrics();
  expect(decoderEpoch).toBe(before.decoderEpoch + 1);
  expect(Object.values(idle).every((value) => value === 0)).toBe(true);
  expect(jest.getTimerCount()).toBe(0);
  const stale = pcm();
  instances[0].emit(stale);
  instances[0].init.error(new Error('old'));
  decoder.acknowledge();
  jest.advanceTimersByTime(0);
  expect(stale.close).toHaveBeenCalledTimes(1);
  expect(decoder.metrics()).toEqual({ decoderEpoch, ...idle });
  expect(error).not.toHaveBeenCalled();
});

test('FIFO丢包后的混合TOC时长保持原时间轴，不按包数或固定10ms重计', async () => {
  jest.spyOn(performance, 'now').mockReturnValue(0);
  const instances = mockCodecs();
  const decoder = new OpusDecoder(jest.fn(), jest.fn());
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  for (const toc of [128, 8, 24, ...Array<number>(14).fill(0)])
    decoder.decode(new Uint8Array([toc]));
  expect(decoder.metrics()).toMatchObject({
    receivedPackets: 17,
    receivedDurationUs: 222500,
    droppedPackets: 1,
    droppedPacketDurationUs: 2500,
    maxBufferedPackets: 16,
  });
  jest.advanceTimersByTime(0);
  expect(instances[0].chunks).toEqual([
    expect.objectContaining({ timestamp: 2500, duration: 20000 }),
    expect.objectContaining({ timestamp: 22500, duration: 60000 }),
    expect.objectContaining({ timestamp: 82500, duration: 10000 }),
    expect.objectContaining({ timestamp: 92500, duration: 10000 }),
  ]);
  decoder.dispose();
  expect(jest.getTimerCount()).toBe(0);
});

test('PCM峰值、丢弃、ACK延迟分别记录，失败不保存采样', async () => {
  let time = 100;
  jest.spyOn(performance, 'now').mockImplementation(() => time);
  const instances = mockCodecs();
  const error = jest.fn<(diagnostic: AudioDiagnostic) => void>();
  const frames = jest.fn();
  const decoder = new OpusDecoder(frames, error);
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  const native = instances[0];
  for (let index = 0; index < 6; ++index) native.init.output(pcm());
  time = 175;
  decoder.acknowledge();
  native.init.output(pcm());
  time = 225;
  native.init.error(new DOMException('private PCM content', 'EncodingError'));
  const diagnostic = error.mock.calls[0][0];
  expect(diagnostic).toMatchObject({
    reason: 'decoder-error',
    errorName: 'EncodingError',
    decodedPcm: 7,
    decodedDurationUs: 70000,
    deliveredPcm: 5,
    droppedPcm: 2,
    inFlight: 4,
    maxInFlight: 4,
    acknowledgements: 1,
    maxAckDelayMs: 75,
    oldestInFlightMs: 125,
  });
  expect(frames).toHaveBeenCalledTimes(5);
  expect(JSON.stringify(diagnostic)).not.toMatch(
    /private|planes|stack|message/,
  );
  expect(
    Object.values(diagnostic).every((value) =>
      typeof value === 'number'
        ? Number.isFinite(value) && value >= 0
        : typeof value === 'string',
    ),
  ).toBe(true);
});

test.each([
  [{ supportError: new TypeError('private') }, 'support-probe', 'TypeError'],
  [{ supported: false }, 'unsupported-config', 'none'],
  [{ createError: new Error('private') }, 'decoder-create', 'Error'],
  [
    { configureError: new DOMException('private', 'NotSupportedError') },
    'decoder-configure',
    'NotSupportedError',
  ],
])('配置失败按实际阶段报告：%s', async (options, reason, errorName) => {
  mockCodecs(options);
  const error = jest.fn();
  const decoder = new OpusDecoder(jest.fn(), error);
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  expect(error).toHaveBeenCalledTimes(1);
  expect(error).toHaveBeenCalledWith(
    expect.objectContaining({ reason, errorName }),
  );
});

test('无效格式和缺失API分别报告', async () => {
  mockCodecs();
  const error = jest.fn();
  const decoder = new OpusDecoder(jest.fn(), error);
  await decoder.configure({ sampleRate: 44100, channels: 2 });
  expect(error).toHaveBeenLastCalledWith(
    expect.objectContaining({
      reason: 'invalid-format',
      sampleRate: 44100,
      channels: 2,
    }),
  );
  Object.assign(globalThis, { AudioDecoder: undefined });
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  expect(error).toHaveBeenLastCalledWith(
    expect.objectContaining({ reason: 'unavailable-api' }),
  );
});

test.each([
  [{ chunkError: new RangeError('private') }, 'chunk-create', 'RangeError'],
  [
    { decodeError: new DOMException('private', 'DataError') },
    'decode-submit',
    'DataError',
  ],
])('packet构造与提交失败分别报告：%s', async (options, reason, errorName) => {
  mockCodecs(options);
  const error = jest.fn();
  const decoder = new OpusDecoder(jest.fn(), error);
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  decoder.decode(new Uint8Array([8]));
  jest.advanceTimersByTime(0);
  expect(error).toHaveBeenCalledWith(
    expect.objectContaining({
      reason,
      errorName,
      receivedPackets: 1,
      submittedPackets: 0,
    }),
  );
});

test('无效Opus包、PCM格式和copy失败不会混成queue超限', async () => {
  const instances = mockCodecs();
  const error = jest.fn();
  const decoder = new OpusDecoder(jest.fn(), error);
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  decoder.decode(new Uint8Array());
  expect(error).toHaveBeenLastCalledWith(
    expect.objectContaining({
      reason: 'invalid-packet',
      maxDecodeQueue: 0,
    }),
  );
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  const invalid = pcm({ numberOfChannels: 3 });
  instances[1].init.output(invalid);
  expect(error).toHaveBeenLastCalledWith(
    expect.objectContaining({
      reason: 'invalid-pcm',
      lastPcmChannels: 3,
      decodedPcm: 0,
    }),
  );
  expect(invalid.close).toHaveBeenCalledTimes(1);
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  const broken = pcm({
    copyTo: () => {
      throw new TypeError('private');
    },
  });
  instances[2].init.output(broken);
  expect(error).toHaveBeenLastCalledWith(
    expect.objectContaining({ reason: 'pcm-copy' }),
  );
  expect(broken.close).toHaveBeenCalledTimes(1);
});

test('PCM交付与关闭异常分类，解码器清理错误不覆盖主因', async () => {
  const instances = mockCodecs({
    closeError: new DOMException('private', 'InvalidStateError'),
  });
  const error = jest.fn();
  const decoder = new OpusDecoder(() => {
    throw new TypeError('private');
  }, error);
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  instances[0].init.output(pcm());
  expect(error).toHaveBeenCalledWith(
    expect.objectContaining({
      reason: 'pcm-output',
      errorName: 'TypeError',
      cleanupErrorName: 'InvalidStateError',
    }),
  );
  expect(() => decoder.dispose()).not.toThrow();

  const normal = mockCodecs();
  const closing = new OpusDecoder(jest.fn(), error);
  await closing.configure({ sampleRate: 48000, channels: 2 });
  normal[0].init.output(
    pcm({
      close: () => {
        throw new Error('private');
      },
    }),
  );
  expect(error).toHaveBeenLastCalledWith(
    expect.objectContaining({ reason: 'pcm-close' }),
  );
});

test('重新配置清诊断周期，旧输出/错误不影响新解码器，空ACK无效', async () => {
  const instances = mockCodecs();
  const error = jest.fn();
  const frames = jest.fn();
  const decoder = new OpusDecoder(frames, error);
  await decoder.configure({ sampleRate: 48000, channels: 2 });
  instances[0].init.output(pcm());
  await decoder.configure({ sampleRate: 24000, channels: 1 });
  const old = pcm({
    close: () => {
      throw new Error('old');
    },
  });
  instances[0].init.output(old);
  instances[0].init.error(new Error('old'));
  decoder.acknowledge();
  expect(error).not.toHaveBeenCalled();
  expect(instances[1].close).not.toHaveBeenCalled();
  instances[1].init.error(new Error('current'));
  expect(error).toHaveBeenCalledWith(
    expect.objectContaining({
      reason: 'decoder-error',
      sampleRate: 24000,
      channels: 1,
      deliveredPcm: 0,
      maxInFlight: 0,
      acknowledgements: 0,
    }),
  );
  expect(frames).toHaveBeenCalledTimes(1);
});

test('诊断异常名仅白名单，数字有界且不持有输入对象', () => {
  const nameGetter = {
    get name() {
      throw new Error('private');
    },
  };
  expect(audioErrorName(nameGetter)).toBe('unknown');
  expect(audioErrorName({ name: 'secret-password' })).toBe('unknown');
  const diagnostic = new AudioDiagnostics(Infinity, NaN, -1, () => 10);
  diagnostic.queue(Infinity);
  diagnostic.packet(Number.MAX_SAFE_INTEGER * 2);
  diagnostic.duration(Number.MAX_SAFE_INTEGER * 2);
  diagnostic.pcm(NaN, Infinity, -1);
  const result = diagnostic.failure('decoder-error', {
    name: 'secret-password',
  });
  expect(result).toMatchObject({
    errorName: 'unknown',
    decoderEpoch: 0,
    sampleRate: 0,
    channels: 0,
    decodeQueue: 0,
    lastPacketBytes: Number.MAX_SAFE_INTEGER,
    lastPcmSamples: 0,
    lastPcmSampleRate: 0,
    lastPcmChannels: 0,
  });
  expect(JSON.stringify(result)).not.toContain('secret-password');
  expect(
    Object.values(result).every((value) =>
      typeof value === 'number'
        ? Number.isFinite(value) &&
          value >= 0 &&
          value <= Number.MAX_SAFE_INTEGER
        : true,
    ),
  ).toBe(true);
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
    jest.advanceTimersByTime(0);
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

test('非预期额外PCM仍有在途上限，解码队列满时等待消费而非永久停音', async () => {
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
    jest.advanceTimersByTime(0);
    expect(error).not.toHaveBeenCalled();
    expect(decoder.metrics()).toMatchObject({
      pendingPackets: 1,
      droppedPcm: 2,
    });
    decoder.dispose();
  } finally {
    Object.assign(globalThis, original);
  }
});
