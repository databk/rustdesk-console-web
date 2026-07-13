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

// Build APIs

export async function getBuildList() {
  return request<API.BuildRecord[]>('/api/nexus/builds', {
    method: 'GET',
  });
}

export async function submitBuild(data: API.SubmitBuildParams) {
  return request<API.SubmitBuildResult>('/api/nexus/builds', {
    method: 'POST',
    data,
  });
}

export async function getBuildStatus(requestId: string) {
  return request<API.BuildStatusResponse>('/api/nexus/builds/' + requestId + '/status', {
    method: 'GET',
  });
}

export async function deleteBuild(requestId: string) {
  return request('/api/nexus/builds/' + requestId, {
    method: 'DELETE',
  });
}

export async function getBuildFiles(requestId: string) {
  return request<string[]>('/api/nexus/builds/' + requestId + '/files', {
    method: 'GET',
  });
}

export async function downloadBuildFile(requestId: string, filename: string) {
  return request('/api/nexus/builds/' + requestId + '/files/' + encodeURIComponent(filename), {
    method: 'GET',
    responseType: 'blob',
  });
}