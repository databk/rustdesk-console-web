import { request } from '@umijs/max';

const isPermissionItem = (value: unknown): value is API.PermissionItem => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<API.PermissionItem>;
  return (
    typeof item.code === 'string' &&
    item.code.length > 0 &&
    typeof item.resource === 'string' &&
    typeof item.action === 'string' &&
    typeof item.name === 'string' &&
    typeof item.description === 'string' &&
    typeof item.assignable === 'boolean' &&
    typeof item.system_only === 'boolean' &&
    item.assignable !== item.system_only &&
    (item.scope === 'global' || item.scope === 'device_group') &&
    (item.requires === undefined ||
      (Array.isArray(item.requires) &&
        item.requires.every((permission) => typeof permission === 'string')))
  );
};

const isEffectivePermissionScope = (
  value: unknown,
): value is API.EffectivePermissionScope => {
  if (!value || typeof value !== 'object') return false;
  const scope = value as Partial<API.EffectivePermissionScope>;
  return (
    (scope.scope_type === 'global' || scope.scope_type === 'device_group') &&
    Array.isArray(scope.device_group_guids) &&
    scope.device_group_guids.every((guid) => typeof guid === 'string')
  );
};

/**
 * The permission catalog is owned by the backend.  The frontend only renders
 * the definitions returned by this endpoint and never invents permission
 * identifiers.
 */
export async function getPermissionList(options?: Record<string, unknown>) {
  const response = await request<unknown>('/api/permissions', {
    method: 'GET',
    ...(options || {}),
  });
  const data =
    response && typeof response === 'object'
      ? (response as { data?: unknown }).data
      : undefined;
  if (!Array.isArray(data) || data.length === 0 || !data.every(isPermissionItem)) {
    throw new Error('Invalid permission catalog response');
  }
  const codes = new Set(data.map((permission) => permission.code));
  if (codes.size !== data.length) {
    throw new Error('Invalid permission catalog response');
  }
  return { data };
}

/** Load the caller's current effective permissions and scopes. */
export async function getMyPermissions(options?: Record<string, unknown>) {
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
    Array.isArray(payload.scopes) ||
    !Object.values(payload.scopes).every(isEffectivePermissionScope)
  ) {
    throw new Error('Invalid effective permissions response');
  }
  return payload as API.EffectivePermissions;
}
