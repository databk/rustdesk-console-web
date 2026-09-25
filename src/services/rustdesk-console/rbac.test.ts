import { beforeEach, expect, jest, test } from '@jest/globals';
import { request } from '@umijs/max';
import { getMyPermissions, getPermissionList } from './permission';
import { getRoleDetail, getRoleList, updateRole } from './role';
import { getUserRoles, replaceUserRoles } from './userRole';
import { getStrategyCandidates, getStrategyTargetCandidates } from './strategy';
import {
  getAddressBookShareCandidates,
  getWebSharedAddressBook,
  getWebSharedAddressBooks,
} from './addressBook';
import { batchUpdateDeviceStatus, getAdminDeviceList } from './device';
import { getStrategyTargetDeviceGroupList } from './deviceGroup';
import { getActiveConnections, getConsoleAudits } from './audit';

jest.mock('@umijs/max', () => ({ request: jest.fn() }));

const requestMock = jest.mocked(request);

beforeEach(() => {
  requestMock.mockReset();
});

test('uses the backend-owned permission and role contracts', async () => {
  requestMock
    .mockResolvedValueOnce({
      data: [
        {
          code: 'devices.view',
          resource: 'devices',
          action: 'view',
          name: 'View devices',
          description: '',
          assignable: true,
          system_only: false,
          scope: 'device_group',
        },
      ],
    })
    .mockResolvedValueOnce({ permissions: [], scopes: {} });
  await getPermissionList();
  await getMyPermissions();
  await getRoleDetail('role-guid');
  await updateRole('role-guid', {
    name: 'Operators',
    permissions: ['devices.view'],
  });

  expect(requestMock).toHaveBeenNthCalledWith(1, '/api/permissions', {
    method: 'GET',
  });
  expect(requestMock).toHaveBeenNthCalledWith(2, '/api/permissions/me', {
    method: 'GET',
  });
  expect(requestMock).toHaveBeenNthCalledWith(3, '/api/roles/role-guid', {
    method: 'GET',
    skipErrorHandler: true,
  });
  expect(requestMock).toHaveBeenNthCalledWith(4, '/api/roles/role-guid', {
    method: 'PATCH',
    data: {
      name: 'Operators',
      permissions: ['devices.view'],
    },
    skipErrorHandler: true,
  });
});

test('uses atomic user-role replacement with explicit scope fields', async () => {
  await getUserRoles('user-guid');
  await replaceUserRoles('user-guid', {
    assignments: [
      {
        role_guid: 'role-guid',
        scope_type: 'device_group',
        device_group_guids: ['group-guid'],
      },
    ],
  });

  expect(requestMock).toHaveBeenNthCalledWith(1, '/api/users/user-guid/roles', {
    method: 'GET',
    skipErrorHandler: true,
  });
  expect(requestMock).toHaveBeenNthCalledWith(2, '/api/users/user-guid/roles', {
    method: 'PUT',
    data: {
      assignments: [
        {
          role_guid: 'role-guid',
          scope_type: 'device_group',
          device_group_guids: ['group-guid'],
        },
      ],
    },
    skipErrorHandler: true,
  });
});

test('sends role name and note filters as independent query fields', async () => {
  requestMock.mockResolvedValueOnce({ data: [], total: 0 });

  await getRoleList({
    current: 2,
    pageSize: 20,
    name: 'operator',
    note: 'night shift',
  });

  expect(requestMock).toHaveBeenCalledWith('/api/roles', {
    method: 'GET',
    params: {
      current: 2,
      pageSize: 20,
      name: 'operator',
      note: 'night shift',
    },
  });
});

test('rejects malformed effective-permission responses', async () => {
  requestMock.mockResolvedValueOnce({ permissions: {}, scopes: {} });

  await expect(getMyPermissions()).rejects.toThrow(
    'Invalid effective permissions response',
  );
});

test('rejects a permission catalog outside the documented data envelope', async () => {
  requestMock.mockResolvedValueOnce([]);

  await expect(getPermissionList()).rejects.toThrow(
    'Invalid permission catalog response',
  );
});

test.each([
  { data: [] },
  { data: [{ code: 'devices.view' }] },
  {
    data: [
      {
        code: 'devices.view',
        resource: 'devices',
        action: 'view',
        name: 'View devices',
        description: '',
        scope: 'unexpected',
      },
    ],
  },
  {
    data: [
      {
        code: 'roles.create',
        resource: 'roles',
        action: 'create',
        name: 'Create roles',
        description: '',
        assignable: true,
        system_only: true,
        scope: 'global',
      },
    ],
  },
])('rejects an unusable permission catalog: %#', async (response) => {
  requestMock.mockResolvedValueOnce(response);

  await expect(getPermissionList()).rejects.toThrow(
    'Invalid permission catalog response',
  );
});

test('uses the safe candidate and shared-address-book access contracts', async () => {
  await getStrategyCandidates({ current: 2, pageSize: 10, name: 'safe' });
  await getWebSharedAddressBooks({ current: 1, pageSize: 20 });
  await getWebSharedAddressBook('book-guid');

  expect(requestMock).toHaveBeenNthCalledWith(1, '/api/strategies/candidates', {
    method: 'GET',
    params: { current: 2, pageSize: 10, name: 'safe' },
  });
  expect(requestMock).toHaveBeenNthCalledWith(2, '/api/ab/shared/list', {
    method: 'GET',
    params: { current: 1, pageSize: 20 },
  });
  expect(requestMock).toHaveBeenNthCalledWith(
    3,
    '/api/ab/shared/book-guid/access',
    { method: 'GET', skipErrorHandler: true },
  );
});

