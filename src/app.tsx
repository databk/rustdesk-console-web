import { LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history, Link, useModel } from '@umijs/max';
import React, { useEffect, useRef } from 'react';
import {
  AvatarDropdown,
  AvatarName,
  Footer,
  SelectLang,
  ThemeToggle,
} from '@/components';
import { currentUser as queryCurrentUser } from '@/services/rustdesk-console/auth';
import { getMyPermissions } from '@/services/rustdesk-console/permission';
import { getToken, TOKEN_KEY } from '@/utils/auth';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import '@ant-design/v5-patch-for-react-19';

const isDev = process.env.NODE_ENV === 'development' || process.env.CI;
const loginPath = '/user/login';

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
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  fetchPermissions?: () => Promise<API.EffectivePermissions | undefined>;
}> {
  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser();
      return msg;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401) {
        history.push(loginPath);
      }
    }
    return undefined;
  };
  const fetchPermissions = async () => {
    try {
      return await getMyPermissions();
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401) {
        history.push(loginPath);
      }
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
    const permissions = currentUser ? await fetchPermissions() : undefined;
    return {
      fetchUserInfo,
      fetchPermissions,
      currentUser,
      permissions,
      settings: initialSettings,
    };
  }
  return {
    fetchUserInfo,
    fetchPermissions,
    settings: initialSettings,
  };
}

const AuthSync: React.FC = () => {
  const { initialState, setInitialState, refresh } = useModel('@@initialState');
  const permissionRefreshRef = useRef(0);

  useEffect(() => {
    const handleSessionExpired = () => {
      permissionRefreshRef.current += 1;
      setInitialState((s) => ({
        ...s,
        currentUser: undefined,
        permissions: undefined,
      }));
    };

    const handlePermissionsStale = async () => {
      const requestId = ++permissionRefreshRef.current;
      try {
        const permissions = await getMyPermissions({ skipErrorHandler: true });
        if (requestId !== permissionRefreshRef.current) return;
        setInitialState((s) => ({ ...s, permissions }));
      } catch (error: any) {
        if (requestId !== permissionRefreshRef.current) return;
        if (error?.response?.status === 401) {
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
          history.push(loginPath);
          return;
        }
        setInitialState((s) => ({ ...s, permissions: undefined }));
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        permissionRefreshRef.current += 1;
        if (!e.newValue) {
          setInitialState((s) => ({
            ...s,
            currentUser: undefined,
            permissions: undefined,
          }));
          if (history.location.pathname !== loginPath) {
            history.push(loginPath);
          }
        } else if (e.newValue && !initialState?.currentUser) {
          refresh();
        }
      }
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    window.addEventListener('auth:permissions-stale', handlePermissionsStale);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
      window.removeEventListener(
        'auth:permissions-stale',
        handlePermissionsStale,
      );
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initialState?.currentUser, setInitialState, refresh]);

  return null;
};

export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  return {
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
    ...initialState?.settings,
  };
};

export const request: RequestConfig = {
  ...errorConfig,
};
