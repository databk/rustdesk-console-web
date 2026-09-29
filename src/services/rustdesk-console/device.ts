import { request } from '@umijs/max';

export async function getDeviceList(
  params: API.PageParams & {
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
    params,
    ...(options || {}),
  });
}

export async function getAdminDeviceList(
  params: API.PageParams & {
    id?: string;
    status?: string;
    is_online?: string;
    device_name?: string;
    user_name?: string;
    device_username?: string;
    os?: string;
    device_group_name?: string;
    device_group_guid?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.DeviceItem>>('/api/devices', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function batchUpdateDeviceStatus(params: {
  guids: string[];
  status: 'enabled' | 'disabled';
}) {
  const response = await request<{
    success: boolean;
    data: {
      succeeded: string[];
      failed: Array<{ guid: string; reason: string }>;
      total: number;
      succeededCount: number;
      failedCount: number;
    };
  }>('/api/devices/status', {
    method: 'PATCH',
    data: params,
  });

  const data = response?.data;
  if (
    !response ||
    typeof response !== 'object' ||
    !data ||
    !Array.isArray(data.succeeded) ||
    !Array.isArray(data.failed) ||
    typeof data.total !== 'number' ||
    typeof data.succeededCount !== 'number' ||
    typeof data.failedCount !== 'number'
  ) {
    throw new Error('Invalid batch device status response');
  }
  return data;
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
