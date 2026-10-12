/** @jest-environment node */
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import {
  VIDEO_LIMITS,
  videoFailureDiagnostic,
  Vp9Decoder,
} from './vp9-decoder';

let decoder: FakeDecoder;
class FakeDecoder {
  static isConfigSupported = async () => ({ supported: true });
  state = 'configured';
  decodeQueueSize = 0;
  chunks: EncodedVideoChunkInit[] = [];
  constructor(readonly callbacks: VideoDecoderInit) {
    decoder = this;
  }
  configure() {}
  decode(chunk: EncodedVideoChunkInit) {
    this.chunks.push(chunk);
  }
  close() {
    this.state = 'closed';
  }
  output(timestamp: number, width = 1920, height = 1080) {
    const close = jest.fn();
    this.callbacks.output({
      timestamp,
      close,
      codedWidth: width,
      codedHeight: height,
      displayWidth: width,
      displayHeight: height,
    } as unknown as VideoFrame);
    return close;
  }
}
beforeEach(() => {
  jest.useFakeTimers();
  Object.assign(globalThis, {
    VideoDecoder: FakeDecoder,
    EncodedVideoChunk: class {
      constructor(value: EncodedVideoChunkInit) {
        Object.assign(this, value);
      }
    },
  });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('能力探测成功但实际configure失败时关闭已创建的解码器', () => {
  jest.spyOn(FakeDecoder.prototype, 'configure').mockImplementationOnce(() => {
    throw new Error('Decoder unavailable');
  });
  expect(() => setup()).toThrow('Decoder unavailable');
  expect(decoder.state).toBe('closed');
  expect(jest.getTimerCount()).toBe(0);
});
function setup() {
  const frame = jest.fn<(frame: VideoFrame) => void>();
  const ack = jest.fn();
  const error = jest.fn();
  const stream = new Vp9Decoder(frame, ack, error);
  return { stream, frame, ack, error };
}
test('native millisecond PTS becomes microseconds and ACK follows decoded batch output', () => {
  const { stream, frame, ack, error } = setup();
  stream.decode({
    frames: [
      { pts: 12, data: new Uint8Array([1]), key: true },
      { pts: 13, data: new Uint8Array([2]) },
    ],
  });
  expect(decoder.chunks.map((c) => c.timestamp)).toEqual([12000, 13000]);
  decoder.output(12000);
  expect(ack).not.toHaveBeenCalled();
  decoder.output(13000);
  expect(ack).toHaveBeenCalledTimes(1);
  expect(frame).toHaveBeenCalledTimes(2);
  expect(error).not.toHaveBeenCalled();
  stream.dispose();
  expect(jest.getTimerCount()).toBe(0);
});
test('decoder starts only on a key frame and fails closed on a stalled batch', () => {
  const first = setup();
  first.stream.decode({ frames: [{ pts: 1, data: new Uint8Array([1]) }] });
  expect(first.error).toHaveBeenCalledTimes(1);
  expect(decoder.state).toBe('closed');
  const second = setup();
  second.stream.decode({
    frames: [{ pts: 1, data: new Uint8Array([1]), key: true }],
  });
  jest.advanceTimersByTime(VIDEO_LIMITS.timeoutMs);
  expect(second.error).toHaveBeenCalledTimes(1);
  expect(second.error).toHaveBeenCalledWith(
    expect.objectContaining({
      reason: 'batch-timeout',
      decodeQueue: 0,
      pendingBatches: 1,
      submittedFrames: 1,
      batchFrames: 1,
      submittedTotal: 1,
      outputFrames: 0,
    }),
  );
  expect(jest.getTimerCount()).toBe(0);
});
test('excess queued decode work is rejected before more frames are submitted', () => {
  const { stream, error } = setup();
  decoder.decodeQueueSize = VIDEO_LIMITS.decodeQueue;
  stream.decode({ frames: [{ pts: 1, data: new Uint8Array([1]), key: true }] });
  expect(decoder.chunks).toHaveLength(0);
  expect(error).toHaveBeenCalledTimes(1);
  expect(error).toHaveBeenCalledWith(
    expect.objectContaining({
      reason: 'decode-queue-limit',
      decodeQueue: VIDEO_LIMITS.decodeQueue,
      pendingBatches: 0,
      submittedFrames: 0,
      batchFrames: 1,
    }),
  );
});
test('disposed streams close late frames and never ACK or paint them', () => {
  const { stream, ack, frame } = setup();
  stream.decode({ frames: [{ pts: 1, data: new Uint8Array([1]), key: true }] });
  stream.dispose();
  stream.dispose();
  expect(decoder.output(1000)).toHaveBeenCalledTimes(1);
  expect(ack).not.toHaveBeenCalled();
  expect(frame).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});

test('an ACK that closes the stream cannot publish the decoded frame afterward', () => {
  const { stream, frame, ack } = setup();
  ack.mockImplementation(() => stream.dispose());
  stream.decode({ frames: [{ pts: 1, data: new Uint8Array([1]), key: true }] });
  expect(decoder.output(1000)).toHaveBeenCalledTimes(1);
  expect(ack).toHaveBeenCalledTimes(1);
  expect(frame).not.toHaveBeenCalled();
  expect(decoder.state).toBe('closed');
  expect(jest.getTimerCount()).toBe(0);
});

test('oversized decoded frames close the chain before finite discard ACKs without Canvas publication', () => {
  const { stream, frame, ack, error } = setup();
  stream.decode({ frames: [{ pts: 1, data: new Uint8Array([1]), key: true }] });
  const closed = decoder.output(1000, 8192, 8192);
  expect(closed).toHaveBeenCalledTimes(1);
  expect(frame).not.toHaveBeenCalled();
  expect(ack).toHaveBeenCalledTimes(1);
  expect(error).toHaveBeenCalledTimes(1);
  expect(decoder.state).toBe('closed');
  expect(jest.getTimerCount()).toBe(0);
});

test('失败先关闭完整依赖链，再有限确认废弃batch，迟到错误或输出不重复确认', () => {
  const { stream, frame, ack, error } = setup();
  const acknowledgedStates: string[] = [];
  ack.mockImplementation(() => acknowledgedStates.push(decoder.state));
  stream.decode({ frames: [{ pts: 1, data: new Uint8Array([1]), key: true }] });
  stream.decode({ frames: [{ pts: 2, data: new Uint8Array([2]) }] });
  decoder.callbacks.error(new DOMException('Decode failed', 'EncodingError'));
  expect(ack).toHaveBeenCalledTimes(2);
  expect(acknowledgedStates).toEqual(['closed', 'closed']);
  expect(error).toHaveBeenCalledTimes(1);
  expect(stream.metrics()).toMatchObject({
    pendingBatches: 0,
    decodeQueue: 0,
    decodeLatencyMs: undefined,
    ackLatencyMs: undefined,
  });
  expect(error).toHaveBeenCalledWith(
    expect.objectContaining({
      reason: 'decoder-error',
      errorName: 'EncodingError',
      pendingBatches: 2,
      submittedFrames: 2,
      receivedBatches: 2,
      submittedTotal: 2,
      lastBatchTimestampUs: 2000,
      outputFrames: 0,
    }),
  );
  expect(JSON.stringify(error.mock.calls)).not.toContain('Decode failed');
  decoder.callbacks.error(new DOMException('Late error', 'EncodingError'));
  expect(decoder.output(2000)).toHaveBeenCalledTimes(1);
  expect(ack).toHaveBeenCalledTimes(2);
  expect(error).toHaveBeenCalledTimes(1);
  expect(frame).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});

test('校验失败的未登记新batch也只确认一次，主动dispose不伪造确认', () => {
  const { stream, ack, error } = setup();
  stream.decode({ frames: [{ pts: 1, data: new Uint8Array([1]), key: true }] });
  expect(
    stream.decode({ frames: [{ pts: Infinity, data: new Uint8Array([2]) }] }),
  ).toBe(false);
  expect(ack).toHaveBeenCalledTimes(2);
  expect(error).toHaveBeenCalledTimes(1);
  stream.dispose();
  expect(ack).toHaveBeenCalledTimes(2);
  expect(decoder.chunks).toHaveLength(1);
  expect(jest.getTimerCount()).toBe(0);
});

test('本地解码和batch确认耗时独立计量，不依赖远端PTS模拟RTT', () => {
  let now = 100;
  jest.spyOn(performance, 'now').mockImplementation(() => now);
  const { stream } = setup();
  stream.decode({
    frames: [
      { pts: 50000, data: new Uint8Array([1]), key: true },
      { pts: 50010, data: new Uint8Array([1]) },
    ],
  });
  now = 110;
  decoder.output(50000000);
  now = 120;
  decoder.output(50010000);
  expect(stream.metrics()).toMatchObject({
    decodeQueue: 0,
    pendingBatches: 0,
    decodeLatencyMs: 15,
    ackLatencyMs: 20,
  });
  stream.dispose();
});

test('饱和时关闭完整依赖链，有限ACK后请求新关键帧，旧输出不复活', () => {
  const frame = jest.fn(),
    ack = jest.fn(),
    error = jest.fn(),
    recover = jest.fn();
  const stream = new Vp9Decoder(frame, ack, error, undefined, recover);
  stream.decode({ frames: [{ pts: 0, data: new Uint8Array([1]), key: true }] });
  decoder.decodeQueueSize = VIDEO_LIMITS.decodeQueue;
  expect(
    stream.decode({ frames: [{ pts: 1, data: new Uint8Array([2]) }] }),
  ).toBe(false);
  expect(decoder.state).toBe('closed');
  expect(ack).toHaveBeenCalledTimes(2);
  expect(recover).toHaveBeenCalledTimes(1);
  expect(error).not.toHaveBeenCalled();
  expect(decoder.chunks).toHaveLength(1);
  expect(decoder.output(0)).toHaveBeenCalledTimes(1);
  expect(frame).not.toHaveBeenCalled();
  expect(
    stream.decode({ frames: [{ pts: 2, data: new Uint8Array([3]) }] }),
  ).toBe(false);
  expect(jest.getTimerCount()).toBe(0);
});

test('即使WebCodecs入队数为零，在途帧时间表也严格有界', () => {
  const { stream, error } = setup();
  for (let batch = 0; batch < VIDEO_LIMITS.batches; ++batch)
    stream.decode({
      frames: Array.from({ length: 4 }, (_, i) => ({
        pts: batch * 4 + i,
        data: new Uint8Array([1]),
        key: batch === 0 && i === 0,
      })),
    });
  expect(decoder.chunks).toHaveLength(VIDEO_LIMITS.decodeQueue);
  expect(
    stream.decode({ frames: [{ pts: 40, data: new Uint8Array([1]) }] }),
  ).toBe(false);
  expect(error).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});

test.each([
  { reason: 'pending-batch-limit', batches: 8, frames: 1, submitted: 8 },
  { reason: 'submitted-frame-limit', batches: 2, frames: 16, submitted: 32 },
])(
  'WebCodecs队列为零也保留$reason失败前计数，清理不覆盖快照',
  ({ reason, batches, frames, submitted }) => {
    let now = 100;
    jest.spyOn(performance, 'now').mockImplementation(() => now);
    const ack = jest.fn(),
      recover = jest.fn(),
      error = jest.fn();
    const stream = new Vp9Decoder(jest.fn(), ack, error, undefined, recover);
    for (let batch = 0; batch < batches; ++batch)
      stream.decode({
        frames: Array.from({ length: frames }, (_, i) => ({
          pts: batch * frames + i,
          key: batch === 0 && i === 0,
          data: new Uint8Array([1]),
        })),
      });
    now = 120;
    expect(
      stream.decode({ frames: [{ pts: 40, data: new Uint8Array([1]) }] }),
    ).toBe(false);
    expect(recover).toHaveBeenCalledWith(
      expect.objectContaining({
        reason,
        decodeQueue: 0,
        pendingBatches: batches,
        submittedFrames: submitted,
        batchFrames: 1,
        receivedBatches: batches + 1,
        submittedTotal: submitted,
        outputFrames: 0,
        matchedOutputs: 0,
        lastBatchTimestampUs: 40000,
        oldestPendingMs: 20,
        oldestSubmittedMs: 20,
      }),
    );
    expect(stream.metrics()).toMatchObject({
      pendingBatches: 0,
      decodeQueue: 0,
    });
    expect(ack).toHaveBeenCalledTimes(batches + 1);
    expect(error).not.toHaveBeenCalled();
    const failure = recover.mock.calls[0][0];
    decoder.callbacks.error(
      new DOMException('late private detail', 'EncodingError'),
    );
    decoder.output(40000);
    expect(recover).toHaveBeenCalledTimes(1);
    expect(recover.mock.calls[0][0]).toEqual(failure);
    expect(jest.getTimerCount()).toBe(0);
  },
);

test('decode提交异常保留已入队的边界并只发固定异常类别', () => {
  const { stream, error, ack } = setup();
  jest.spyOn(FakeDecoder.prototype, 'decode').mockImplementationOnce(() => {
    throw new DOMException('private encoded content', 'InvalidStateError');
  });
  expect(
    stream.decode({
      frames: [{ pts: 12, key: true, data: new Uint8Array([99]) }],
    }),
  ).toBe(false);
  expect(error).toHaveBeenCalledWith(
    expect.objectContaining({
      reason: 'decode-submit',
      errorName: 'InvalidStateError',
      pendingBatches: 1,
      submittedFrames: 1,
      batchFrames: 1,
      submittedTotal: 0,
      lastBatchTimestampUs: 12000,
    }),
  );
  expect(ack).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(error.mock.calls)).not.toContain(
    'private encoded content',
  );
});

test('失败诊断字段非负有限，自定义异常name/正文及抛错getter不透出', () => {
  const diagnostic = videoFailureDiagnostic(
    'decoder-error',
    { name: 'private content', message: 'secret' },
    {
      decodeQueue: Infinity,
      pendingBatches: -1,
      oldestPendingMs: NaN,
      submittedFrames: Number.MAX_VALUE,
    },
  );
  expect(diagnostic).toMatchObject({
    errorName: 'unknown',
    decodeQueue: 0,
    pendingBatches: 0,
    oldestPendingMs: 0,
    submittedFrames: Number.MAX_SAFE_INTEGER,
  });
  for (const [key, value] of Object.entries(diagnostic))
    if (key !== 'reason' && key !== 'errorName') {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
    }
  expect(JSON.stringify(diagnostic)).not.toContain('private');
  expect(JSON.stringify(diagnostic)).not.toContain('secret');
  expect(
    videoFailureDiagnostic('decoder-initialize', {
      get name() {
        throw new Error('private');
      },
    }).errorName,
  ).toBe('unknown');
});
