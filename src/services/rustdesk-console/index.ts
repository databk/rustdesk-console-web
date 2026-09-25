export { login, logout, currentUser } from './auth';
export { getPermissionList, getMyPermissions } from './permission';
export {
  getUserRoles,
  getUserRoleEligibility,
  replaceUserRoles,
} from './userRole';
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
  getStrategyTargetDeviceGroupList,
  createDeviceGroup,
  updateDeviceGroup,
  deleteDeviceGroup,
  addDeviceToGroup,
  removeDeviceFromGroup,
  getAccessibleGroups,
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
  getWebSharedAddressBook,
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
  getAddressBookShareCandidates,
  deleteRules,
  addRule,
  updateRule,
} from './addressBook';
export {
  getConnectionAudits,
  getActiveConnections,
  getFileAudits,
  getAlarmAudits,
  getConsoleAudits,
  updateConnectionAudit,
  disconnectConnection,
} from './audit';
export { getDashboard, getDashboardTrends } from './dashboard';
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
  sortOidcProviderList,
} from './oidcProvider';
export {
  getStrategyList,
  getStrategyCandidates,
  getStrategy,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  assignStrategy,
  unassignStrategy,
  getStrategyAssignments,
  getStrategyTargetCandidates,
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
export {
  passkeyRegisterBegin,
  passkeyRegisterVerify,
  passkeyAuthBegin,
  passkeyAuthVerify,
  getPasskeyList,
  deletePasskey,
  togglePasskeyTfa,
} from './passkey';
export { getSessions, revokeSession } from './session';
