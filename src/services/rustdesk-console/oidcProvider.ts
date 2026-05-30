import { request } from '@umijs/max';

export async function getOidcProviderList(
  params?: {
    current?: number;
    pageSize?: number;
    name?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.OidcProvider>>('/api/oidc-providers', {
    method: 'GET',
    params: {
      current: params?.current || 1,
      pageSize: params?.pageSize || 20,
      name: params?.name,
    },
    ...(options || {}),
  });
}

export async function getOidcProvider(
  guid: string,
  options?: { [key: string]: any },
) {
  return request<API.OidcProvider>(`/api/oidc-providers/${guid}`, {
    method: 'GET',
    ...(options || {}),
  });
}

export async function createOidcProvider(data: API.CreateOidcProviderParams) {
  return request<API.OidcProvider>('/api/oidc-providers', {
    method: 'POST',
    data,
  });
}

export async function updateOidcProvider(
  guid: string,
  data: API.UpdateOidcProviderParams,
) {
  return request<API.OidcProvider>(`/api/oidc-providers/${guid}`, {
    method: 'PATCH',
    data,
  });
}

export async function deleteOidcProvider(guid: string) {
  return request(`/api/oidc-providers/${guid}`, { method: 'DELETE' });
}

export async function toggleOidcProvider(
  guid: string,
  data: API.ToggleOidcProviderParams,
) {
  return request<API.OidcProvider>(`/api/oidc-providers/${guid}/toggle`, {
    method: 'PATCH',
    data,
  });
}

export async function testOidcProvider(guid: string) {
  return request<API.OidcTestResult>(`/api/oidc-providers/${guid}/test`, {
    method: 'POST',
  });
}
