import { expect, test } from '@jest/globals';
import { workerAssetUrl } from './worker-manifest';

const buildA = 'a'.repeat(64);
const buildB = 'b'.repeat(64);
const file = 'web-client-worker.12345678.js';

test('生产页面只能启动自身构建的哈希 Worker，保留部署子路径', () => {
  expect(
    workerAssetUrl(
      { file, buildId: buildA },
      buildA,
      'https://console.test/app/',
    ).href,
  ).toBe(`https://console.test/app/${file}`);
});

test.each([
  { file, buildId: buildB },
  { file },
  null,
  {},
  { file: '../web-client-worker.12345678.js', buildId: buildA },
  { file: 'https://other.test/web-client-worker.12345678.js', buildId: buildA },
  { file: 'web-client-worker.js', buildId: buildA },
  { file: 'web-client-worker.12345678.js?new', buildId: buildA },
])('驻留 A 页面与 B/旧/异常清单不返回可启动地址：%j', (manifest: unknown) => {
  expect(() =>
    workerAssetUrl(manifest, buildA, 'https://console.test/'),
  ).toThrow('do not match');
});

test('基线 Git 提交不能替代未提交源码构建身份', () => {
  expect(() =>
    workerAssetUrl(
      { file, buildId: 'c'.repeat(40) },
      'c'.repeat(40),
      'https://console.test/',
    ),
  ).toThrow('do not match');
});
