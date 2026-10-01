import { request } from '@umijs/max';

export async function checkUpdate(params: API.UpdateCheckParams, options?: Record<string, unknown>) {
  return request<API.UpdateCheckResult>('/api/update-check', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}
