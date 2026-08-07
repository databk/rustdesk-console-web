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
  return request<API.UserGroupItem>('/api/user-groups', {
    method: 'POST',
    data,
    skipErrorHandler: true,
  });
}

export async function updateUserGroup(guid: string, data: API.UpdateUserGroupParams) {
  return request<API.UserGroupItem>(`/api/user-groups/${guid}`, {
    method: 'PUT',
    data,
    skipErrorHandler: true,
  });
}

export async function deleteUserGroup(guid: string) {
  return request(`/api/user-groups/${guid}`, {
    method: 'DELETE',
    skipErrorHandler: true,
  });
}

export async function getUserGroupUsers(
  guid: string,
  params?: {
    current?: number;
    pageSize?: number;
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
    skipErrorHandler: true,
  });
}

export async function getAllUserGroups() {
  const first = await getUserGroupList({ current: 1, pageSize: 100 });
  const groups = [...(first.data || [])];
  for (let current = 2; groups.length < first.total; current += 1) {
    const page = await getUserGroupList({ current, pageSize: 100 });
    if (!page.data?.length) break;
    groups.push(...page.data);
  }
  return groups;
}
