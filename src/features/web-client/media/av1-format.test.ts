/** @jest-environment node */
import { expect, test } from '@jest/globals';
import { av1Format, av1CodecPrivate, av1RandomAccess } from './av1-format';
import { decoderConfig, VIDEO_CONFIGS } from './video-codecs';

// FFmpeg/libaom，64×48、4帧、profile1/yuv444p，2026-10-10。
// 只存实际Sequence Header及delimiter；完整样本由主控独立WebCodecs验证。
const actual444 = new Uint8Array([
  0x12, 0, 0x0a, 13, 32, 0, 0, 2, 175, 247, 155, 95, 52, 8, 8, 4, 64,
]);
const caps = { vp9: true, vp8: true, av1: true, vp9_444: true, av1_444: true };

test('实际AOM序列头给出profile1/8bit/444及全部实际codec参数', () => {
  const format = av1Format(actual444);
  expect(format).toMatchObject({
    codec: 'av1',
    profile: 1,
    bitDepth: 8,
    chroma: '4:4:4',
  });
  expect(format?.codecString).toBe('av01.1.00M.08.0.000.02.02.01.0');
  expect(decoderConfig(format!, caps)?.codec).toBe(format?.codecString);
  expect(av1CodecPrivate(format!)).toEqual(new Uint8Array([0x81, 0x20, 0, 0]));
  expect(VIDEO_CONFIGS.av1_444.codec).toBe('av01.1.08M.08.0.000.01.01.01.0');
  expect(decoderConfig(format!, { ...caps, av1_444: false })).toBeUndefined();
});

// reduced-still 序列头遵守AV1 §5.5；尺寸16×16，无其它处理工具。
function stillHeader(profile: number, high = false, mono = false, rgb = false) {
  const f = (value: number, n: number) => value.toString(2).padStart(n, '0');
  let bits =
    f(profile, 3) +
    '11' +
    '00000' +
    '0011' +
    '0011' +
    '1111' +
    '1111' +
    '000' +
    '000';
  bits += high ? '1' : '0';
  if (profile !== 1) bits += mono ? '1' : '0';
  bits += rgb ? '1' + f(1, 8) + f(13, 8) + f(0, 8) : '0';
  if (mono) bits += '0';
  else {
    if (!rgb) bits += '0' + (profile === 0 ? '00' : '');
    bits += '0'; // separate_uv_delta_q
  }
  bits += '01'; // film grain + trailing_one_bit
  bits = bits.padEnd(Math.ceil(bits.length / 8) * 8, '0');
  const payload = Array.from({ length: bits.length / 8 }, (_, i) =>
    parseInt(bits.slice(i * 8, i * 8 + 8), 2),
  );
  return new Uint8Array([0x0a, payload.length, ...payload]);
}

test('profile0/420、RGB444、10bit资格与单色明确区分，不能从菜单推断', () => {
  expect(av1Format(stillHeader(0))).toMatchObject({
    profile: 0,
    bitDepth: 8,
    chroma: '4:2:0',
    codecString: 'av01.0.00M.08.0.110.02.02.02.0',
  });
  expect(av1CodecPrivate(av1Format(stillHeader(0))!)).toEqual(
    new Uint8Array([0x81, 0, 12, 0]),
  );
  expect(av1Format(stillHeader(1, false, false, true))).toMatchObject({
    profile: 1,
    chroma: '4:4:4',
    codecString: 'av01.1.00M.08.0.000.01.13.00.1',
  });
  const ten = av1Format(stillHeader(1, true));
  expect(ten?.bitDepth).toBe(10);
  expect(decoderConfig(ten!, caps)).toBeUndefined();
  expect(av1Format(stillHeader(0, false, true))).toBeUndefined();
});

test('有界OBU解析拒绝截断/forbidden/reserved/超长LEB/头负载与伪造帧内序列头', () => {
  for (let end = 0; end < actual444.length; ++end)
    expect(av1Format(actual444.slice(0, end))).toBeUndefined();
  for (const input of [
    new Uint8Array([0x8a, 0]),
    new Uint8Array([0x0b, 0]),
    new Uint8Array([0x0e, 1, 1, 0]), // reserved extension bits
    new Uint8Array([0x0a, ...new Array(8).fill(0x80)]),
    new Uint8Array([0x0a, 0xff, 0x0f, ...new Array(2047).fill(0)]),
    new Uint8Array([0x32, 1, 0, ...actual444]),
    new Uint8Array([...new Array(65).fill([0x12, 0]).flat(), ...actual444]),
  ])
    expect(av1Format(input)).toBeUndefined();
  const noSize = new Uint8Array([0x08, ...actual444.slice(4)]);
  expect(av1Format(noSize)?.chroma).toBe('4:4:4');
});

test('容器key资格要求序列头+FrameOBU实际KEY_FRAME/show_frame，拒绝仅native布尔', () => {
  const key = new Uint8Array([...actual444, 0x32, 1, 0x10]);
  expect(av1RandomAccess(key)?.chroma).toBe('4:4:4');
  expect(av1RandomAccess(actual444)).toBeUndefined();
  expect(av1RandomAccess(new Uint8Array([0x32, 1, 0x10]))).toBeUndefined();
  for (const frameHeader of [0x80, 0x30, 0])
    expect(
      av1RandomAccess(new Uint8Array([...actual444, 0x32, 1, frameHeader])),
    ).toBeUndefined();
  expect(
    av1RandomAccess(new Uint8Array([...stillHeader(0), 0x32, 1, 0]))?.profile,
  ).toBe(0);
});
