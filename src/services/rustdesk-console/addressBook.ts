import { request } from '@umijs/max';

export async function getLegacyAddressBook() {
  return request('/api/ab', { method: 'GET' });
}

export async function updateLegacyAddressBook(data: { data: string }) {
  return request('/api/ab', { method: 'POST', data });
}

export async function getAddressBookSettings() {
  return request<API.AddressBookSettings>('/api/ab/settings', { method: 'POST' });
}

export async function getPersonalAddressBook() {
  return request<{ guid: string }>('/api/ab/personal', { method: 'GET' });
}

export async function getSharedAddressBooks(
  params?: { pageSize?: number; current?: number; search?: string },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.SharedAddressBook>>('/api/ab/shared/profiles', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function addSharedAddressBook(data: API.AddSharedAddressBookParams) {
  return request('/api/ab/shared/add', { method: 'POST', data });
}

export async function updateSharedAddressBook(data: API.UpdateSharedAddressBookParams) {
  return request('/api/ab/shared/update/profile', { method: 'PUT', data });
}

export async function deleteSharedAddressBooks(data: string[]) {
  return request('/api/ab/shared', { method: 'DELETE', data });
}

export async function getPeers(
  params: {
    current?: number;
    pageSize?: number;
    ab?: string;
    id?: string;
    alias?: string;
  },
) {
  return request<API.PaginatedResult<API.PeerItem>>('/api/ab/peers', {
    method: 'GET',
    params,
  });
}

export async function addPeer(guid: string, data: API.AddPeerParams) {
  return request(`/api/ab/peer/add/${guid}`, { method: 'POST', data });
}

export async function updatePeer(guid: string, data: API.UpdatePeerParams) {
  return request(`/api/ab/peer/update/${guid}`, { method: 'PUT', data });
}

export async function deletePeer(guid: string, data: string[]) {
  return request(`/api/ab/peer/${guid}`, { method: 'DELETE', data });
}

export async function getTags(guid: string) {
  return request<API.TagItem[]>(`/api/ab/tags/${guid}`, { method: 'GET' });
}

export async function addTag(guid: string, data: API.AddTagParams) {
  return request(`/api/ab/tag/add/${guid}`, { method: 'POST', data });
}

export async function renameTag(guid: string, data: API.RenameTagParams) {
  return request(`/api/ab/tag/rename/${guid}`, { method: 'PUT', data });
}

export async function updateTagColor(guid: string, data: API.UpdateTagParams) {
  return request(`/api/ab/tag/update/${guid}`, { method: 'PUT', data });
}

export async function deleteTag(guid: string, data: string[]) {
  return request(`/api/ab/tag/${guid}`, { method: 'DELETE', data });
}

export async function getRules() {
  return request<API.RuleItem[]>('/api/ab/rules', { method: 'GET' });
}

export async function deleteRules(data: { ids: string[] }) {
  return request('/api/ab/rules', { method: 'DELETE', data });
}

export async function addRule(data: API.CreateRuleParams) {
  return request('/api/ab/rule', { method: 'POST', data });
}

export async function updateRule(data: API.UpdateRuleParams) {
  return request('/api/ab/rule', { method: 'PATCH', data });
}
