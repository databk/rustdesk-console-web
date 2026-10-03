/** @jest-environment node */
import { beforeAll, expect, test } from '@jest/globals';
import { cryptoReady } from './crypto';
import {
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
