import { request } from '@umijs/max';

export async function login(body: API.LoginParams) {
  return request<API.LoginResult>('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  });
}

export async function logout() {
  return request('/api/logout', { method: 'POST' });
}

export async function currentUser() {
  return request<API.CurrentUser>('/api/currentUser', { method: 'POST' });
}

export const getCurrentUser = currentUser;
