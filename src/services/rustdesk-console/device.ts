import { request } from '@umijs/max';

export async function getDeviceList(
  params: {
    current?: number;
    pageSize?: number;
    id?: string;
    status?: string;
    is_online?: string;
    user_name?: string;
    device_group_name?: string;
    device_group_guid?: string;
    os?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.DeviceItem>>('/api/peers', {
    method: 'GET',
    params: {
      current: params.current || 1,
      pageSize: params.pageSize || 20,
      id: params.id,
      status: params.status,
      is_online: params.is_online,
      user_name: params.user_name,
      device_group_name: params.device_group_name,
      device_group_guid: params.device_group_guid,
      os: params.os,
    },
    ...(options || {}),
  });
}

export async function enableDevice(guid: string) {
  return request(`/api/peers/${guid}/enable`, { method: 'POST' });
}

export async function disableDevice(guid: string) {
  return request(`/api/peers/${guid}/disable`, { method: 'POST' });
}

export async function deleteDevice(guid: string) {
  return request(`/api/peers/${guid}`, { method: 'DELETE' });
}

export async function assignDevice(guid: string, data: Record<string, any>) {
  return request(`/api/peers/${guid}/assign`, {
    method: 'POST',
    data,
  });
}
