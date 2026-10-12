import type { VideoCodec } from './video-codecs';

const utf8 = (s: string) => new TextEncoder().encode(s);
function join(parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}
function id(value: number) {
  const parts: number[] = [];
  do {
    parts.unshift(value & 255);
    value = Math.floor(value / 256);
  } while (value);
  return new Uint8Array(parts);
}
function size(value: number) {
  for (let length = 1; length <= 6; length++) {
    if (value < 2 ** (7 * length) - 1) {
      const result = new Uint8Array(length);
      for (let i = length - 1; i >= 0; i--) {
        result[i] = value & 255;
        value = Math.floor(value / 256);
      }
      result[0] |= 1 << (8 - length);
      return result;
    }
  }
  throw new Error('WebM element too large');
}
function element(tag: number, payload: Uint8Array) {
  return join([id(tag), size(payload.length), payload]);
}
const uint = (tag: number, value: number) => element(tag, id(value));
const str = (tag: number, value: string) => element(tag, utf8(value));
const group = (tag: number, parts: Uint8Array[]) => element(tag, join(parts));

// 未知长度 Segment 支持流式保存。每帧独立 Cluster，使相对时间始终为0，停止无需重写文件头。
export function webmHeader(
  codec: VideoCodec,
  width: number,
  height: number,
  codecPrivate?: Uint8Array,
): Uint8Array {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width * height > 16_777_216
  )
    throw new Error('Invalid dimensions');
  if (codec === 'av1' && codecPrivate?.length !== 4)
    throw new Error('AV1 recording requires actual sequence configuration');
  const ebml = group(0x1a45dfa3, [
    uint(0x4286, 1),
    uint(0x42f7, 1),
    uint(0x42f2, 4),
    uint(0x42f3, 8),
    str(0x4282, 'webm'),
    uint(0x4287, 4),
    uint(0x4285, 2),
  ]);
  const info = group(0x1549a966, [
    uint(0x2ad7b1, 1_000_000),
    element(0x4489, new Uint8Array(8)),
    str(0x4d80, 'Console Web Client'),
    str(0x5741, 'Console Web Client'),
  ]);
  const track = [
    uint(0xd7, 1),
    uint(0x73c5, 1),
    uint(0x83, 1),
    uint(0x9c, 0),
    str(0x86, { vp8: 'V_VP8', vp9: 'V_VP9', av1: 'V_AV1' }[codec]),
    ...(codecPrivate ? [element(0x63a2, codecPrivate)] : []),
    group(0xe0, [uint(0xb0, width), uint(0xba, height)]),
  ];
  return join([
    ebml,
    id(0x18538067),
    new Uint8Array([1, 255, 255, 255, 255, 255, 255, 255]),
    info,
    group(0x1654ae6b, [group(0xae, track)]),
  ]);
}
export function durationOffset(header: Uint8Array) {
  for (let i = 0; i < Math.min(header.length - 10, 256); i++)
    if (header[i] === 0x44 && header[i + 1] === 0x89 && header[i + 2] === 0x88)
      return i + 3;
  throw new Error('Missing WebM duration');
}
export function durationBytes(duration: number) {
  if (!Number.isFinite(duration) || duration < 0)
    throw new Error('Invalid duration');
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setFloat64(0, duration, false);
  return bytes;
}
export function webmFrame(bytes: Uint8Array, timestamp: number, key: boolean) {
  if (
    !Number.isSafeInteger(timestamp) ||
    timestamp < 0 ||
    !bytes.length ||
    bytes.length > 2 * 1024 * 1024
  )
    throw new Error('Invalid recording frame');
  return group(0x1f43b675, [
    uint(0xe7, timestamp),
    element(0xa3, join([new Uint8Array([0x81, 0, 0, key ? 0x80 : 0]), bytes])),
  ]);
}
