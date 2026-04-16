import { request } from '@umijs/max';

export async function getCustomClientList(
  params?: {
    current?: number;
    pageSize?: number;
    search?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.CustomClientItem>>('/api/custom-clients', {
    method: 'GET',
    params: {
      current: params?.current || 1,
      pageSize: params?.pageSize || 20,
      search: params?.search,
    },
    ...(options || {}),
  });
}

export async function createCustomClient(data: API.CreateCustomClientParams) {
  return request<API.CustomClientItem>('/api/custom-clients', { method: 'POST', data });
}

export async function updateCustomClient(guid: string, data: API.UpdateCustomClientParams) {
  return request<API.CustomClientItem>(`/api/custom-clients/${guid}`, { method: 'PUT', data });
}

export async function deleteCustomClient(guid: string) {
  return request(`/api/custom-clients/${guid}`, { method: 'DELETE' });
}

export async function downloadCustomClient(guid: string, options?: { [key: string]: any }) {
  return request(`/api/custom-clients/${guid}/download`, {
    method: 'GET',
    responseType: 'blob',
    ...(options || {}),
  });
}
