import { request } from '@umijs/max';

export async function getSessions() {
  return request<API.SessionItem[]>('/api/sessions', {
    method: 'GET',
  });
}

export async function revokeSession(jti: string) {
  return request<{ message: string }>(`/api/sessions/${jti}`, {
    method: 'DELETE',
  });
}
