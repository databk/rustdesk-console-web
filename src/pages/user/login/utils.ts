import Bowser from 'bowser';
import createAccess from '@/access';

type AccessState = Parameters<typeof createAccess>[0];
type AccessCapabilities = ReturnType<typeof createAccess>;

const DEFAULT_DESTINATIONS: Array<
  [path: string, allowed: (access: AccessCapabilities) => boolean]
> = [
  ['/dashboard', (access) => access.isSuperAdmin],
  ['/devices', (access) => access.canDevicesView],
  ['/users', (access) => access.canUsersView],
  ['/roles', (access) => access.canRolesView],
  ['/groups/user', (access) => access.canUserGroupsView],
  ['/strategy', (access) => access.canStrategiesAccess],
  ['/audits/conn', (access) => access.canAuditConnectionAccess],
  [
    '/address-book/shared',
    (access) =>
      access.canAddressBooksView ||
      access.canAddressBooksEdit ||
      access.canAddressBooksShare,
  ],
];

function internalRedirectPath(redirect?: string | null): string | undefined {
  if (!redirect?.startsWith('/') || redirect.startsWith('//')) return;
  try {
    const base = 'https://console.invalid';
    const url = new URL(redirect, base);
    if (url.origin !== base || url.pathname === '/') return;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return;
  }
}

function canAccessPath(pathname: string, access: AccessCapabilities): boolean {
  const isOneSegmentDetail = (prefix: string) =>
    new RegExp(`^${prefix}/[^/]+$`).test(pathname);
  if (
    pathname === '/user/center' ||
    pathname === '/web-client' ||
    pathname === '/address-book' ||
    pathname === '/address-book/personal'
  ) {
    return true;
  }
  if (
    pathname === '/address-book/shared' ||
    isOneSegmentDetail('/address-book/shared')
  ) {
    return true;
  }
  if (pathname === '/dashboard') return access.isSuperAdmin;
  if (pathname === '/devices') return access.canDevicesView;
  if (pathname === '/users') return access.canUsersView;
  if (pathname === '/groups') return access.canGroups;
  if (pathname === '/groups/user' || isOneSegmentDetail('/groups/user')) {
    return access.canUserGroupsView;
  }
  if (
    pathname === '/groups/device' ||
    isOneSegmentDetail('/groups/device') ||
    pathname === '/custom-client' ||
    pathname === '/settings' ||
    [
      '/settings/general',
      '/settings/smtp',
      '/settings/oidc-providers',
      '/settings/ldap',
    ].includes(pathname)
  ) {
    return access.isSuperAdmin;
  }
  if (pathname === '/roles') return access.canRolesView;
  if (pathname === '/audits') {
    return access.canAuditConnectionAccess || access.canAuditView;
  }
  if (pathname === '/audits/conn') return access.canAuditConnectionAccess;
  if (['/audits/file', '/audits/alarm', '/audits/console'].includes(pathname)) {
    return access.canAuditView;
  }
  if (pathname === '/strategy') return access.canStrategiesAccess;
  return false;
}

export function resolvePostLoginPath(
  redirect: string | null | undefined,
  state: AccessState,
): string {
  const access = createAccess(state);
  const internalPath = internalRedirectPath(redirect);
  if (internalPath) {
    const { pathname } = new URL(internalPath, 'https://console.invalid');
    if (canAccessPath(pathname, access)) return internalPath;
  }

  return (
    DEFAULT_DESTINATIONS.find(([, allowed]) => allowed(access))?.[0] ||
    '/address-book/personal'
  );
}

export function getDeviceInfo(): API.DeviceInfo {
  const browser = Bowser.getParser(window.navigator.userAgent);
  return {
    os: browser.getOSName(true),
    type: 'browser',
    name: `${browser.getBrowserName()} - ${browser.getBrowserVersion()}`,
  };
}

export function parseOidcOptions(res: string[]): API.OidcLoginInfo[] {
  const ops: API.OidcLoginInfo[] = [];
  for (const item of res) {
    if (item.startsWith('common-oidc/')) {
      try {
        const parsed = JSON.parse(item.substring('common-oidc/'.length));
        if (Array.isArray(parsed)) {
          ops.push(...parsed);
        }
      } catch {
        // Skip malformed JSON entries
      }
    } else if (item.startsWith('oidc/')) {
      ops.push({ name: item.substring('oidc/'.length) });
    }
  }
  return ops;
}
