import { request } from '@umijs/max';

export async function getDeviceList(
  params: {
    current?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    accessible?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.DeviceItem>>('/api/peers', {
    method: 'GET',
    params: {
      current: params.current || 1,
      pageSize: params.pageSize || 20,
      search: params.search,
      status: params.status || 'all',
      accessible: params.accessible || 'all',
    },
    ...(options || {}),
  });
}

export async function enableDevice(guid: string) {
  return request(`/api/devices/${guid}/enable`, { method: 'POST' });
}

export async function disableDevice(guid: string) {
  return request(`/api/devices/${guid}/disable`, { method: 'POST' });
}

export async function deleteDevice(guid: string) {
  return request(`/api/devices/${guid}`, { method: 'DELETE' });
}

export async function assignDevice(guid: string, data: Record<string, any>) {
  return request(`/api/devices/${guid}/assign`, {
    method: 'POST',
    data,
  });
}
