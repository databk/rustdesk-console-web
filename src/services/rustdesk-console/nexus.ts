import { request } from '@umijs/max';

// Auth APIs

export async function createNexusLogin() {
  return request<API.NexusLoginResult>('/api/nexus/auth/login', {
    method: 'POST',
  });
}

export async function pollNexusLoginStatus(loginId: string) {
  return request<API.NexusLoginStatus>('/api/nexus/auth/status', {
    method: 'GET',
    params: { login_id: loginId },
  });
}

export async function getNexusBindStatus() {
  return request<API.NexusBindStatus>('/api/nexus/auth/bind-status', {
    method: 'GET',
  });
}

export async function unbindNexus() {
  return request<{ message: string }>('/api/nexus/auth/bind', {
    method: 'DELETE',
  });
}

// Client Build APIs

export async function generateCustomClientBuild(data: API.GenerateClientParams) {
  return request<API.GenerateClientResult>('/api/nexus/client/generate', {
    method: 'POST',
    data,
  });
}

export async function getClientBuildStatus() {
  return request<API.ClientBuildStatus>('/api/nexus/client/status', {
    method: 'GET',
  });
}

export async function downloadCustomClientBuild(
  requestId?: string,
  options?: { [key: string]: any },
) {
  return request('/api/nexus/client/download', {
    method: 'GET',
    params: requestId ? { request_id: requestId } : undefined,
    responseType: 'blob',
    ...(options || {}),
  });
}