test('uses the address-book-owned sharing candidate contract', async () => {
  await getAddressBookShareCandidates('book-guid');

  expect(requestMock).toHaveBeenCalledWith(
    '/api/ab/shared/book-guid/share-candidates',
    { method: 'GET' },
  );
});

test('uses the RBAC management device endpoint with its supported filters', async () => {
  await getAdminDeviceList({
    current: 1,
    pageSize: 20,
    status: '0',
    is_online: '1',
    os: 'linux',
    device_group_guid: 'group-guid',
  });

  expect(requestMock).toHaveBeenCalledWith('/api/devices', {
    method: 'GET',
    params: expect.objectContaining({
      status: '0',
      is_online: '1',
      os: 'linux',
      device_group_guid: 'group-guid',
    }),
  });
});

test('uses the scoped device-group candidates endpoint for strategy assignment', async () => {
  await getStrategyTargetDeviceGroupList({ current: 1, pageSize: 200 });

  expect(requestMock).toHaveBeenCalledWith(
    '/api/device-groups/strategy-targets',
    {
      method: 'GET',
      params: { current: 1, pageSize: 200 },
    },
  );
});

test('uses strategy-owned target candidate contracts', async () => {
  await getStrategyTargetCandidates({
    target_type: 'device',
    current: 1,
    pageSize: 200,
  });
  await getStrategyTargetCandidates({
    target_type: 'user',
    current: 2,
    pageSize: 20,
  });

  expect(requestMock).toHaveBeenNthCalledWith(
    1,
    '/api/strategies/target-candidates',
    {
      method: 'GET',
      params: { target_type: 'device', current: 1, pageSize: 200 },
    },
  );
  expect(requestMock).toHaveBeenNthCalledWith(
    2,
    '/api/strategies/target-candidates',
    {
      method: 'GET',
      params: { target_type: 'user', current: 2, pageSize: 20 },
    },
  );
});

test('unwraps the batch device status response envelope', async () => {
  requestMock.mockResolvedValueOnce({
    success: true,
    data: {
      succeeded: ['device-guid'],
      failed: [{ guid: 'other-guid', reason: 'offline' }],
      total: 2,
      succeededCount: 1,
      failedCount: 1,
    },
  });

  await expect(
    batchUpdateDeviceStatus({
      guids: ['device-guid', 'other-guid'],
      status: 'enabled',
    }),
  ).resolves.toMatchObject({ succeededCount: 1, failedCount: 1 });
});

test('preserves partial batch device failures from a false success envelope', async () => {
  requestMock.mockResolvedValueOnce({
    success: false,
    data: {
      succeeded: ['device-guid'],
      failed: [{ guid: 'other-guid', reason: 'denied' }],
      total: 2,
      succeededCount: 1,
      failedCount: 1,
    },
  });

  await expect(
    batchUpdateDeviceStatus({
      guids: ['device-guid', 'other-guid'],
      status: 'disabled',
    }),
  ).resolves.toMatchObject({ succeededCount: 1, failedCount: 1 });
});

test('rejects a batch device status response without data', async () => {
  requestMock.mockResolvedValueOnce({ success: false });

  await expect(
    batchUpdateDeviceStatus({ guids: ['device-guid'], status: 'disabled' }),
  ).rejects.toThrow('Invalid batch device status response');
});

test('uses paginated strategy target requests without unsupported filters', async () => {
  await getStrategyTargetCandidates({
    target_type: 'user',
    current: 1,
    pageSize: 100,
  });

  expect(requestMock).toHaveBeenCalledWith(
    '/api/strategies/target-candidates',
    {
      method: 'GET',
      params: {
        target_type: 'user',
        current: 1,
        pageSize: 100,
      },
    },
  );
});

test('passes the console audit operator filter and uses the new row contract', async () => {
  requestMock.mockResolvedValueOnce({ data: [], total: 0 });

  await getConsoleAudits({
    current: 2,
    pageSize: 10,
    operator: 'admin',
    action: 'role.update',
    target_type: 'role',
    result: 'allowed',
    start_time: '2026-01-01T00:00:00.000Z',
    end_time: '2026-01-31T23:59:59.999Z',
  });

  expect(requestMock).toHaveBeenCalledWith('/api/audits/console', {
    method: 'GET',
    params: {
      current: 2,
      pageSize: 10,
      operator: 'admin',
      action: 'role.update',
      target_type: 'role',
      result: 'allowed',
      start_time: '2026-01-01T00:00:00.000Z',
      end_time: '2026-01-31T23:59:59.999Z',
    },
  });
});

test('uses the restricted active-connection endpoint for disconnect-only mode', async () => {
  await getActiveConnections({
    current: 2,
    pageSize: 10,
    deviceId: '123',
  });

  expect(requestMock).toHaveBeenCalledWith('/api/audits/conn/active', {
    method: 'GET',
    params: { current: 2, pageSize: 10, deviceId: '123' },
  });
});
