import { request } from '@umijs/max';

export async function getRoleList(
  params?: {
    current?: number;
    pageSize?: number;
    search?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.RoleItem>>('/api/roles', {
    method: 'GET',
    params: {
      current: params?.current || 1,
      pageSize: params?.pageSize || 20,
      search: params?.search,
    },
    ...(options || {}),
  });
}

export async function getRoleDetail(guid: string, options?: { [key: string]: any }) {
  return request<API.RoleItem>(`/api/roles/${guid}`, {
    method: 'GET',
    skipErrorHandler: true,
    ...(options || {}),
  });
}

export async function createRole(data: API.CreateRoleParams) {
  return request<API.RoleItem>('/api/roles', {
    method: 'POST',
    data,
    skipErrorHandler: true,
  });
}

export async function updateRole(guid: string, data: API.UpdateRoleParams) {
  return request<API.RoleItem>(`/api/roles/${guid}`, {
    method: 'PATCH',
    data,
    skipErrorHandler: true,
  });
}

export async function deleteRole(guid: string) {
  return request(`/api/roles/${guid}`, {
    method: 'DELETE',
    skipErrorHandler: true,
  });
}

export { getPermissionList } from './permission';
