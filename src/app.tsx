import { LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import React from 'react';
import { AvatarDropdown, AvatarName, Footer, SelectLang, ThemeSwitcher } from '@/components';
import ThemeProvider from '@/components/ThemeProvider';
import { currentUser as queryCurrentUser } from '@/services/rustdesk-console/auth';
import { getToken } from '@/utils/auth';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import '@ant-design/v5-patch-for-react-19';

const isDev = process.env.NODE_ENV === 'development' || process.env.CI;
const loginPath = '/user/login';

const THEME_KEY = 'rustdesk_theme_settings';

function getStoredThemeSettings(): any {
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

function storeThemeSettings(settings: any) {
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  themeMode?: 'light' | 'dark';
}> {
  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser();
      return msg;
    } catch (_error) {
      history.push(loginPath);
    }
    return undefined;
  };
  const storedTheme = getStoredThemeSettings();
  const initialSettings = {
    ...(defaultSettings as Partial<LayoutSettings>),
    ...storedTheme,
  };

  const storedMode = storedTheme?.navTheme === 'dark' || storedTheme?.navTheme === 'realDark' ? 'dark' : 'light';

  const { location } = history;
  if (![loginPath].includes(location.pathname) && getToken()) {
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      settings: initialSettings,
      themeMode: storedMode,
    };
  }
  return {
    fetchUserInfo,
    settings: initialSettings,
    themeMode: storedMode,
  };
}

export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  const handleThemeChange = (mode: 'light' | 'dark') => {
    const newNavTheme = mode === 'dark' ? 'dark' : 'light';
    storeThemeSettings({ ...initialState?.settings, navTheme: newNavTheme });
    setInitialState((pre: any) => ({
      ...pre,
      settings: { ...pre?.settings, navTheme: newNavTheme },
      themeMode: mode,
    }));
  };

  return {
    actionsRender: () => [
      <ThemeSwitcher key="ThemeSwitcher" />,
      <SelectLang key="SelectLang" />,
    ],
    avatarProps: {
      src: undefined,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
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
          {children}
          <SettingDrawer
            disableUrlParams
            enableDarkTheme
            settings={initialState?.settings}
            onSettingChange={(settings: any) => {
              storeThemeSettings(settings);
              setInitialState((preInitialState: any) => ({
                ...preInitialState,
                settings,
                themeMode: settings.navTheme === 'dark' ? 'dark' : 'light',
              }));
            }}
          />
        </>
      );
    },
    ...initialState?.settings,
  };
};

export const request: RequestConfig = {
  ...errorConfig,
};

export function rootContainer(container: React.ReactNode) {
  const storedTheme = getStoredThemeSettings();
  const storedMode = storedTheme?.navTheme === 'dark' || storedTheme?.navTheme === 'realDark' ? 'dark' : 'light';
  
  // 应用初始主题类名
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (storedMode === 'dark') {
      root.classList.add('dark');
    }
  }

  return React.createElement(
    ThemeProvider,
    { mode: storedMode, children: container }
  );
}
