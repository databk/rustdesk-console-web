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
  const permissionSet = new Set(initialState?.permissions?.permissions || []);
  const hasPermission = (code: string) =>
    isSuperAdmin || permissionSet.has(code);

  return {
    // Keep the legacy key for pages that have not yet been migrated.
    canAdmin: isSuperAdmin,
    isSuperAdmin,
    permissions: [...permissionSet],
    hasPermission,
    canDevicesView: hasPermission('devices.view'),
    canDevicesEdit: hasPermission('devices.edit'),
    canDevicesStatus: hasPermission('devices.status'),
    canDevicesDelete: hasPermission('devices.delete'),
    canDevicesDisconnect: hasPermission('devices.disconnect'),
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
    canAuditView: hasPermission('audit.view'),
    canGroups: isSuperAdmin || hasPermission('user_groups.view'),
  };
}
