import { request } from '@umijs/max';

export async function getUserRoles(
  userGuid: string,
  options?: { [key: string]: any },
) {
  return request<API.UserRolesResponse>(`/api/users/${userGuid}/roles`, {
    method: 'GET',
    skipErrorHandler: true,
    ...(options || {}),
  });
}

export async function replaceUserRoles(
  userGuid: string,
  data: API.ReplaceUserRolesParams,
) {
  return request<API.UserRolesResponse>(`/api/users/${userGuid}/roles`, {
    method: 'PUT',
    data,
    skipErrorHandler: true,
  });
}

export async function revokeUserRole(userGuid: string, roleGuid: string) {
  return request<{ message: string }>(
    `/api/users/${userGuid}/roles/${roleGuid}`,
    { method: 'DELETE', skipErrorHandler: true },
  );
}
