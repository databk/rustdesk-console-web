/** @jest-environment node */
import { expect, test } from '@jest/globals';
import { hbb } from '../protocol';
import { imagePixels, pngSize } from './image';

const png = () =>
  new Uint8Array(
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jH7kAAAAASUVORK5CYII=',
      'base64',
    ),
  );
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
