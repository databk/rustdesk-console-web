export const TOKEN_KEY = 'rustdesk_access_token';

export function getLoginPath(location: {
  pathname: string;
  search?: string;
  hash?: string;
}): string {
  const loginPath = '/user/login';
  const suffix = (location.search || '') + (location.hash || '');
  if (location.pathname === loginPath) return loginPath + suffix;
  if (location.pathname === '/web-client') {
    return `${loginPath}?redirect=${encodeURIComponent(`/web-client${suffix}`)}`;
  }
  return loginPath;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, rememberMe: boolean = false) {
  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

/** Extract the JWT ID (jti) from the current access token. */
export function getTokenJti(): string | null {
  const token = getToken();
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (payload.length % 4)) % 4;
    const decoded = JSON.parse(atob(payload + '='.repeat(padLen)));
    return decoded.jti || null;
  } catch {
    return null;
  }
}
