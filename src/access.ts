export default function access(
  initialState:
    | {
        currentUser?: API.CurrentUser;
        permissions?: API.EffectivePermissions;
      }
    | undefined,
) {
  const { currentUser } = initialState ?? {};
  const isSuperAdmin = currentUser?.is_admin === true;
  const permissions = initialState?.permissions?.permissions;
  const permissionSet = new Set(Array.isArray(permissions) ? permissions : []);
  const hasPermission = (code: string) =>
    isSuperAdmin || permissionSet.has(code);

  const canDevicesDisconnect = hasPermission('devices.disconnect');
  const canAuditView = hasPermission('audit.view');

  return {
    canAdmin: isSuperAdmin,
    isSuperAdmin,
    permissions: [...permissionSet],
    hasPermission,
    canServersView: hasPermission('servers.view'),
    canServersControl: hasPermission('servers.control'),
    canServersConfig: hasPermission('servers.config'),
    canServersDisconnect: hasPermission('servers.disconnect'),
    canServersBan: hasPermission('servers.ban'),
    canDevicesView: hasPermission('devices.view'),
    canDevicesEdit: hasPermission('devices.edit'),
    canDevicesStatus: hasPermission('devices.status'),
    canDevicesDelete: hasPermission('devices.delete'),
    canDevicesDisconnect,
    canUsersView: hasPermission('users.view'),
    canUsersCreate: hasPermission('users.create'),
    canUsersEdit: hasPermission('users.edit'),
    canUsersStatus: hasPermission('users.status'),
    canUsersDelete: hasPermission('users.delete'),
    canUsersSecurity: hasPermission('users.security'),
    canUsersForceLogout: hasPermission('users.force_logout'),
    canUserGroupsView: hasPermission('user_groups.view'),
    canUserGroupsCreate: hasPermission('user_groups.create'),
    canUserGroupsEdit: hasPermission('user_groups.edit'),
    canUserGroupsDelete: hasPermission('user_groups.delete'),
    canUserGroupsMembership: hasPermission('user_groups.membership'),
    canAddressBooksView: hasPermission('address_books.view'),
    canAddressBooksEdit: hasPermission('address_books.edit'),
    canAddressBooksShare: hasPermission('address_books.share'),
    canStrategiesView: hasPermission('strategies.view'),
    canStrategiesCreate: hasPermission('strategies.create'),
    canStrategiesEdit: hasPermission('strategies.edit'),
    canStrategiesDelete: hasPermission('strategies.delete'),
    canStrategiesAssign: hasPermission('strategies.assign'),
    canStrategiesAccess:
      hasPermission('strategies.view') || hasPermission('strategies.assign'),
    canAuditView,
    canAuditConnectionAccess: canAuditView || canDevicesDisconnect,
    canGroups: isSuperAdmin || hasPermission('user_groups.view'),
    canRolesView: hasPermission('roles.view'),
    canRolesAssign:
      hasPermission('roles.assign') &&
      hasPermission('roles.view') &&
      hasPermission('users.view'),
  };
}
