import { request } from '@umijs/max';

export async function getUserGroupList(
  params?: {
    current?: number;
    pageSize?: number;
    search?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.UserGroupItem>>('/api/user-groups', {
    method: 'GET',
    params: {
      current: params?.current || 1,
      pageSize: params?.pageSize || 20,
      search: params?.search,
    },
    ...(options || {}),
  });
}

export async function createUserGroup(data: API.CreateUserGroupParams) {
  return request<API.UserGroupItem>('/api/user-groups', { method: 'POST', data });
}

export async function updateUserGroup(guid: string, data: API.UpdateUserGroupParams) {
  return request<API.UserGroupItem>(`/api/user-groups/${guid}`, { method: 'PUT', data });
}

export async function deleteUserGroup(guid: string) {
  return request(`/api/user-groups/${guid}`, { method: 'DELETE' });
}
