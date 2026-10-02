import { expect, test } from '@jest/globals';
import {
  canDisconnectActiveConnection,
  canDisconnectAuditRecord,
  getConnectionPageMode,
} from './connectionAccess';

test('selects the restricted current-connection mode without audit view', () => {
  expect(getConnectionPageMode(false)).toBe('restricted');
  expect(getConnectionPageMode(true)).toBe('full');
});

test('only offers disconnect for server-approved rows', () => {
  expect(
    canDisconnectAuditRecord(true, {
      deviceUuid: 'uuid-1',
      connId: '42',
      can_disconnect: true,
    }),
  ).toBe(true);
  expect(
    canDisconnectAuditRecord(true, {
      deviceUuid: 'uuid-1',
      connId: '42',
      can_disconnect: false,
    }),
  ).toBe(false);
  expect(
    canDisconnectAuditRecord(true, {
      action: 'closed',
      deviceUuid: 'uuid-1',
      connId: '42',
      can_disconnect: true,
    }),
  ).toBe(true);
  expect(
    canDisconnectAuditRecord(true, {
      can_disconnect: true,
    }),
  ).toBe(false);
  expect(
    canDisconnectActiveConnection(true, {
      deviceId: 'device-1',
      deviceUuid: 'uuid-1',
      connId: 42,
      can_disconnect: true,
    }),
  ).toBe(true);
});
