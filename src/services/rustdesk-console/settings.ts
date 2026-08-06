import { request } from '@umijs/max';

export async function getFrontendSettings(options?: { [key: string]: any }) {
  return request<API.FrontendSettings>('/api/settings/frontend', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getGeneralSettings(options?: { [key: string]: any }) {
  return request<API.GeneralSettings>('/api/settings/general', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function updateGeneralSettings(data: API.GeneralSettings) {
  return request<API.GeneralSettings>('/api/settings/general', {
    method: 'PUT',
    data,
  });
}
