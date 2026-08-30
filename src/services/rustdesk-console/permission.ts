import { request } from '@umijs/max';

/**
 * The permission catalog is owned by the backend.  The frontend only renders
 * the definitions returned by this endpoint and never invents permission
 * identifiers.
 */
export async function getPermissionList(options?: { [key: string]: any }) {
  return request<{ data: API.PermissionItem[] }>('/api/permissions', {
    method: 'GET',
    ...(options || {}),
  });
}

/** Load the caller's current effective permissions and scopes. */
export async function getMyPermissions(options?: { [key: string]: any }) {
  return request<API.EffectivePermissions>('/api/permissions/me', {
    method: 'GET',
    ...(options || {}),
  });
}
