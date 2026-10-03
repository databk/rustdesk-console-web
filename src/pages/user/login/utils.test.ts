import { expect, test } from '@jest/globals';
import { resolvePostLoginPath } from './utils';

const state = (
  permissions: string[] = [],
  isAdmin = false,
): Parameters<typeof resolvePostLoginPath>[1] => ({
  currentUser: { is_admin: isAdmin },
  permissions: { permissions, scopes: {} },
});

test('普通登录用户可以返回带设备参数的 Web Client，外部地址仍被拒绝', () => {
  expect(resolvePostLoginPath('/web-client?id=123456789', state())).toBe(
    '/web-client?id=123456789',
  );
  expect(
    resolvePostLoginPath('https://example.com/web-client', state()),
  ).toBe('/address-book/personal');
});

test('restores only an internal route the current user can access', () => {
  expect(
    resolvePostLoginPath('/devices?name=test#list', state(['devices.view'])),
  ).toBe('/devices?name=test#list');
  expect(
    resolvePostLoginPath('/settings/general', state(['devices.view'])),
  ).toBe('/devices');
  expect(resolvePostLoginPath('//example.com', state(['devices.view']))).toBe(
    '/devices',
  );
  expect(
    resolvePostLoginPath('https://example.com', state(['devices.view'])),
  ).toBe('/devices');
});

test('chooses the first authorized management destination', () => {
  expect(resolvePostLoginPath(undefined, state([], true))).toBe('/dashboard');
  expect(
    resolvePostLoginPath(undefined, state(['users.view', 'devices.view'])),
  ).toBe('/devices');
  expect(resolvePostLoginPath(undefined, state(['users.view']))).toBe('/users');
  expect(resolvePostLoginPath(undefined, state(['strategies.assign']))).toBe(
    '/strategy',
  );
  expect(resolvePostLoginPath(undefined, state(['audit.view']))).toBe(
    '/audits/conn',
  );
  expect(resolvePostLoginPath(undefined, state(['devices.disconnect']))).toBe(
    '/audits/conn',
  );
  expect(resolvePostLoginPath(undefined, state(['address_books.view']))).toBe(
    '/address-book/shared',
  );
});

test('restores connection audit but not unrelated audits for disconnect-only users', () => {
  expect(
    resolvePostLoginPath('/audits/conn', state(['devices.disconnect'])),
  ).toBe('/audits/conn');
  expect(
    resolvePostLoginPath('/audits/file', state(['devices.disconnect'])),
  ).toBe('/audits/conn');
});

test('sends a user without management permissions to the personal address book', () => {
  expect(resolvePostLoginPath(undefined, state())).toBe(
    '/address-book/personal',
  );
  expect(resolvePostLoginPath('/', state())).toBe('/address-book/personal');
  expect(resolvePostLoginPath('/unknown', state())).toBe(
    '/address-book/personal',
  );
  expect(resolvePostLoginPath('/address-book/shared', state())).toBe(
    '/address-book/shared',
  );
});

test.each([
  ['/roles', ['roles.view'], '/roles'],
  ['/roles/role-guid', ['roles.view'], '/roles'],
  ['/roles/role-guid', ['users.view'], '/users'],
  ['/groups/user/group-guid', ['user_groups.view'], '/groups/user/group-guid'],
  ['/groups', ['user_groups.view'], '/groups'],
  ['/audits/file', ['audit.view'], '/audits/file'],
  ['/audits/file', ['devices.disconnect'], '/audits/conn'],
  ['/strategy/detail', ['strategies.assign'], '/strategy'],
  ['/devices/not-a-route', ['devices.view'], '/devices'],
] as const)(
  'matches authorized parent/detail route %s',
  (redirect, permissions, expected) => {
    expect(resolvePostLoginPath(redirect, state([...permissions]))).toBe(
      expected,
    );
  },
);
