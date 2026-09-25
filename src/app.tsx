import { LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { getAllLocales, history, Link, setLocale } from '@umijs/max';
import React from 'react';
import {
  AvatarDropdown,
  AvatarName,
  Footer,
  SelectLang,
  ThemeToggle,
} from '@/components';
import { currentUser as queryCurrentUser } from '@/services/rustdesk-console/auth';
import { getMyPermissions } from '@/services/rustdesk-console/permission';
import { getFrontendSettings } from '@/services/rustdesk-console/settings';
import { getToken, removeToken } from '@/utils/auth';
import {
  DEFAULT_FRONTEND_SETTINGS,
  getUsernameWatermark,
} from '@/utils/generalSettings';
import defaultSettings from '../config/defaultSettings';
import AuthSync from './components/AuthSync';
import { errorConfig } from './requestErrorConfig';

const isDev = process.env.NODE_ENV === 'development' || process.env.CI;
const loginPath = '/user/login';
const LOCALE_STORAGE_KEY = 'umi_locale';

function applyDefaultLanguage(lang?: string) {
  if (!lang) return;
  try {
    if (localStorage.getItem(LOCALE_STORAGE_KEY)) return;
    const supported = getAllLocales();
    if (supported.includes(lang)) {
      setLocale(lang, false);
    }
  } catch {
    // ignore locale application failures
  }
}

const THEME_KEY = 'rustdesk_theme_settings';

function getStoredThemeSettings(): Partial<LayoutSettings> | undefined {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return undefined;
}

function storeThemeSettings(settings: Partial<LayoutSettings>) {
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  permissions?: API.EffectivePermissions;
  permissionsLoadFailed?: boolean;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  fetchPermissions?: () => Promise<API.EffectivePermissions | undefined>;
  frontendSettings?: API.FrontendSettings;
}> {
  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser();
      return msg;
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 401) {
        history.push(loginPath);
      }
    }
    return undefined;
  };
  const fetchPermissions = () => getMyPermissions({ skipErrorHandler: true });
  const storedTheme = getStoredThemeSettings();
  const initialSettings = {
    ...(defaultSettings as Partial<LayoutSettings>),
    ...storedTheme,
  };
  const frontendSettingsPromise = getFrontendSettings({
    skipErrorHandler: true,
  }).catch(() => DEFAULT_FRONTEND_SETTINGS);

  const { location } = history;
  if (![loginPath].includes(location.pathname) && getToken()) {
    const [currentUser, frontendSettings] = await Promise.all([
      fetchUserInfo(),
      frontendSettingsPromise,
    ]);
    let authenticatedUser = currentUser;
    let permissions: API.EffectivePermissions | undefined;
    let permissionsLoadFailed = false;
    if (authenticatedUser) {
      try {
        permissions = await fetchPermissions();
      } catch (error: unknown) {
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        if (status === 401) {
          removeToken();
          authenticatedUser = undefined;
          history.push(loginPath);
        } else {
          permissionsLoadFailed = true;
          if (history.location.pathname !== '/address-book/personal') {
            history.push('/address-book/personal');
          }
        }
      }
    }
    applyDefaultLanguage(frontendSettings.defaultLanguage);
    return {
      fetchUserInfo,
      fetchPermissions,
      currentUser: authenticatedUser,
      permissions,
      permissionsLoadFailed,
      settings: initialSettings,
      frontendSettings,
    };
  }
  const frontendSettings = await frontendSettingsPromise;
  applyDefaultLanguage(frontendSettings.defaultLanguage);
  return {
    fetchUserInfo,
    fetchPermissions,
    settings: initialSettings,
    frontendSettings,
  };
}

export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  const frontendSettings =
    initialState?.frontendSettings || DEFAULT_FRONTEND_SETTINGS;
  const waterMarkProps = getUsernameWatermark(
    frontendSettings,
    initialState?.currentUser?.name,
  );

  return {
    ...initialState?.settings,
    actionsRender: () => [
      <ThemeToggle key="ThemeToggle" />,
      <SelectLang key="SelectLang" />,
    ],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    ...(waterMarkProps ? { waterMarkProps } : {}),
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    bgLayoutImgList: [],
    links: isDev
      ? [
          <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
            <LinkOutlined />
            <span>OpenAPI</span>
          </Link>,
        ]
      : [],
    menuHeaderRender: undefined,
    childrenRender: (children) => {
      return (
        <>
          <AuthSync />
          {children}
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                storeThemeSettings(settings);
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
  };
};

export const request: RequestConfig = {
  ...errorConfig,
};
