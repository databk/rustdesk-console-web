import { expect, test } from '@jest/globals';
import enUS from '../../locales/en-US/pages';
import frFR from '../../locales/fr-FR/pages';
import ptBR from '../../locales/pt-BR/pages';
import ruRU from '../../locales/ru-RU/pages';
import zhCN from '../../locales/zh-CN/pages';
import { formatUserRoleNames } from '../users/components/userRoleAssignment';
import {
  ROLE_PERMISSION_PRESETS,
  SUPER_ADMIN_NON_CATALOG_CAPABILITIES,
} from './rbacPresentation';

const PERMISSION_CODES = [
  'users.view',
  'users.create',
  'users.edit',
  'users.status',
  'users.delete',
  'users.security',
  'users.force_logout',
  'user_groups.view',
  'user_groups.create',
  'user_groups.edit',
  'user_groups.delete',
  'user_groups.membership',
  'devices.view',
  'devices.edit',
  'devices.status',
  'devices.delete',
  'devices.disconnect',
  'address_books.view',
  'address_books.edit',
  'address_books.share',
  'strategies.view',
  'strategies.create',
  'strategies.edit',
  'strategies.delete',
  'strategies.assign',
  'audit.view',
  'roles.view',
  'roles.assign',
  'roles.create',
  'roles.edit',
  'roles.delete',
] as const;

const RESOURCE_CODES = [
  'users',
  'user_groups',
  'devices',
  'address_books',
  'strategies',
  'audit',
  'roles',
  'system',
  'other',
] as const;

const LOCALES: Array<[string, Record<string, string>]> = [
  ['en-US', enUS],
  ['zh-CN', zhCN],
  ['pt-BR', ptBR],
  ['ru-RU', ruRU],
  ['fr-FR', frFR],
];

const SHARED_ADDRESS_BOOK_TERMS: Record<string, RegExp> = {
  'en-US': /shared address books?/i,
  'zh-CN': /共享地址簿/,
  'pt-BR': /endereços compartilhados/i,
  'ru-RU': /общ(?:их|ими) адресн(?:ых|ыми) книг/i,
  'fr-FR': /carnets? d'adresses? partag/i,
};

test.each(LOCALES)(
  '%s has the complete RBAC label catalog',
  (_name, messages) => {
    const permissionKeys = Object.keys(messages)
      .filter((key) => key.startsWith('pages.roles.permission.'))
      .sort();

    expect(permissionKeys).toEqual(
      PERMISSION_CODES.map((code) => `pages.roles.permission.${code}`).sort(),
    );

    for (const key of [
      ...RESOURCE_CODES.map((code) => `pages.roles.resource.${code}`),
      'pages.roles.personalAddressBook',
      'pages.roles.basicFunction',
      'pages.roles.permissionPresets',
      'pages.roles.preset.custom',
      ...ROLE_PERMISSION_PRESETS.map(({ key }) => `pages.roles.preset.${key}`),
      ...SUPER_ADMIN_NON_CATALOG_CAPABILITIES.map(
        (capability) => `pages.users.systemCapability.${capability}`,
      ),
      'pages.login.permissionsLoadFailed',
      'pages.users.superAdmin',
      'pages.users.roleEligibility.super_admin_target',
      'pages.strategies.view',
      'pages.common.close',
      'pages.common.back',
    ]) {
      expect(typeof messages[key]).toBe('string');
      expect(messages[key].trim().length).toBeGreaterThan(0);
    }
  },
);

test.each(LOCALES)(
  '%s identifies every address-book permission as shared management',
  (name, messages) => {
    for (const action of ['view', 'edit', 'share']) {
      expect(
        messages[`pages.roles.permission.address_books.${action}`],
      ).toMatch(SHARED_ADDRESS_BOOK_TERMS[name]);
    }
  },
);

test('formats the user role column with virtual built-in identities', () => {
  expect(formatUserRoleNames({ is_admin: true }, 'Super admin')).toBe(
    'Super admin',
  );
  expect(
    formatUserRoleNames(
      { is_admin: false, role_names: ['Reader', 'Operator'] },
      'Super admin',
    ),
  ).toBe('Reader, Operator');
  expect(
    formatUserRoleNames(
      { is_admin: false, role_names: [] },
      'Super admin',
      'Ordinary user',
    ),
  ).toBe('Ordinary user');
});
