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

export async function getBuildStatus(uuid: string) {
  return request<API.BuildStatusResponse>('/api/nexus/builds/' + uuid + '/status', {
    method: 'GET',
  });
}

export async function deleteBuild(uuid: string) {
  return request('/api/nexus/builds/' + uuid, {
    method: 'DELETE',
  });
}

export async function getBuildFiles(uuid: string) {
  return request<string[]>('/api/nexus/builds/' + uuid + '/files', {
    method: 'GET',
  });
}

export async function downloadBuildFile(uuid: string, filename: string) {
  return request('/api/nexus/builds/' + uuid + '/files/' + encodeURIComponent(filename), {
    method: 'GET',
    responseType: 'blob',
  });
}