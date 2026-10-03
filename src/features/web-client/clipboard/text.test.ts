/** @jest-environment node */

import { zstdCompressSync } from 'node:zlib';
import { expect, test } from '@jest/globals';
import {
  decodeText,
  decompressBounded,
  encodeText,
  MAX_TEXT_BYTES,
} from './text';

test('round-trips Unicode multiline text with and without native Zstandard compression', () => {
  const text = '中文与 English\n第二行\n';
  expect(decodeText(encodeText(text))).toBe(text);
  const compressed = new Uint8Array(zstdCompressSync(Buffer.from(text)));
  expect(decodeText({ compress: true, content: compressed })).toBe(text);
});
test('rejects oversized output before decompression and truncated/concatenated frames', () => {
  const oversized = new Uint8Array(
    zstdCompressSync(Buffer.alloc(MAX_TEXT_BYTES + 1)),
  );
  expect(() => decompressBounded(oversized)).toThrow('limit');
  const compressed = new Uint8Array(zstdCompressSync(Buffer.from('test')));
  expect(() => decompressBounded(compressed.slice(0, -1))).toThrow();
  expect(() =>
    decompressBounded(new Uint8Array([...compressed, ...compressed])),
  ).toThrow();
  expect(() => encodeText('中'.repeat(MAX_TEXT_BYTES / 2))).toThrow('limit');
});
test('does not interpret images as text and rejects invalid UTF-8', () => {
  expect(
    decodeText({ format: 22, content: new Uint8Array([255]) }),
  ).toBeUndefined();
  expect(() => decodeText({ content: new Uint8Array([255]) })).toThrow();
});
