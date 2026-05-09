import { LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import React, { useEffect } from 'react';
import { AvatarDropdown, AvatarName, Footer, SelectLang, ThemeToggle } from '@/components';
import { currentUser as queryCurrentUser } from '@/services/rustdesk-console/auth';
import { getToken } from '@/utils/auth';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import '@ant-design/v5-patch-for-react-19';

const isDev = process.env.NODE_ENV === 'development' || process.env.CI;
const loginPath = '/user/login';

const THEME_KEY = 'rustdesk_theme_settings';
const TOKEN_KEY = 'rustdesk_access_token';

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
  };

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
  
  useEffect(() => {
    let isMounted = true;
    
    const syncAuthState = async () => {
      if (!isMounted) return;
      
      const token = getToken();
      
      try {
        if (token) {
          const userInfo = await queryCurrentUser();
          if (isMounted && userInfo) {
            setInitialState((s) => ({
              ...s,
              currentUser: userInfo,
            }));
          } else if (isMounted) {
            setInitialState((s) => ({
              ...s,
              currentUser: undefined,
            }));
            
            const { pathname } = window.location;
            if (pathname !== loginPath && isMounted) {
              history.push(loginPath);
            }
          }
        } else {
          if (isMounted) {
            setInitialState((s) => ({
              ...s,
              currentUser: undefined,
            }));
            
            const { pathname } = window.location;
            if (pathname !== loginPath && isMounted) {
              history.push(loginPath);
            }
          }
        }
      } catch (error) {
        console.error('Failed to sync auth state:', error);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY || e.key === null) {
        syncAuthState();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setInitialState]);

  return {
    actionsRender: () => [<ThemeToggle key="ThemeToggle" />, <SelectLang key="SelectLang" />],
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
      const token = getToken();
      
      if (!token && location.pathname !== loginPath) {
        history.push(loginPath);
      } else if (token && !initialState?.currentUser && location.pathname !== loginPath) {
        queryCurrentUser()
          .then((userInfo) => {
            if (userInfo) {
              setInitialState((s) => ({
                ...s,
                currentUser: userInfo,
              }));
            } else {
              history.push(loginPath);
            }
          })
          .catch(() => {
            history.push(loginPath);
          });
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
              storeThemeSettings(settings);
              setInitialState((preInitialState) => ({
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
