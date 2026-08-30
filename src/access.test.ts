import { expect, test } from '@jest/globals';
import createAccess from './access';

test('derives delegated route capabilities from effective permissions', () => {
  const access = createAccess({
    currentUser: { is_admin: false },
    permissions: {
      permissions: ['users.view', 'devices.view', 'devices.edit'],
      scopes: {
        'devices.view': {
          scope_type: 'device_group',
          device_group_guids: ['group-a'],
        },
      },
    },
  });

  expect(access.canUsersView).toBe(true);
  expect(access.canDevicesView).toBe(true);
  expect(access.canDevicesEdit).toBe(true);
  expect(access.canDevicesDelete).toBe(false);
  expect(access.canAdmin).toBe(false);
});

test('preserves the protected super-administrator presentation path', () => {
  const access = createAccess({
    currentUser: { is_admin: true },
    permissions: { permissions: [], scopes: {} },
  });

  expect(access.isSuperAdmin).toBe(true);
  expect(access.canAdmin).toBe(true);
  expect(access.canUsersView).toBe(true);
  expect(access.canStrategiesDelete).toBe(true);
});
