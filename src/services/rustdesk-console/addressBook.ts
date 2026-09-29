import type { RequestOptions } from '@@/plugin-request/request';
import { request } from '@umijs/max';
import { loadAllPages } from '@/utils/pagination';

type ActionResponse = string | Record<string, unknown> | null | undefined;

async function actionRequest(url: string, options: RequestOptions) {
  const response = await request<ActionResponse>(url, options);
  if (
    response &&
    typeof response === 'object' &&
    typeof response.error === 'string' &&
    response.error
  ) {
    throw new Error(response.error);
  }
  return response;
}

export async function getLegacyAddressBook() {
  return request('/api/ab', { method: 'GET' });
}

export async function updateLegacyAddressBook(data: { data: string }) {
  return actionRequest('/api/ab', { method: 'POST', data });
}

export async function getAddressBookSettings() {
  return request<API.AddressBookSettings>('/api/ab/settings', { method: 'POST' });
}

export async function getPersonalAddressBook() {
  return request<{ guid: string }>('/api/ab/personal', { method: 'GET' });
}

export async function getCustomAddressBooks(
  params?: API.PageParams & {
    name?: string;
  },
) {
  return request<API.PaginatedResult<API.AddressBookProfile>>(
    '/api/ab/custom/profiles',
    { method: 'GET', params },
  );
}

export async function getAllCustomAddressBooks() {
  return loadAllPages<API.AddressBookProfile>((current) =>
    getCustomAddressBooks({ current, pageSize: 100 }),
  );
}

export async function addCustomAddressBook(
  data: API.AddSharedAddressBookParams,
) {
  return actionRequest('/api/ab/custom/add', {
    method: 'POST',
    data,
  });
}

export async function updateCustomAddressBook(
  data: API.UpdateSharedAddressBookParams,
) {
  return actionRequest('/api/ab/custom/update/profile', {
    method: 'PUT',
    data,
  });
}

export async function deleteCustomAddressBooks(guids: string[]) {
  return actionRequest('/api/ab/custom', {
    method: 'DELETE',
    data: { guids },
  });
}

export async function getSharedAddressBooks(
  params?: API.PageParams & { search?: string },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.SharedAddressBook>>('/api/ab/shared/profiles', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function addSharedAddressBook(data: API.AddSharedAddressBookParams) {
  return actionRequest('/api/ab/shared/add', { method: 'POST', data });
}

export async function getWebSharedAddressBooks(
  params?: API.PageParams & { name?: string },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.SharedAddressBook>>(
    '/api/ab/shared/list',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function getWebSharedAddressBook(guid: string) {
  return request<API.SharedAddressBook>(`/api/ab/shared/${guid}/access`, {
    method: 'GET',
    skipErrorHandler: true,
  });
}

export async function updateSharedAddressBook(data: API.UpdateSharedAddressBookParams) {
  return actionRequest('/api/ab/shared/update/profile', { method: 'PUT', data });
}

export async function deleteSharedAddressBooks(data: string[]) {
  return actionRequest('/api/ab/shared', { method: 'DELETE', data });
}

export async function getPeers(
  params: API.PageParams & {
    ab?: string;
    id?: string;
    alias?: string;
    tags?: string[];
    tagMode?: 'union' | 'intersection';
  },
) {
  const { tags, tagMode, ...restParams } = params;
  let url = '/api/ab/peers';
  const searchParams = new URLSearchParams();

  if (tags && tags.length > 0) {
    tags.forEach(tag => searchParams.append('tags', tag));
  }
  if (tags && tags.length > 1 && tagMode) {
    searchParams.set('tagMode', tagMode);
  }

  const queryString = searchParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  return request<API.PaginatedResult<API.PeerItem>>(url, {
    method: 'GET',
    params: restParams,
  });
}

export async function addPeer(guid: string, data: API.AddPeerParams) {
  return actionRequest(`/api/ab/peer/add/${guid}`, { method: 'POST', data });
}

export async function updatePeer(guid: string, data: API.UpdatePeerParams) {
  return actionRequest(`/api/ab/peer/update/${guid}`, { method: 'PUT', data });
}

export async function deletePeer(guid: string, data: string[]) {
  return actionRequest(`/api/ab/peer/${guid}`, { method: 'DELETE', data });
}

export async function getTags(guid: string) {
  return request<API.TagItem[]>(`/api/ab/tags/${guid}`, { method: 'GET' });
}

export async function addTag(guid: string, data: API.AddTagParams) {
  return actionRequest(`/api/ab/tag/add/${guid}`, { method: 'POST', data });
}

export async function renameTag(guid: string, data: API.RenameTagParams) {
  return actionRequest(`/api/ab/tag/rename/${guid}`, { method: 'PUT', data });
}

export async function updateTagColor(guid: string, data: API.UpdateTagParams) {
  return actionRequest(`/api/ab/tag/update/${guid}`, { method: 'PUT', data });
}

export async function deleteTag(guid: string, data: string[]) {
  return actionRequest(`/api/ab/tag/${guid}`, { method: 'DELETE', data });
}

export async function getRules(
  params: API.PageParams & { ab: string },
) {
  return request<API.PaginatedResult<API.RuleItem>>('/api/ab/rules', {
    method: 'GET',
    params,
  });
}

export async function getAllRules(ab: string) {
  return loadAllPages<API.RuleItem>((current) =>
    getRules({ ab, current, pageSize: 100 }),
  );
}

export async function getAddressBookShareCandidates(guid: string) {
  return request<API.AddressBookShareCandidates>(
    `/api/ab/shared/${guid}/share-candidates`,
    { method: 'GET' },
  );
}

export async function deleteRules(data: string[]) {
  return actionRequest('/api/ab/rules', { method: 'DELETE', data });
}

export async function addRule(data: API.CreateRuleParams) {
  return actionRequest('/api/ab/rule', { method: 'POST', data });
}

export async function updateRule(data: API.UpdateRuleParams) {
  return actionRequest('/api/ab/rule', { method: 'PATCH', data });
}
