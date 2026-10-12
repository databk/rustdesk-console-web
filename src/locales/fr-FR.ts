import component from './fr-FR/component';
import globalHeader from './fr-FR/globalHeader';
import menu from './fr-FR/menu';
import pages from './fr-FR/pages';
import pwa from './fr-FR/pwa';
import settingDrawer from './fr-FR/settingDrawer';
import settings from './fr-FR/settings';
import webClient from './fr-FR/webClient';

export default {
  ...serverNetwork,
  'navBar.lang': 'Langues',
  'layout.user.link.help': 'Aide',
  'layout.user.link.privacy': 'Confidentialité',
  'layout.user.link.terms': "Conditions d'utilisation",
  'layout.user.logout': 'Déconnexion',
  'layout.user.accountCenter': 'Mon compte',
  ...globalHeader,
  ...menu,
  ...settingDrawer,
  ...settings,
  ...pwa,
  ...component,
  ...pages,
  ...webClient,
};
import serverNetwork from './fr-FR/serverNetwork';
