import { beforeEach, expect, jest, test } from '@jest/globals';
import { request } from '@umijs/max';
import { getMyPermissions, getPermissionList } from './permission';
import { getRoleDetail, updateRole } from './role';
import { getUserRoles, replaceUserRoles } from './userRole';

jest.mock('@umijs/max', () => ({ request: jest.fn() }));

const requestMock = jest.mocked(request);

beforeEach(() => {
  requestMock.mockReset();
  requestMock.mockResolvedValue({ permissions: [], scopes: {} });
});

test('uses the backend-owned permission and role contracts', async () => {
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

  expect(requestMock).toHaveBeenNthCalledWith(
    1,
    '/api/users/user-guid/roles',
    { method: 'GET', skipErrorHandler: true },
  );
  expect(requestMock).toHaveBeenNthCalledWith(
    2,
    '/api/users/user-guid/roles',
    {
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
    },
  );
});

test('rejects malformed effective-permission responses', async () => {
  requestMock.mockResolvedValueOnce({ permissions: {}, scopes: {} });

  await expect(getMyPermissions()).rejects.toThrow(
    'Invalid effective permissions response',
  );
});
