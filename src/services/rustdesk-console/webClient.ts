import { request, type RequestOptions } from '@umijs/max';
import type { ServerProfile } from '@/features/web-client/core/profile';
import type { WebClientGrant } from '@/features/web-client/core/gateway';
import { removeToken } from '@/utils/auth';
import { parseTcpObservation, type TcpObservation } from './tcpObservation';

export type { WebClientGrant };
export type WebClientAuditEvent =
  | { event: 'remote_auth_succeeded' | 'remote_auth_failed' }
  | { event: 'file_started' | 'file_completed' | 'file_failed'; fileName: string; size: number; direction: 'upload' | 'download' };

export function webClientHttpStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } })?.response?.status;
}
export function handleWebClientAuthError(error: unknown, refreshPermissions = true) {
  const status = webClientHttpStatus(error);
  if (status === 401) {
    removeToken();
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
  } else if (status === 403 && refreshPermissions) window.dispatchEvent(new Event('auth:permissions-stale'));
}
async function webClientRequest<T>(url: string, options: RequestOptions, refreshPermissions = true): Promise<T> {
  try { return await request<T>(url, { ...options, skipErrorHandler: true }); }
  catch (error) { handleWebClientAuthError(error, refreshPermissions); throw error; }
}

export type WebClientConfiguration = { enabled: false } | ({ enabled: true } & ServerProfile);

export interface WebClientSessionNetwork {
  api_version: 1;
  session_guid: string;
  entry: TcpObservation;
  relay: TcpObservation;
}
export async function getWebClientSessionNetwork(guid: string, options: { signal?: AbortSignal } = {}): Promise<WebClientSessionNetwork> {
  const state = await webClientRequest<WebClientSessionNetwork>(`/api/web-client/sessions/${encodeURIComponent(guid)}/network`,
    { method: 'GET', timeout: 10000, ...options });
  const entry = parseTcpObservation(state?.entry);
  const relay = parseTcpObservation(state?.relay);
  if (state?.api_version !== 1 || state.session_guid !== guid || entry?.kind !== 'connection' || relay?.kind !== 'connection')
    throw new Error('Invalid session network observation');
  return { api_version: 1, session_guid: guid, entry, relay };
}

export function getWebClientConfiguration() {
  return webClientRequest<WebClientConfiguration>('/api/web-client/config', { method: 'GET' }, false);
}

export function getWebClientDevices(params: { current: number; pageSize: number; is_online?: string }, options: { signal?: AbortSignal } = {}) {
  return webClientRequest<{ data: API.DeviceItem[]; total: number }>('/api/web-client/devices', { method: 'GET', params, ...options });
}
export function createWebClientSession(targetId: string) {
  return webClientRequest<WebClientGrant>('/api/web-client/sessions', { method: 'POST', data: { targetId } });
}
export function createWebClientFileSession(parentGuid: string) {
  return webClientRequest<WebClientGrant>(`/api/web-client/sessions/${encodeURIComponent(parentGuid)}/files`, { method: 'POST' });
}
export function endWebClientSession(guid: string) {
  return webClientRequest<{ ended: true }>(`/api/web-client/sessions/${encodeURIComponent(guid)}`, { method: 'DELETE' });
}
export function reportWebClientEvent(guid: string, data: WebClientAuditEvent) {
  return webClientRequest<{ accepted: true }>(`/api/web-client/sessions/${encodeURIComponent(guid)}/events`, { method: 'POST', data });
}
