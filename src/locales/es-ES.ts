import webClient from './es-ES/webClient';
import component from './es-ES/component';
import globalHeader from './es-ES/globalHeader';
import menu from './es-ES/menu';
import pages from './es-ES/pages';
import pwa from './es-ES/pwa';
import settingDrawer from './es-ES/settingDrawer';
import settings from './es-ES/settings';
import serverNetwork from './es-ES/serverNetwork';

export default {
  ...serverNetwork,
  ...webClient,
  'navBar.lang': 'Idiomas',
  'layout.user.link.help': 'Ayuda',
  'layout.user.link.privacy': 'Privacidad',
  'layout.user.link.terms': 'Condiciones',
  'layout.user.logout': 'Cerrar sesión',
  'layout.user.accountCenter': 'Mi cuenta',
  ...globalHeader,
  ...menu,
  ...settingDrawer,
  ...settings,
  ...pwa,
  ...component,
  ...pages,
};
