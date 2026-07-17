import { beforeEach, expect, jest, test } from '@jest/globals';
import { request } from '@umijs/max';
import { addPeer, deleteRules, getAllRules, getRules } from './addressBook';
import {
  getAllUserGroups,
  getUserGroupUsers,
  moveUsersToGroup,
} from './userGroup';

jest.mock('@umijs/max', () => ({ request: jest.fn() }));

const requestMock = jest.mocked(request);

beforeEach(() => {
  requestMock.mockReset();
  requestMock.mockResolvedValue({});
});

test('uses the user-group membership contract', async () => {
  await getUserGroupUsers('group-guid', {
    current: 2,
    pageSize: 10,
    search: 'alice',
  });
  await moveUsersToGroup('group-guid', ['user-guid']);

  expect(requestMock).toHaveBeenNthCalledWith(
    1,
    '/api/user-groups/group-guid/users',
    {
      method: 'GET',
      params: { current: 2, pageSize: 10, search: 'alice' },
    },
  );
  expect(requestMock).toHaveBeenNthCalledWith(
    2,
    '/api/user-groups/group-guid/users',
    {
      method: 'POST',
      data: { user_guids: ['user-guid'] },
    },
  );
});

test('uses paginated address-book rules and a raw delete array', async () => {
  await getRules({ ab: 'book-guid', current: 1, pageSize: 100 });
  await deleteRules(['rule-guid']);

  expect(requestMock).toHaveBeenNthCalledWith(1, '/api/ab/rules', {
    method: 'GET',
    params: { ab: 'book-guid', current: 1, pageSize: 100 },
  });
  expect(requestMock).toHaveBeenNthCalledWith(2, '/api/ab/rules', {
    method: 'DELETE',
    data: ['rule-guid'],
  });
});

test('loads every page of user groups and address-book rules', async () => {
  requestMock
    .mockResolvedValueOnce({ data: [{ guid: 'group-1' }], total: 2 })
    .mockResolvedValueOnce({ data: [{ guid: 'group-2' }], total: 2 })
    .mockResolvedValueOnce({ data: [{ guid: 'rule-1' }], total: 2 })
    .mockResolvedValueOnce({ data: [{ guid: 'rule-2' }], total: 2 });

  await expect(getAllUserGroups()).resolves.toEqual([
    { guid: 'group-1' },
    { guid: 'group-2' },
  ]);
  await expect(getAllRules('book-guid')).resolves.toEqual([
    { guid: 'rule-1' },
    { guid: 'rule-2' },
  ]);

  expect(requestMock).toHaveBeenNthCalledWith(2, '/api/user-groups', {
    method: 'GET',
    params: { current: 2, pageSize: 100 },
  });
  expect(requestMock).toHaveBeenNthCalledWith(4, '/api/ab/rules', {
    method: 'GET',
    params: { ab: 'book-guid', current: 2, pageSize: 100 },
  });
});

test('rejects RustDesk action error payloads and accepts empty success responses', async () => {
  requestMock
    .mockResolvedValueOnce('')
    .mockResolvedValueOnce({ error: '设备不存在' });

  await expect(addPeer('book-guid', { id: '123456789' })).resolves.toBe('');
  await expect(addPeer('book-guid', { id: 'missing' })).rejects.toThrow(
    '设备不存在',
  );
});
