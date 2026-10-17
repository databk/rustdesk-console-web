import { request } from '@umijs/max';

/**
 * Get web client configuration
 * Returns 404 when the configuration does not exist yet
 */
export async function getWebClientSettings() {
  return request<API.WebClientSettings>('/api/settings/web-client', {
    method: 'GET',
    skipErrorHandler: true,
  });
}

/**
 * Create or update web client configuration (upsert)
 * The merged configuration must be fully valid when enabled
 */
export async function updateWebClientSettings(
  data: API.UpdateWebClientSettingsParams,
) {
  return request<API.WebClientSettings>('/api/settings/web-client', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data,
    skipErrorHandler: true,
  });
}