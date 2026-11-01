/** @jest-environment node */
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import {
  DEFAULT_ICE_SERVERS,
  formatIceServersText,
  loadIceServers,
  parseIceServersText,
  saveIceServers,
} from './ice-config';

const store = new Map<string, string>();
const mockStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
  key: () => null,
  get length() {
    return store.size;
  },
};
beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
  });
});
afterEach(() => {
  jest.restoreAllMocks();
});

test('parses STUN and TURN lines with optional credentials', () => {
  expect(parseIceServersText('stun:stun.example.test:3478')).toEqual([
    { urls: 'stun:stun.example.test:3478' },
  ]);
  expect(
    parseIceServersText(
      'stun:stun.example.test:3478\nturn:turn.example.test:3478 user secret',
    ),
  ).toEqual([
    { urls: 'stun:stun.example.test:3478' },
    {
      urls: 'turn:turn.example.test:3478',
      username: 'user',
      credential: 'secret',
    },
  ]);
});

test('ignores blank lines and invalid schemes', () => {
  expect(
    parseIceServersText('\n  \nhttp://evil.test\nstun:good.test:3478'),
  ).toEqual([{ urls: 'stun:good.test:3478' }]);
});

test('allows TURN transport query per RFC 7065', () => {
  expect(
    parseIceServersText(
      'turn:turn.example.test:3478?transport=tcp user secret',
    ),
  ).toEqual([
    {
      urls: 'turn:turn.example.test:3478?transport=tcp',
      username: 'user',
      credential: 'secret',
    },
  ]);
  expect(parseIceServersText('stun:stun.example.test:3478?x=1')).toEqual([]);
});

test('round-trips through format and parse', () => {
  const servers = [
    { urls: 'stun:stun.example.test:3478' },
    {
      urls: 'turn:turn.example.test:3478',
      username: 'u',
      credential: 'c',
    },
  ];
  expect(parseIceServersText(formatIceServersText(servers))).toEqual(servers);
});

test('returns default STUN servers when no config is stored', () => {
  expect(loadIceServers()).toEqual(DEFAULT_ICE_SERVERS);
  expect(DEFAULT_ICE_SERVERS).toHaveLength(4);
  expect(DEFAULT_ICE_SERVERS[0].urls).toBe('stun:stun.cloudflare.com:3478');
});

test('load and save persist across calls', () => {
  saveIceServers([{ urls: 'stun:stun.example.test:3478' }]);
  expect(loadIceServers()).toEqual([{ urls: 'stun:stun.example.test:3478' }]);
  saveIceServers(undefined);
  expect(loadIceServers()).toEqual(DEFAULT_ICE_SERVERS);
});
