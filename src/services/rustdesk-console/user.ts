import { request } from '@umijs/max';

// Admin user list (management panel)
export async function getAdminUserList(
  params: API.AdminUserListParams,
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.UserItem>>('/api/admin/users', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function createUser(data: API.CreateUserParams) {
  return request('/api/users', { method: 'POST', data });
}

export async function inviteUser(data: API.InviteUserParams) {
  return request('/api/users/invite', { method: 'POST', data });
}

export async function updateUser(guid: string, data: API.UpdateUserParams) {
  return request(`/api/users/${guid}`, { method: 'PATCH', data });
}

export async function deleteUser(guid: string) {
  return request(`/api/users/${guid}`, { method: 'DELETE' });
}

export async function updateUserSecurity(
  guid: string,
  data: API.UpdateUserSecurityParams,
) {
  return request(`/api/users/${guid}/security`, { method: 'PATCH', data });
}

export async function forceLogoutUser(guid: string) {
  return request(`/api/users/${guid}/sessions`, { method: 'DELETE' });
}

// Batch operations
export async function batchUpdateUserStatus(
  data: API.BatchUpdateUserStatusParams,
) {
  return request<API.BatchResult>('/api/users/batch/status', {
    method: 'PATCH',
    data,
  });
}

export async function batchUpdateUserSecurity(
  data: API.BatchUpdateUserSecurityParams,
) {
  return request('/api/users/batch/security', { method: 'PATCH', data });
}

export async function batchForceLogout(data: API.BatchForceLogoutParams) {
  return request('/api/users/batch/sessions', { method: 'DELETE', data });
}
