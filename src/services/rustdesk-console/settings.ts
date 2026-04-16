import { request } from '@umijs/max';

export async function getSettings(options?: { [key: string]: any }) {
  return request<API.SettingItem[]>('/api/settings', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getSetting(key: string, options?: { [key: string]: any }) {
  return request<API.SettingItem>(`/api/settings/${key}`, {
    method: 'GET',
    ...(options || {}),
  });
}

export async function updateSetting(key: string, value: string | number | boolean) {
  return request(`/api/settings/${key}`, { method: 'PUT', data: { value } });
}

export async function batchUpdateSettings(data: Record<string, any>) {
  return request('/api/settings/batch', { method: 'POST', data });
}
