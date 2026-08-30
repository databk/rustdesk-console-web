import { expect, test } from '@jest/globals';
import {
  changeAssignmentScope,
  roleSupportsDeviceGroupScope,
  toReplaceUserRolesParams,
  validateAssignments,
} from './userRoleAssignment';
import type { RoleAssignmentDraft } from './userRoleAssignment';

const role = (guid: string, permissions: string[]): API.RoleItem => ({
  guid,
  name: guid,
  permissions,
});

test('global and device-group modes are mutually exclusive', () => {
  const draft: RoleAssignmentDraft = {
    key: 'assignment',
    role_guid: 'devices-role',
    scope_type: 'device_group',
    device_group_guids: ['group-a'],
  };

  const global = changeAssignmentScope(draft, 'global');
  expect(global).toEqual({
    ...draft,
    scope_type: 'global',
    device_group_guids: [],
  });
  expect(toReplaceUserRolesParams([global])).toEqual({
    assignments: [
      {
        role_guid: 'devices-role',
        scope_type: 'global',
        device_group_guids: [],
      },
    ],
  });
});

test('advanced scope accepts only scoped roles with at least one group', () => {
  const roles = new Map([
    ['devices-role', role('devices-role', ['devices.view', 'devices.edit'])],
    ['users-role', role('users-role', ['users.view'])],
  ]);
  const scoped: RoleAssignmentDraft = {
    key: 'assignment',
    role_guid: 'devices-role',
    scope_type: 'device_group',
    device_group_guids: [],
  };

  expect(roleSupportsDeviceGroupScope(roles.get('devices-role'))).toBe(true);
  expect(roleSupportsDeviceGroupScope(roles.get('users-role'))).toBe(false);
  expect(validateAssignments([scoped], roles)).toBe('missing_device_group');
  expect(
    validateAssignments(
      [{ ...scoped, role_guid: 'users-role', device_group_guids: ['group-a'] }],
      roles,
    ),
  ).toBe('unsupported_device_group_scope');
  expect(
    validateAssignments(
      [{ ...scoped, device_group_guids: ['group-a'] }],
      roles,
    ),
  ).toBeUndefined();
});

test('replacement payload deduplicates selected device groups', () => {
  expect(
    toReplaceUserRolesParams([
      {
        key: 'assignment',
        role_guid: 'devices-role',
        scope_type: 'device_group',
        device_group_guids: ['group-a', 'group-a', 'group-b'],
      },
    ]),
  ).toEqual({
    assignments: [
      {
        role_guid: 'devices-role',
        scope_type: 'device_group',
        device_group_guids: ['group-a', 'group-b'],
      },
    ],
  });
});
