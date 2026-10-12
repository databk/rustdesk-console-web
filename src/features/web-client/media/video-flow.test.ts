/** @jest-environment node */
import { afterEach, expect, jest, test } from '@jest/globals';
import { StreamRecorder } from './recorder';
import { VIDEO_LIMITS, Vp9Decoder } from './vp9-decoder';

// 同一持续变化帧序列+可控单向网络/解码时间。使用真实有界decoder/recorder逻辑，
// VideoDecoder和网络是模型，不是原生性能验收，也不证明实际codec处理时间。
async function motionFlow(ackRequired: boolean, decodeMs: number, fps = 30) {
  jest.useFakeTimers();
  let closed = 0,
    received = 0,
    decoded = 0,
    recovery = 0,
    maxQueue = 0;
  let maxBatches = 0,
    consumedBatches = 0,
    wireAcknowledgements = 0;
  let freshKey = true,
    ended = false,
    stream: Vp9Decoder | undefined;
  let record: StreamRecorder;
  const recordReasons: string[] = [];
  const oneWay = 150;
  class ModelDecoder {
    state = 'configured';
    decodeQueueSize = 0;
    private finish = performance.now();
    constructor(private callbacks: VideoDecoderInit) {}
    configure() {}
    close() {
      this.state = 'closed';
    }
    decode(chunk: EncodedVideoChunkInit) {
      ++this.decodeQueueSize;
      maxQueue = Math.max(maxQueue, this.decodeQueueSize);
      this.finish = Math.max(this.finish, performance.now()) + decodeMs;
      setTimeout(() => {
        --this.decodeQueueSize;
        this.callbacks.output({
          timestamp: chunk.timestamp,
          codedWidth: 64,
          codedHeight: 48,
          displayWidth: 64,
          displayHeight: 48,
          close: () => {
            ++closed;
          },
        } as VideoFrame);
      }, this.finish - performance.now());
    }
  }
  const saved = {
    VideoDecoder: globalThis.VideoDecoder,
    EncodedVideoChunk: globalThis.EncodedVideoChunk,
  };
  Object.assign(globalThis, {
    VideoDecoder: ModelDecoder,
    EncodedVideoChunk: class {
      constructor(value: EncodedVideoChunkInit) {
        Object.assign(this, value);
      }
    },
  });
  let frameNumber = 0;
  const send = () => {
    if (ended) return;
    const number = frameNumber++;
    const pts = (number * 1000) / fps;
    const key = freshKey || frameNumber % 10 === 0;
    freshKey = false;
    setTimeout(() => {
      if (ended) return;
      ++received;
      if (!stream && !key) {
        acknowledge();
        return;
      }
      if (!stream)
        stream = new Vp9Decoder(
          (frame) => {
            ++decoded;
            frame.close();
          },
          acknowledge,
          () => {
            ended = true;
          },
          undefined,
          () => {
            stream = undefined;
            ++recovery;
            freshKey = true;
            record.stop('changed');
          },
        );
      const bytes = new Uint8Array([number & 255]);
      record.frame({ codec: 'vp8' }, 64, 48, bytes, Math.round(pts), key);
      stream.decode({ frames: [{ pts: Math.round(pts), key, data: bytes }] });
      maxBatches = Math.max(maxBatches, stream?.metrics().pendingBatches ?? 0);
    }, oneWay);
    if (!ackRequired) setTimeout(send, 1000 / fps);
  };
  const acknowledge = () => {
    ++consumedBatches;
    if (ackRequired && !ended) {
      ++wireAcknowledgements;
      setTimeout(send, oneWay);
    }
  };
  record = new StreamRecorder(
    (sequence) => record.consumed(sequence, true),
    (reason) => recordReasons.push(reason),
  );
  try {
    send();
    await jest.advanceTimersByTimeAsync(2400);
    ended = true;
    stream?.dispose();
    record.stop('user');
    await jest.runAllTimersAsync();
    return {
      received,
      decoded,
      recovery,
      maxQueue,
      maxBatches,
      consumedBatches,
      wireAcknowledgements,
      closed,
      recordReasons,
    };
  } finally {
    ended = true;
    stream?.dispose();
    record.dispose();
    jest.clearAllTimers();
    Object.assign(globalThis, saved);
    jest.useRealTimers();
  }
}
afterEach(() => {
  jest.useRealTimers();
});

test('同一运动模型下逐帧往返限制与原生stream候选可复核，队列保持有界', async () => {
  const acknowledged = await motionFlow(true, 5);
  const streaming = await motionFlow(false, 5);
  expect(acknowledged.decoded).toBeGreaterThan(3);
  expect(acknowledged.decoded).toBeLessThan(10);
  expect(streaming.decoded).toBeGreaterThan(50);
  expect(streaming.decoded).toBeGreaterThan(acknowledged.decoded * 5);
  expect(streaming.recovery).toBe(0);
  expect(streaming.maxQueue).toBeLessThanOrEqual(VIDEO_LIMITS.decodeQueue);
  expect(streaming.maxBatches).toBeLessThanOrEqual(VIDEO_LIMITS.batches);
  expect(streaming.consumedBatches).toBe(streaming.decoded);
  expect(streaming.wireAcknowledgements).toBe(0);
  expect(acknowledged.wireAcknowledgements).toBe(acknowledged.decoded);
  expect(streaming.recordReasons).toEqual(['user']);
});

test('候选在持续慢解码时有限恢复依赖链并结束录制，不能无限积压或跳过delta继续', async () => {
  const slow = await motionFlow(false, 80, 120);
  expect(slow.recovery).toBeGreaterThan(0);
  expect(slow.maxQueue).toBeLessThanOrEqual(VIDEO_LIMITS.decodeQueue);
  expect(slow.maxBatches).toBeLessThanOrEqual(VIDEO_LIMITS.batches);
  expect(slow.wireAcknowledgements).toBe(0);
  expect(slow.recordReasons).toEqual(['changed']);
  expect(slow.closed).toBeGreaterThanOrEqual(slow.decoded);
});
