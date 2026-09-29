import { request } from '@umijs/max';
import { loadAllPages } from '@/utils/pagination';

export async function getUserGroupList(
  params?: API.PageParams & {
    search?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.UserGroupItem>>('/api/user-groups', {
    method: 'GET',
    params,
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

export async function getUserGroupUsers(
  guid: string,
  params?: API.PageParams & {
    search?: string;
  },
) {
  return request<API.PaginatedResult<API.UserItem>>(
    `/api/user-groups/${guid}/users`,
    {
      method: 'GET',
      params,
    },
  );
}

export async function moveUsersToGroup(guid: string, userGuids: string[]) {
  return request<API.UserGroupMoveResult>(`/api/user-groups/${guid}/users`, {
    method: 'POST',
    data: { user_guids: userGuids },
  });
}

export async function getAllUserGroups() {
  return loadAllPages<API.UserGroupItem>((current) =>
    getUserGroupList({ current, pageSize: 100 }),
  );
}
