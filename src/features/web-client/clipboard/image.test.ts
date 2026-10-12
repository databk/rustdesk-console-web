/** @jest-environment node */
import { expect, jest, test } from '@jest/globals';
import { hbb } from '../protocol';
import { imagePacketFits, imagePixels, pngClipboard, pngSize } from './image';

const png = () =>
  new Uint8Array(
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jH7kAAAAASUVORK5CYII=',
      'base64',
    ),
  );
test('出站RGBA精确计入protobuf与密文tag，1080p可发、越界在解码前拒绝', async () => {
  const fits = {
    format: hbb.ClipboardFormat.ImageRgba,
    width: 1920,
    height: 1080,
    content: new Uint8Array(1920 * 1080 * 4),
  };
  expect(imagePacketFits(fits)).toBe(true);
  expect(
    imagePacketFits({
      ...fits,
      width: 2048,
      height: 1024,
      content: new Uint8Array(2048 * 1024 * 4),
    }),
  ).toBe(false);
  const big = png();
  new DataView(big.buffer).setUint32(16, 2048);
  new DataView(big.buffer).setUint32(20, 1024);
  const old = globalThis.createImageBitmap;
  const bitmap = jest.fn<typeof createImageBitmap>();
  Object.assign(globalThis, { createImageBitmap: bitmap });
  try {
    await expect(pngClipboard(big)).rejects.toThrow('packet');
    expect(bitmap).not.toHaveBeenCalled();
  } finally {
    Object.assign(globalThis, { createImageBitmap: old });
  }
});
test('PNG 编码上限、尺寸、截断和尾随内容在解码前拒绝', () => {
  expect(pngSize(png())).toEqual({ width: 1, height: 1 });
  const huge = png();
  new DataView(huge.buffer).setUint32(16, 0x7fffffff);
  expect(() => pngSize(huge)).toThrow();
  expect(() => pngSize(png().slice(0, -1))).toThrow();
  expect(() => pngSize(new Uint8Array([...png(), 0]))).toThrow();
  expect(() => pngSize(new Uint8Array(5 * 1024 * 1024))).toThrow();
});
test('RGBA 保留像素顺序并拒绝尺寸不符和压缩炸弹', () => {
  const content = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 128]);
  const image = {
    content,
    format: hbb.ClipboardFormat.ImageRgba,
    width: 2,
    height: 1,
  };
  expect(imagePixels(image).rgba).toEqual(content);
  expect(() => imagePixels({ ...image, height: 2 })).toThrow();
  expect(() => imagePixels({ ...image, width: -1 })).toThrow();
  expect(() =>
    imagePixels({
      ...image,
      compress: true,
      content: new Uint8Array([
        0x28, 0xb5, 0x2f, 0xfd, 0xa0, 255, 255, 255, 127,
      ]),
    }),
  ).toThrow();
});
