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
  return request('/api/device-groups', { method: 'POST', data });
}

export async function updateDeviceGroup(guid: string, data: API.UpdateDeviceGroupParams) {
  return request(`/api/device-groups/${guid}`, { method: 'PATCH', data });
}

export async function deleteDeviceGroup(guid: string) {
  return request(`/api/device-groups/${guid}`, { method: 'DELETE' });
}

export async function addDeviceToGroup(guid: string, deviceIds: string[]) {
  return request(`/api/device-groups/${guid}`, { method: 'POST', data: deviceIds });
}

export async function removeDeviceFromGroup(guid: string, deviceIds: string[]) {
  return request(`/api/device-groups/${guid}/devices`, { method: 'DELETE', data: deviceIds });
}

export async function getAccessibleGroups() {
  return request('/api/device-group/accessible', { method: 'GET' });
}

/** Load all existing groups through the paginated admin endpoint. */
export async function getAllDeviceGroups(options?: { [key: string]: any }) {
  const groups: API.DeviceGroupItem[] = [];
  let current = 1;
  let total = 0;
  do {
    const page = await getDeviceGroupList(
      { current, pageSize: 100 },
      options,
    );
    if (!Array.isArray(page.data) || typeof page.total !== 'number') {
      throw new Error('Invalid device group response');
    }
    groups.push(...page.data);
    total = page.total;
    current += 1;
    if (!page.data.length) break;
  } while (groups.length < total);
  return groups;
}
