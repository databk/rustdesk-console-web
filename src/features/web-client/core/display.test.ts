/** @jest-environment node */
import { expect, test } from '@jest/globals';
import { hbb } from '../protocol';
import {
  DISPLAY_LIMITS,
  DisplayCatalog,
  resolutionList,
  supportsResolution,
  validDisplay,
  validFrameSize,
} from './display';

test('accepts tested 4K frames and signed monitor origins within allocation bounds', () => {
  expect(validFrameSize(3840, 2160)).toBe(true);
  expect(validDisplay({ width: 3840, height: 2160, x: -3840, y: 0 })).toBe(
    true,
  );
  expect(validFrameSize(7680, 4320)).toBe(true);
});

test('分辨率列表有界去重，原生当前索引归属不被本机选择覆盖', () => {
  const catalog = new DisplayCatalog();
  catalog.updatePeer({
    platform: 'Windows',
    version: '1.4.9',
    currentDisplay: 1,
    displays: [
      { name: 'A', width: 800, height: 600 },
      { name: 'B', width: 1024, height: 768 },
    ],
    resolutions: { resolutions: [{ width: 1024, height: 768 }] },
  });
  expect(catalog.get(0).resolutions).toEqual([]);
  expect(catalog.get(1).resolutions).toEqual([{ width: 1024, height: 768 }]);
  catalog.updatePeer({
    currentDisplay: 0,
    displays: [
      { name: 'A', width: 800, height: 600 },
      { name: 'B', width: 1280, height: 720 },
    ],
  });
  expect(catalog.get(1).supported).toBe(true);
  expect(catalog.get(1).resolutions).toHaveLength(1);
  catalog.updateSwitch({
    display: 0,
    resolutions: {
      resolutions: [
        { width: 800, height: 600 },
        { width: 800, height: 600 },
        { width: 0, height: 0 },
      ],
    },
    originalResolution: { width: 0, height: 0 },
  });
  expect(catalog.get(0).resolutions).toEqual([{ width: 800, height: 600 }]);
  expect(catalog.get(0).originalResolution).toBeUndefined();
  catalog.updatePeer({
    displays: [
      { name: 'B', width: 1280, height: 720 },
      { name: 'A', width: 800, height: 600 },
    ],
  });
  expect(catalog.get(1).resolutions).toEqual([]);
  expect(
    resolutionList(
      Array.from({ length: 200 }, (_, index) => ({
        width: index + 1,
        height: 1,
      })),
    ),
  ).toHaveLength(128);
  for (const version of ['', 'unknown', '1.2.3'])
    expect(supportsResolution('Windows', version)).toBe(false);
  expect(supportsResolution('Windows', '1.2.4')).toBe(true);
  expect(supportsResolution('Linux', '1.5.0')).toBe(false);
  const unnamed = new DisplayCatalog();
  unnamed.updatePeer({
    platform: 'Windows',
    version: '1.4.9',
    displays: [
      { width: 800, height: 600 },
      { name: 'A', x: 800, width: 800, height: 600 },
    ],
    resolutions: { resolutions: [{ width: 1024, height: 768 }] },
  });
  const identity = unnamed.get(0).identity;
  unnamed.updatePeer({
    displays: [
      { width: 800, height: 600 },
      { name: 'B', x: 800, width: 800, height: 600 },
    ],
  });
  expect(unnamed.get(0).identity).not.toBe(identity);
  expect(unnamed.get(0).resolutions).toEqual([]);
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

test('真实codec区分省略与显式无效原始模式，并隔离具名和匿名身份', () => {
  const catalog = new DisplayCatalog();
  const update = (peer: hbb.IPeerInfo) =>
    catalog.updatePeer(hbb.PeerInfo.decode(hbb.PeerInfo.encode(peer).finish()));
  update({
    platform: 'Windows',
    version: '1.4.9',
    displays: [
      {
        width: 800,
        height: 600,
        originalResolution: { width: 800, height: 600 },
      },
    ],
    resolutions: { resolutions: [{ width: 800, height: 600 }] },
  });
  const anonymous = catalog.get(0);
  update({ displays: [{ width: 800, height: 600 }] });
  expect(catalog.get(0).originalResolution).toEqual({
    width: 800,
    height: 600,
  });
  update({
    displays: [
      { width: 800, height: 600, originalResolution: { width: 0, height: 0 } },
    ],
  });
  expect(catalog.get(0).originalResolution).toBeUndefined();
  update({ displays: [{ name: '1:0:0', width: 800, height: 600 }] });
  expect(catalog.get(0).identity).not.toBe(anonymous.identity);
  expect(catalog.get(0).resolutions).toEqual([]);
});
