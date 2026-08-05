import { request } from '@umijs/max';

export async function getSystemInfo(options?: { [key: string]: any }) {
  return request<API.SystemInfo>('/api/system/info', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getLicenseStatus(options?: { [key: string]: any }) {
  return request<API.LicenseInfo>('/api/license/status', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function checkUpdate(params: API.UpdateCheckParams, options?: { [key: string]: any }) {
  return request<API.UpdateCheckResult>('/api/update-check', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function downloadConfig(options?: { [key: string]: any }) {
  return request('/api/config/download', {
    method: 'GET',
    responseType: 'blob',
    ...(options || {}),
  });
}

export async function downloadQRCode(options?: { [key: string]: any }) {
  return request('/api/config/qrcode', {
    method: 'GET',
    responseType: 'blob',
    ...(options || {}),
  });
}
