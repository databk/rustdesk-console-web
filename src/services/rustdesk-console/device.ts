import { request } from '@umijs/max';

export async function getDeviceList(
  params: {
    current?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.DeviceItem>>('/api/devices', {
    method: 'GET',
    params: {
      current: params.current || 1,
      pageSize: params.pageSize || 20,
      search: params.search,
      status: params.status,
    },
    ...(options || {}),
  });
}

export async function enableDevice(uuid: string) {
  return request(`/api/devices/${uuid}/enable`, { method: 'POST' });
}

export async function disableDevice(uuid: string) {
  return request(`/api/devices/${uuid}/disable`, { method: 'POST' });
}

export async function deleteDevice(uuid: string) {
  return request(`/api/devices/${uuid}`, { method: 'DELETE' });
}

export async function assignDevice(guid: string, data: Record<string, any>) {
  return request(`/api/devices/${guid}/assign`, {
    method: 'POST',
    data,
  });
}
