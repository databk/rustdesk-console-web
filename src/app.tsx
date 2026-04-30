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
import { getStoredThemeSettings, storeThemeSettings, type ThemeSettings } from '@/utils/theme';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import '@ant-design/v5-patch-for-react-19';

const isDev = process.env.NODE_ENV === 'development' || process.env.CI;
const loginPath = '/user/login';

export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
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
  } as Partial<LayoutSettings>;

  const { location } = history;
  if (![loginPath].includes(location.pathname) && getToken()) {
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      settings: initialSettings,
    };
  }
  return {
    fetchUserInfo,
    settings: initialSettings,
  };
}

export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
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
            onSettingChange={(settings) => {
              storeThemeSettings(settings as ThemeSettings);
              setInitialState((preInitialState: any) => ({
                ...preInitialState,
                settings,
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
  return React.createElement(
    ThemeProvider,
    { mode: undefined, children: container }
  );
}