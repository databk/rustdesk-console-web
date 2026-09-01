import component from './ru-RU/component';
import globalHeader from './ru-RU/globalHeader';
import menu from './ru-RU/menu';
import pages from './ru-RU/pages';
import pwa from './ru-RU/pwa';
import settingDrawer from './ru-RU/settingDrawer';
import settings from './ru-RU/settings';

export default {
  'navBar.lang': 'Языки',
  'layout.user.link.help': 'Помощь',
  'layout.user.link.privacy': 'Конфиденциальность',
  'layout.user.link.terms': 'Условия использования',
  'layout.user.logout': 'Выйти',
  'layout.user.accountCenter': 'Центр аккаунта',
  ...globalHeader,
  ...menu,
  ...settingDrawer,
  ...settings,
  ...pwa,
  ...component,
  ...pages,
};
