export const TOKEN_KEY = 'rustdesk_access_token';
const REMEMBER_ME_KEY = 'rustdesk_remember_me';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, rememberMe: boolean = false) {
  localStorage.setItem(TOKEN_KEY, token);
  if (rememberMe) {
    localStorage.setItem(REMEMBER_ME_KEY, 'true');
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
  }
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
}

export function isRememberMe(): boolean {
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
}
