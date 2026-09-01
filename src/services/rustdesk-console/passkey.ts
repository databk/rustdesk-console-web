import { request } from '@umijs/max';

// --- Registration ---

export async function passkeyRegisterBegin() {
  return request<API.PublicKeyCredentialCreationOptionsJSON>(
    '/api/passkey/register/begin',
    {
      method: 'POST',
      skipErrorHandler: true,
    },
  );
}

export async function passkeyRegisterVerify(
  body: API.PasskeyRegistrationVerifyParams,
) {
  return request<{ message: string }>('/api/passkey/register/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  });
}

// --- Authentication (passwordless + TFA share the same verify endpoint) ---

export async function passkeyAuthBegin() {
  return request<API.PasskeyAuthBeginResponse>('/api/passkey/auth/begin', {
    method: 'POST',
    skipErrorHandler: true,
  });
}

export async function passkeyAuthVerify(body: API.PasskeyAuthVerifyParams) {
  return request<API.LoginResponse>('/api/passkey/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  });
}

// --- Credential management ---

export async function getPasskeyList() {
  return request<API.PasskeyCredential[]>('/api/passkey/list', {
    method: 'GET',
  });
}

export async function deletePasskey(guid: string) {
  return request<{ message: string }>(`/api/passkey/${guid}`, {
    method: 'DELETE',
  });
}

// --- Passkey TFA toggle ---

export async function togglePasskeyTfa(body: API.PasskeyTfaToggleParams) {
  return request<{ message: string }>('/api/passkey/tfa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  });
}
