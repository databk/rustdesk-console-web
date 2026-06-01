import { request } from '@umijs/max';

export async function login(body: API.LoginParams) {
  return request<API.LoginResponse>('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    skipErrorHandler: true,
  });
}

export async function logout(body?: { id?: string; uuid?: string }) {
  return request('/api/logout', {
    method: 'POST',
    data: body,
  });
}

export async function currentUser() {
  return request<API.CurrentUser>('/api/currentUser', { method: 'POST' });
}

export async function getLoginOptions() {
  return request<string[]>('/api/login-options', {
    method: 'GET',
  });
}

export async function oidcAuth(body: API.OidcAuthParams) {
  return request<API.OidcAuthResponse>('/api/oidc/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  });
}

export const getCurrentUser = currentUser;
