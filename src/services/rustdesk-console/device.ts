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

export async function batchUpdateDeviceStatus(params: {
  guids: string[];
  status: 'enabled' | 'disabled';
}) {
  return request<{
    succeeded: string[];
    failed: Array<{ guid: string; reason: string }>;
    total: number;
    succeededCount: number;
    failedCount: number;
  }>('/api/devices/status', {
    method: 'PATCH',
    data: params,
  });
}

export async function deleteDevice(guid: string) {
  return request(`/api/devices/${guid}`, { method: 'DELETE' });
}

export async function updateDevice(
  guid: string,
  data: API.UpdateDeviceParams,
) {
  return request(`/api/devices/${guid}`, {
    method: 'PATCH',
    data,
  });
}

export async function assignDevice(guid: string, data: Record<string, any>) {
  return request(`/api/peers/${guid}/assign`, {
    method: 'POST',
    data,
  });
}
