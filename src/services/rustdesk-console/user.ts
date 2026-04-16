import { request } from '@umijs/max';

export async function getUserList(
  params: {
    current?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.UserItem>>('/api/users', {
    method: 'GET',
    params: {
      current: params.current || 1,
      pageSize: params.pageSize || 20,
      search: params.search,
      status: params.status,
    },
    ...(options || {}),
  });
}

export async function createUser(data: API.CreateUserParams) {
  return request('/api/users', { method: 'POST', data });
}

export async function inviteUser(data: API.InviteUserParams) {
  return request('/api/users/invite', { method: 'POST', data });
}

export async function enableUser(guid: string) {
  return request(`/api/users/${guid}/enable`, { method: 'POST' });
}

export async function disableUser(guid: string) {
  return request(`/api/users/${guid}/disable`, { method: 'POST' });
}

export async function deleteUser(guid: string) {
  return request(`/api/users/${guid}`, { method: 'DELETE' });
}

export async function forceLogout(data: { guid: string }) {
  return request('/api/users/force-logout', { method: 'POST', data });
}

export async function enforce2FA(data: { enforce: boolean }) {
  return request('/api/users/tfa/totp/enforce', { method: 'PUT', data });
}

export async function disableLoginVerification() {
  return request('/api/users/disable_login_verification', { method: 'PUT' });
}
