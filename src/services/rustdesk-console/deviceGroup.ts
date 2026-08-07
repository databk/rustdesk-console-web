import { request } from '@umijs/max';

export async function getDeviceGroupList(
  params: { current: number; pageSize: number; name?: string },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.DeviceGroupItem>>('/api/device-groups', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function createDeviceGroup(data: API.CreateDeviceGroupParams) {
  return request('/api/device-groups', {
    method: 'POST',
    data,
    skipErrorHandler: true,
  });
}

export async function updateDeviceGroup(guid: string, data: API.UpdateDeviceGroupParams) {
  return request(`/api/device-groups/${guid}`, {
    method: 'PATCH',
    data,
    skipErrorHandler: true,
  });
}

export async function deleteDeviceGroup(guid: string) {
  return request(`/api/device-groups/${guid}`, {
    method: 'DELETE',
    skipErrorHandler: true,
  });
}

export async function addDeviceToGroup(guid: string, deviceIds: string[]) {
  return request(`/api/device-groups/${guid}`, {
    method: 'POST',
    data: deviceIds,
    skipErrorHandler: true,
  });
}

export async function removeDeviceFromGroup(guid: string, deviceIds: string[]) {
  return request(`/api/device-groups/${guid}/devices`, {
    method: 'DELETE',
    data: deviceIds,
    skipErrorHandler: true,
  });
}

export async function getAccessibleGroups() {
  return request('/api/device-group/accessible', { method: 'GET' });
}
