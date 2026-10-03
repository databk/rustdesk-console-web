/** @jest-environment node */
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { VIDEO_LIMITS, Vp9Decoder } from './vp9-decoder';

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
  expect(jest.getTimerCount()).toBe(0);
});
test('excess queued decode work is rejected before more frames are submitted', () => {
  const { stream, error } = setup();
  decoder.decodeQueueSize = VIDEO_LIMITS.decodeQueue;
  stream.decode({ frames: [{ pts: 1, data: new Uint8Array([1]), key: true }] });
  expect(decoder.chunks).toHaveLength(0);
  expect(error).toHaveBeenCalledTimes(1);
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

test('oversized decoded frames are closed without ACK or Canvas publication', () => {
  const { stream, frame, ack, error } = setup();
  stream.decode({ frames: [{ pts: 1, data: new Uint8Array([1]), key: true }] });
  const closed = decoder.output(1000, 8192, 8192);
  expect(closed).toHaveBeenCalledTimes(1);
  expect(frame).not.toHaveBeenCalled();
  expect(ack).not.toHaveBeenCalled();
  expect(error).toHaveBeenCalledTimes(1);
  expect(decoder.state).toBe('closed');
  expect(jest.getTimerCount()).toBe(0);
});
