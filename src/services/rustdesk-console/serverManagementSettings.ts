import { request } from '@umijs/max';

/**
 * Get server management configuration (token masked)
 * Always returns; `configured` is false when nothing is stored yet
 */
export async function getServerManagementSettings() {
  return request<API.ServerManagementSettings>(
    '/api/settings/server-management',
    {
      method: 'GET',
      skipErrorHandler: true,
    },
  );
}

/**
 * Create or update server management configuration (upsert)
 * A masked token ("******") keeps the stored token unchanged
 */
export async function updateServerManagementSettings(
  data: API.UpdateServerManagementSettingsParams,
) {
  return request<API.ServerManagementSettings>(
    '/api/settings/server-management',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data,
      skipErrorHandler: true,
    },
  );
}