import { request } from '@umijs/max';

export async function updateProfile(body: API.UpdateProfileParams) {
  return request('/api/users/me', {
    method: 'PATCH',
    data: body,
    skipErrorHandler: true,
  });
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);
  return request('/api/users/me/avatar', {
    method: 'POST',
    data: formData,
    skipErrorHandler: true,
  });
}

export async function deleteAvatar() {
  return request('/api/users/me/avatar', {
    method: 'DELETE',
    skipErrorHandler: true,
  });
}

export async function setup2FA(body?: API.Setup2FAParams) {
  return request<API.Setup2FAResponse>('/api/2fa/setup', {
    method: 'POST',
    data: body,
    skipErrorHandler: true,
  });
}

export async function verify2FA(body: API.Verify2FAParams) {
  return request('/api/2fa/verify', {
    method: 'POST',
    data: body,
    skipErrorHandler: true,
  });
}

export async function disable2FA(body: API.Disable2FAParams) {
  return request('/api/2fa', {
    method: 'DELETE',
    data: body,
    skipErrorHandler: true,
  });
}

export async function changePassword(body: API.ChangePasswordParams) {
  return request('/api/users/me/password', {
    method: 'PATCH',
    data: body,
    skipErrorHandler: true,
  });
}
