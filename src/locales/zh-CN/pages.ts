import strategies from './pages/strategies';
import users from './pages/users';
import audits from './pages/audits';
import roles from './pages/roles';
import user from './pages/user';
import addressBook from './pages/addressBook';
import devices from './pages/devices';
import customClient from './pages/customClient';
import ldap from './pages/ldap';
import oidcProviders from './pages/oidcProviders';
import webClientSettings from './pages/webClientSettings';
import login from './pages/login';
import userGroups from './pages/userGroups';
import settings from './pages/settings';
import dashboard from './pages/dashboard';
import serverSettings from './pages/serverSettings';
import common from './pages/common';

export default {
  ...strategies,
  ...users,
  ...audits,
  ...roles,
  ...user,
  ...addressBook,
  ...devices,
  ...customClient,
  ...ldap,
  ...oidcProviders,
  ...webClientSettings,
  ...login,
  ...userGroups,
  ...settings,
  ...dashboard,
  ...serverSettings,
  ...common,
};
