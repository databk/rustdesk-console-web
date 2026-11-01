import { request } from '@umijs/max';

// Build APIs

export async function getBuildList() {
  return request<API.CustomClientBuild[]>('/api/custom-client/builds', {
    method: 'GET',
    skipErrorHandler: true,
  });
}

export async function submitBuild(data: API.SubmitCustomClientBuildParams) {
  return request<API.SubmitCustomClientBuildResult>(
    '/api/custom-client/builds',
    {
      method: 'POST',
      data,
      skipErrorHandler: true,
    },
  );
}

export async function deleteBuild(uuid: string) {
  return request(`/api/custom-client/builds/${uuid}`, {
    method: 'DELETE',
    skipErrorHandler: true,
  });
}

export async function getBuildFiles(uuid: string) {
  return request<string[]>(`/api/custom-client/builds/${uuid}/files`, {
    method: 'GET',
    skipErrorHandler: true,
  });
}

export async function downloadBuildFile(uuid: string, filename: string) {
  return request<Blob>(
    `/api/custom-client/builds/${uuid}/files/${encodeURIComponent(filename)}`,
    {
      method: 'GET',
      responseType: 'blob',
      skipErrorHandler: true,
    },
  );
}

export async function getBuildProgress(uuid: string) {
  return request<API.CustomClientBuildProgress>(
    `/api/custom-client/builds/${uuid}/progress`,
    {
      method: 'GET',
      skipErrorHandler: true,
    },
  );
}

// Settings APIs (admin only)

export async function getCustomClientSettings() {
  return request<API.CustomClientSettings>('/api/custom-client/settings', {
    method: 'GET',
    skipErrorHandler: true,
  });
}

export async function updateCustomClientSettings(
  data: API.UpdateCustomClientSettingsParams,
) {
  return request<API.CustomClientSettings>('/api/custom-client/settings', {
    method: 'PUT',
    data,
    skipErrorHandler: true,
  });
}
