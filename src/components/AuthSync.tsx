import { history, useIntl, useModel } from '@umijs/max';
import { Alert, Button } from 'antd';
import React, { useEffect, useRef } from 'react';
import { getMyPermissions } from '@/services/rustdesk-console/permission';
import { getToken, removeToken, TOKEN_KEY } from '@/utils/auth';
import { PERMISSIONS_STALE_EVENT } from '../requestErrorConfig';

const loginPath = '/user/login';

const AuthSync: React.FC = () => {
  const { initialState, setInitialState, refresh } = useModel('@@initialState');
  const intl = useIntl();
  const permissionRefreshRef = useRef(0);

  useEffect(() => {
    const handleSessionExpired = () => {
      permissionRefreshRef.current += 1;
      setInitialState((state) => ({
        ...state,
        currentUser: undefined,
        permissions: undefined,
        permissionsLoadFailed: false,
      }));
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== TOKEN_KEY) return;
      permissionRefreshRef.current += 1;
      if (!getToken()) {
        setInitialState((state) => ({
          ...state,
          currentUser: undefined,
          permissions: undefined,
          permissionsLoadFailed: false,
        }));
        if (history.location.pathname !== loginPath) {
          history.push(loginPath);
        }
      } else {
        refresh();
      }
    };

    const handlePermissionsStale = async () => {
      const requestId = ++permissionRefreshRef.current;
      try {
        const permissions = await getMyPermissions({ skipErrorHandler: true });
        if (requestId !== permissionRefreshRef.current) return;
        setInitialState((state) => ({
          ...state,
          permissions,
          permissionsLoadFailed: false,
        }));
      } catch (error: unknown) {
        if (requestId !== permissionRefreshRef.current) return;
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        if (status === 401) {
          removeToken();
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
          history.push(loginPath);
        }
      }
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(PERMISSIONS_STALE_EVENT, handlePermissionsStale);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(
        PERMISSIONS_STALE_EVENT,
        handlePermissionsStale,
      );
    };
  }, [setInitialState, refresh]);

  if (!initialState?.permissionsLoadFailed) return null;

  return (
    <Alert
      banner
      type="warning"
      title={intl.formatMessage({
        id: 'pages.login.permissionsLoadFailed',
        defaultMessage:
          'Permissions could not be loaded. Opened the personal address book; refresh to retry.',
      })}
      action={
        <Button size="small" onClick={() => void refresh()}>
          {intl.formatMessage({
            id: 'pages.login.permissionsRetry',
            defaultMessage: 'Retry',
          })}
        </Button>
      }
    />
  );
};

export default AuthSync;
