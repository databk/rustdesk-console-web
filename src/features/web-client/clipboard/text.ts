import { Decompress } from 'fzstd';
import { hbb } from '../protocol';

export const MAX_TEXT_BYTES = 1024 * 1024;

// Validate allocation sizes before entering the decompressor, including its
// history window. Native clipboard/cursor messages contain one Zstandard frame.
export function decompressBounded(
  bytes: Uint8Array,
  limit = MAX_TEXT_BYTES,
): Uint8Array {
  if (
    bytes.length < 6 ||
    bytes.length > limit ||
    bytes[0] !== 0x28 ||
    bytes[1] !== 0xb5 ||
    bytes[2] !== 0x2f ||
    bytes[3] !== 0xfd
  )
    throw new Error('Unsupported compressed data');
  const descriptor = bytes[4];
  if (descriptor & 0x1b) throw new Error('Unsupported Zstandard header');
  const single = !!(descriptor & 0x20);
  const sizeFlag = descriptor >> 6;
  let offset = 5;
  let windowSize = 0;
  if (!single) {
    const window = bytes[offset++];
    const base = 2 ** (10 + (window >> 3));
    windowSize = base + (base / 8) * (window & 7);
  }
  const sizeBytes = sizeFlag ? 2 ** sizeFlag : single ? 1 : 0;
  if (!sizeBytes || offset + sizeBytes > bytes.length)
    throw new Error('Missing decompressed size');
  let length = 0n;
  for (let i = 0; i < sizeBytes; i++)
    length |= BigInt(bytes[offset++]) << BigInt(i * 8);
  if (sizeFlag === 1) length += 256n;
  if (length > BigInt(limit) || windowSize > limit)
    throw new Error('Text exceeds limit');
  let last = false;
  while (!last) {
    if (offset + 3 > bytes.length)
      throw new Error('Truncated compressed block');
    const block =
      bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
    offset += 3;
    last = !!(block & 1);
    const type = (block >> 1) & 3;
    if (type === 3) throw new Error('Invalid compressed block');
    offset += type === 1 ? 1 : block >> 3;
    if (offset > bytes.length) throw new Error('Truncated compressed data');
  }
  if (descriptor & 4) offset += 4;
  if (offset !== bytes.length)
    throw new Error('Multiple or truncated compressed frames');
  const result = new Uint8Array(Number(length));
  let written = 0;
  const decoder = new Decompress((chunk) => {
    if (written + chunk.length > result.length)
      throw new Error('Decompression exceeds declared size');
    result.set(chunk, written);
    written += chunk.length;
  });
  decoder.push(bytes, true);
  if (written !== result.length) throw new Error('Incomplete compressed text');
  return result;
}

export function encodeText(text: string): hbb.IClipboard {
  if (text.length > MAX_TEXT_BYTES) throw new Error('Text exceeds limit');
  const content = new TextEncoder().encode(text);
  if (content.length > MAX_TEXT_BYTES) throw new Error('Text exceeds limit');
  return { content, compress: false, format: hbb.ClipboardFormat.Text };
}

export function decodeText(clipboard: hbb.IClipboard): string | undefined {
  if ((clipboard.format || 0) !== hbb.ClipboardFormat.Text) return undefined;
  const input = clipboard.content || new Uint8Array();
  if (input.length > MAX_TEXT_BYTES) throw new Error('Text exceeds limit');
  const bytes = clipboard.compress ? decompressBounded(input) : input;
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
