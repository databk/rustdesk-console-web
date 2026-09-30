/** @jest-environment node */
import { expect, test } from '@jest/globals';
import { DISPLAY_LIMITS, validDisplay, validFrameSize } from './display';

test('accepts tested 4K frames and signed monitor origins within allocation bounds', () => {
  expect(validFrameSize(3840, 2160)).toBe(true);
  expect(validDisplay({ width: 3840, height: 2160, x: -3840, y: 0 })).toBe(
    true,
  );
  expect(validFrameSize(7680, 4320)).toBe(true);
});

test('rejects missing, fractional, oversized and overflowing remote geometry', () => {
  for (const [width, height] of [
    [0, 1080],
    [-1, 1080],
    [1.5, 1080],
    [NaN, 1080],
    [Infinity, 1],
    [DISPLAY_LIMITS.dimension + 1, 1],
    [8192, 8192],
  ])
    expect(validFrameSize(width, height)).toBe(false);
  expect(validDisplay(undefined)).toBe(false);
  expect(validDisplay({ width: 1920, height: 1080, x: 2147483640 })).toBe(
    false,
  );
  expect(validDisplay({ width: 1920, height: 1080, y: -2147483649 })).toBe(
    false,
  );
});
