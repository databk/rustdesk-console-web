import { history, useModel } from '@umijs/max';
import React, { useEffect, useRef } from 'react';
import { getMyPermissions } from '@/services/rustdesk-console/permission';
import { getToken, TOKEN_KEY } from '@/utils/auth';

const loginPath = '/user/login';

/** Keep authentication and effective permissions in sync across tabs/events. */
export const AuthSync: React.FC = () => {
  const { setInitialState, refresh } = useModel('@@initialState');
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
      if (e.key !== TOKEN_KEY) return;

      permissionRefreshRef.current += 1;
      if (!getToken()) {
        setInitialState((s) => ({
          ...s,
          currentUser: undefined,
          permissions: undefined,
        }));
        if (history.location.pathname !== loginPath) {
          history.push(loginPath);
        }
        return;
      }

      // A non-empty token can represent a different account in another tab.
      // Refresh unconditionally so identity and permissions cannot go stale.
      refresh();
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
  }, [setInitialState, refresh]);

  return null;
};

export default AuthSync;
