import { request } from '@umijs/max';

export async function getUserRoles(
  userGuid: string,
  options?: Record<string, unknown>,
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

export async function getUserRoleEligibility(userGuid: string) {
  return request<API.UserRoleEligibilityResponse>(
    `/api/users/${userGuid}/roles/eligibility`,
    { method: 'GET', skipErrorHandler: true },
  );
}
