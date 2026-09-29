import { expect, test } from '@jest/globals';
import {
  buildCreateUserPayload,
  buildInviteUserPayload,
  buildUpdateUserPayload,
} from './userPayload';

test('create and invite omit a hidden user group exactly', () => {
  expect(
    buildCreateUserPayload(
      {
        name: 'alice',
        password: 'secret',
        email: 'alice@example.com',
        user_group_guid: 'hidden-group',
      },
      false,
    ),
  ).toEqual({
    name: 'alice',
    password: 'secret',
    email: 'alice@example.com',
  });
  expect(
    buildInviteUserPayload(
      {
        name: 'bob',
        email: 'bob@example.com',
        user_group_guid: 'allowed-group',
      },
      true,
    ),
  ).toEqual({
    name: 'bob',
    email: 'bob@example.com',
    user_group_guid: 'allowed-group',
  });
});

test('update includes only fields owned by the current capabilities', () => {
  const values: API.UpdateUserParams = {
    name: 'alice',
    display_name: 'Alice',
    email: 'alice@example.com',
    note: 'note',
    status: 0,
    user_group_guid: 'group-guid',
  };

  expect(
    buildUpdateUserPayload(values, {
      canEditProfile: false,
      canEditStatus: true,
      canEditGroup: false,
    }),
  ).toEqual({ status: 0 });
  expect(
    buildUpdateUserPayload(values, {
      canEditProfile: true,
      canEditStatus: false,
      canEditGroup: true,
    }),
  ).toEqual({
    name: 'alice',
    display_name: 'Alice',
    email: 'alice@example.com',
    note: 'note',
    user_group_guid: 'group-guid',
  });
});
