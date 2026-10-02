import { expect, test } from '@jest/globals';
import {
  filterManageableSelection,
  isCurrentRequest,
} from './userGroupMemberSelection';

const user = (guid: string, overrides: Partial<API.UserItem> = {}) => ({
  guid,
  name: guid,
  email: `${guid}@example.com`,
  note: '',
  status: 1 as API.UserStatus,
  is_admin: false,
  ...overrides,
});

test('clears protected and owner rows from a preserved selection for delegated users', () => {
  const keys = ['ordinary', 'protected', 'owner', 'off-page'];
  const rows = [
    user('ordinary'),
    user('protected', { is_protected: true }),
    user('owner', { is_admin: true }),
  ];

  expect(filterManageableSelection(keys, rows, false)).toEqual(['ordinary']);
  expect(filterManageableSelection(keys, rows, true)).toEqual(keys);
});

test('rejects an async response after the modal request version changes', () => {
  expect(isCurrentRequest(4, 4)).toBe(true);
  expect(isCurrentRequest(3, 4)).toBe(false);
});
