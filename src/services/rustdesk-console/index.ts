export { login, logout, currentUser } from './auth';
export { getPermissionList, getMyPermissions } from './permission';
export { getUserRoles, replaceUserRoles, revokeUserRole } from './userRole';
export {
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  setup2FA,
  verify2FA,
  disable2FA,
  changePassword,
} from './account';
export {
  getDeviceList,
  getAdminDeviceList,
  batchUpdateDeviceStatus,
  deleteDevice,
  updateDevice,
  assignDevice,
} from './device';
export {
  getAdminUserList,
  createUser,
  inviteUser,
  updateUser,
  deleteUser,
  updateUserSecurity,
  forceLogoutUser,
  batchUpdateUserStatus,
  batchUpdateUserSecurity,
  batchForceLogout,
} from './user';
export {
  getDeviceGroupList,
  createDeviceGroup,
  updateDeviceGroup,
  deleteDeviceGroup,
  addDeviceToGroup,
  removeDeviceFromGroup,
  getAccessibleGroups,
  getAllDeviceGroups,
} from './deviceGroup';
export {
  getLegacyAddressBook,
  updateLegacyAddressBook,
  getAddressBookSettings,
  getPersonalAddressBook,
  getCustomAddressBooks,
  getAllCustomAddressBooks,
  addCustomAddressBook,
  updateCustomAddressBook,
  deleteCustomAddressBooks,
  getSharedAddressBooks,
  getWebSharedAddressBooks,
  addSharedAddressBook,
  updateSharedAddressBook,
  deleteSharedAddressBooks,
  getPeers,
  addPeer,
  updatePeer,
  deletePeer,
  getTags,
  addTag,
  renameTag,
  updateTagColor,
  deleteTag,
  getRules,
  deleteRules,
  addRule,
  updateRule,
} from './addressBook';
export {
  getConnectionAudits,
  getFileAudits,
  getAlarmAudits,
  getConsoleAudits,
  updateConnectionAudit,
  disconnectConnection,
} from './audit';
export {
  getDashboardOverview,
  getDashboardStatistics,
  getDashboardTrends,
  getDashboardRealtime,
} from './dashboard';
export { getSMTPConfig, updateSMTPConfig, testSMTPConfig } from './smtp';
export { getLdapConfig, updateLdapConfig, testLdapConfig } from './ldap';
export {
  getOidcProviderList,
  getOidcProvider,
  createOidcProvider,
  updateOidcProvider,
  deleteOidcProvider,
  toggleOidcProvider,
  testOidcProvider,
} from './oidcProvider';
export {
  getStrategyList,
  getStrategy,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  assignStrategy,
  unassignStrategy,
  getStrategyAssignments,
} from './strategy';
export { getSystemInfo, getLicenseStatus, checkUpdate } from './system';
export {
  createNexusLogin,
  pollNexusLoginStatus,
  getNexusBindStatus,
  unbindNexus,
  getBuildList,
  submitBuild,
  getBuildStatus,
  deleteBuild,
  getBuildFiles,
  downloadBuildFile,
} from './nexus';
