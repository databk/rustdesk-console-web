import { request } from '@umijs/max';
import type { ServerProfile } from '@/features/web-client/core/profile';

export type WebClientConfiguration = { enabled: false } | ({ enabled: true } & ServerProfile);

export function getWebClientConfiguration() {
  return request<WebClientConfiguration>('/api/web-client/config', { method: 'GET', skipErrorHandler: true });
}
