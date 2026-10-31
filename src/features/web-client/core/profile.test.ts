/** @jest-environment node */
import { beforeAll, expect, test } from '@jest/globals';
import { cryptoReady } from './crypto';
import {
  ICE_LIMITS,
  normalizeIceServers,
  normalizeTargetId,
  validateAdvertisedRelay,
  validateProfile,
} from './profile';

beforeAll(cryptoReady);
const profile = {
  idServerUrl: 'wss://example.test/id',
  relayServerUrl: 'wss://example.test/relay',
  serverPublicKey: Buffer.alloc(32).toString('base64'),
};

test('only administrator WSS endpoints with no credentials or query are accepted', () => {
  expect(validateProfile(profile)).toEqual(profile);
  for (const idServerUrl of [
    'ws://example.test',
    'https://example.test',
    'wss://user:secret@example.test',
    'wss://example.test?token=secret',
    'wss://example.test/#x',
    'wss://example.test?',
    'wss://example.test#',
    'wss:example.test',
    'wss://exam\tple.test',
    'wss://example.test\\path',
  ]) {
    expect(() => validateProfile({ ...profile, idServerUrl })).toThrow(
      'configuration',
    );
  }
});

test('supports numeric and native custom IDs, rejecting connection overrides', () => {
  expect(normalizeTargetId(' 123 456 789 ')).toBe('123456789');
  expect(normalizeTargetId('Office_pc-1')).toBe('Office_pc-1');
  expect(normalizeTargetId('A中文测试设备')).toBe('A中文测试设备');
  for (const id of [
    '',
    '   ',
    '127.0.0.1',
    '::1',
    '123@evil.test',
    'rustdesk://123',
    'abc/def',
    '123?key=foo',
    'a b c d e f',
    '1'.repeat(257),
  ]) {
    expect(() => normalizeTargetId(id)).toThrow('configuration');
  }
});

test('relay advertisement cannot redirect to another host or inject a URL', () => {
  expect(() =>
    validateAdvertisedRelay('example.test:21117', profile.relayServerUrl),
  ).not.toThrow();
  for (const address of [
    'evil.test:21117',
    'user@example.test',
    'example.test/path',
    'example.test?key=value',
  ]) {
    expect(() =>
      validateAdvertisedRelay(address, profile.relayServerUrl),
    ).toThrow('configuration');
  }
});

test('complete WSS relay advertisements must match the fixed configured endpoint', () => {
  const configured = 'wss://186.241.77.98:22443/ws/relay';
  for (const advertised of [configured, 'WSS://186.241.77.98:22443/ws/relay']) {
    expect(() => validateAdvertisedRelay(advertised, configured)).not.toThrow();
  }
  expect(() =>
    validateAdvertisedRelay(
      'WSS://EXAMPLE.TEST:443/relay',
      profile.relayServerUrl,
    ),
  ).not.toThrow();
  // Native TCP ports still do not override the administrator WSS destination.
  expect(() =>
    validateAdvertisedRelay('186.241.77.98:21117', configured),
  ).not.toThrow();
  expect(() => validateAdvertisedRelay('', configured)).not.toThrow();
  for (const advertised of [
    'wss://evil.test:22443/ws/relay',
    'wss://186.241.77.98:21117/ws/relay',
    'wss://186.241.77.98/ws/relay',
    'wss://186.241.77.98:22443/ws/id',
    `${configured}/`,
    'ws://186.241.77.98:22443/ws/relay',
    'https://186.241.77.98:22443/ws/relay',
    'tcp://186.241.77.98:22443/ws/relay',
    'wss:186.241.77.98:22443/ws/relay',
    'wss://user:secret@186.241.77.98:22443/ws/relay',
    'wss://@186.241.77.98:22443/ws/relay',
    `${configured}?`,
    `${configured}?token=secret`,
    `${configured}#`,
    `${configured}#fragment`,
    ` ${configured}`,
    `${configured}\n`,
    'wss://186.241.77.98:22443/ws/rel\tay',
    'wss://186.241.77.98:22443/ws\\relay',
    'wss://186.241.77.98:22443/ws/./relay',
    'wss://186.241.77.98:22443/ws/other/../relay',
    'wss://186.241.77.98:22443/ws/%2e/relay',
    'wss://186.241.77.98:22443/ws/other/%2e%2e/relay',
    'wss://186.241.77.98:22443/ws/other/.%2E/relay',
    'wss://186.241.77.98:22443/ws/other/%2e./relay',
  ]) {
    expect(() => validateAdvertisedRelay(advertised, configured)).toThrow(
      'configuration',
    );
  }
});

test('ICE servers are optional and validated when present', () => {
  expect(validateProfile(profile)).toEqual(profile);
  const stun = { urls: 'stun:stun.example.test:3478' };
  const turn = {
    urls: 'turn:turn.example.test:3478',
    username: 'user',
    credential: 'secret',
  };
  expect(validateProfile({ ...profile, iceServers: [stun, turn] })).toEqual({
    ...profile,
    iceServers: [stun, turn],
  });
  expect(normalizeIceServers(undefined)).toBeUndefined();
  expect(normalizeIceServers([])).toBeUndefined();
  expect(normalizeIceServers([stun])).toEqual([stun]);
  for (const invalid of [
    { urls: 'http://example.test' },
    { urls: 'stun: example.test' },
    { urls: 'stun:example.test?q=1' },
    { urls: `stun:${'x'.repeat(ICE_LIMITS.urls)}` },
    {
      urls: 'stun:example.test',
      username: 'x'.repeat(ICE_LIMITS.credential + 1),
    },
    {
      urls: 'stun:example.test',
      credential: 'x'.repeat(ICE_LIMITS.credential + 1),
    },
    { urls: 123 },
  ]) {
    expect(() => normalizeIceServers([invalid as never])).toThrow(
      'configuration',
    );
  }
  expect(() =>
    normalizeIceServers(
      Array.from({ length: ICE_LIMITS.count + 1 }, () => stun),
    ),
  ).toThrow('configuration');
});
