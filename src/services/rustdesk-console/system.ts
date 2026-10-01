import { request } from '@umijs/max';

export async function checkUpdate(params: API.UpdateCheckParams, options?: { [key: string]: any }) {
  return request<API.UpdateCheckResult>('/api/update-check', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}
