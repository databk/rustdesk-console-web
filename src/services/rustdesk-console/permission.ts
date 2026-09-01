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
  const response = await request<unknown>('/api/permissions/me', {
    method: 'GET',
    ...(options || {}),
  });
  const payload = response as Partial<API.EffectivePermissions> | null;
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray(payload.permissions) ||
    !payload.permissions.every(
      (permission) => typeof permission === 'string',
    ) ||
    !payload.scopes ||
    typeof payload.scopes !== 'object' ||
    Array.isArray(payload.scopes)
  ) {
    throw new Error('Invalid effective permissions response');
  }
  return payload as API.EffectivePermissions;
}
