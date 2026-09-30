import { hbb } from '../protocol';
import { decompressBounded } from './text';

export const IMAGE_LIMITS = {
  encoded: 4 * 1024 * 1024,
  pixels: 4 * 1024 * 1024,
  dimension: 4096,
};
function dimensions(width: number, height: number) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width > IMAGE_LIMITS.dimension ||
    height > IMAGE_LIMITS.dimension ||
    width * height > IMAGE_LIMITS.pixels
  )
    throw new Error('Image dimensions exceed limit');
  return { width, height };
}
export function pngSize(bytes: Uint8Array) {
  if (
    bytes.length < 33 ||
    bytes.length > IMAGE_LIMITS.encoded ||
    [137, 80, 78, 71, 13, 10, 26, 10].some(
      (value, index) => bytes[index] !== value,
    )
  )
    throw new Error('Invalid PNG');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(8) !== 13 || view.getUint32(12) !== 0x49484452)
    throw new Error('Invalid PNG header');
  const size = dimensions(view.getUint32(16), view.getUint32(20));
  let offset = 8;
  let ended = false;
  let imageData = false;
  let count = 0;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = view.getUint32(offset + 4);
    if (
      ++count > 1024 ||
      length > bytes.length - offset - 12 ||
      type === 0x6163544c ||
      [0x69434350, 0x7a545874, 0x69545874].includes(type) ||
      (offset > 8 && type === 0x49484452)
    )
      throw new Error('Invalid PNG chunks');
    if (type === 0x49444154) imageData = true;
    offset += length + 12;
    if (type === 0x49454e44) {
      if (length) throw new Error('Invalid PNG end');
      ended = true;
      break;
    }
  }
  if (!ended || !imageData || offset !== bytes.length)
    throw new Error('Incomplete PNG');
  return size;
}

// 原生 arboard::ImageData::rgba 使用逐行 RGBA 字节，不是 Windows DIB/BGRA。
export function imagePixels(clipboard: hbb.IClipboard) {
  const size = dimensions(clipboard.width || 0, clipboard.height || 0);
  const expected = size.width * size.height * 4;
  const bytes = clipboard.content || new Uint8Array();
  if (bytes.length > IMAGE_LIMITS.encoded && clipboard.compress)
    throw new Error('Compressed image exceeds limit');
  const rgba = clipboard.compress ? decompressBounded(bytes, expected) : bytes;
  if (rgba.length !== expected) throw new Error('Invalid RGBA length');
  return { ...size, rgba };
}
export async function clipboardPng(
  clipboard: hbb.IClipboard,
): Promise<Uint8Array> {
  let canvas: OffscreenCanvas;
  if (clipboard.format === hbb.ClipboardFormat.ImageRgba) {
    const { width, height, rgba } = imagePixels(clipboard);
    canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.putImageData(
      new ImageData(new Uint8ClampedArray(rgba), width, height),
      0,
      0,
    );
  } else if (clipboard.format === hbb.ClipboardFormat.ImagePng) {
    const input = clipboard.content || new Uint8Array();
    const bytes = clipboard.compress
      ? decompressBounded(input, IMAGE_LIMITS.encoded)
      : input;
    const { width, height } = pngSize(bytes);
    const bitmap = await createImageBitmap(
      new Blob([new Uint8Array(bytes)], { type: 'image/png' }),
    );
    try {
      if (bitmap.width !== width || bitmap.height !== height)
        throw new Error('PNG size mismatch');
      canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      context.drawImage(bitmap, 0, 0);
    } finally {
      bitmap.close();
    }
  } else throw new Error('Unsupported image format');
  try {
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    if (blob.size > IMAGE_LIMITS.encoded) throw new Error('PNG exceeds limit');
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    canvas.width = 1;
    canvas.height = 1;
  }
}
