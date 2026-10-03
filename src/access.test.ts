import { expect, test } from '@jest/globals';
import routes from '../config/routes';
import createAccess from './access';

test('sends the neutral root route to a page available to every signed-in user', () => {
  const rootRoute = routes.find((route) => route.path === '/');

  expect(rootRoute?.redirect).toBe('/address-book/personal');
});

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

test('fails closed when the permissions payload is malformed', () => {
  const access = createAccess({
    currentUser: { is_admin: false },
    permissions: {
      permissions: 'devices.view' as unknown as string[],
      scopes: {},
    },
  });

  expect(access.canDevicesView).toBe(false);
  expect(access.permissions).toEqual([]);
});

test('opens the strategy route for view-only or assign-only users', () => {
  const viewOnly = createAccess({
    currentUser: { is_admin: false },
    permissions: { permissions: ['strategies.view'], scopes: {} },
  });
  const assignOnly = createAccess({
    currentUser: { is_admin: false },
    permissions: { permissions: ['strategies.assign'], scopes: {} },
  });

  expect(viewOnly.canStrategiesAccess).toBe(true);
  expect(viewOnly.canStrategiesAssign).toBe(false);
  expect(assignOnly.canStrategiesAccess).toBe(true);
  expect(assignOnly.canStrategiesView).toBe(false);
});

test('opens only the connection audit route for disconnect-only users', () => {
  const disconnectOnly = createAccess({
    currentUser: { is_admin: false },
    permissions: { permissions: ['devices.disconnect'], scopes: {} },
  });

  expect(disconnectOnly.canAuditConnectionAccess).toBe(true);
  expect(disconnectOnly.canAuditView).toBe(false);
});

test('device operators cannot acquire global server controls', () => {
  const deviceOperator = createAccess({
    currentUser: { is_admin: false },
    permissions: {
      permissions: ['devices.view', 'devices.disconnect', 'devices.status'],
      scopes: {},
    },
  });
  expect(deviceOperator.canServersView).toBe(false);
  expect(deviceOperator.canServersControl).toBe(false);
  expect(deviceOperator.canServersDisconnect).toBe(false);
  const observer = createAccess({
    currentUser: { is_admin: false },
    permissions: { permissions: ['servers.view'], scopes: {} },
  });
  expect(observer.canServersView).toBe(true);
  expect(observer.canServersControl).toBe(false);
  expect(observer.canServersBan).toBe(false);
});
