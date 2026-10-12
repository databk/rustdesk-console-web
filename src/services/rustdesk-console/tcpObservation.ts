export type TcpReason = 'permission_denied' | 'tool_unavailable' | 'source_unavailable' |
  'invalid_response' | 'platform_unobservable' | 'namespace_unobservable' |
  'proxy_unobservable' | 'connection_not_found' | 'ambiguous_connection' |
  'not_connected' | 'not_tcp' | 'system_selected';
export interface TcpObservation {
  api_version: 1;
  kind: 'system' | 'connection';
  status: 'identified' | 'mixed' | 'unavailable' | 'not_applicable';
  algorithm: string | null;
  algorithms: string[];
  algorithms_verified: boolean;
  profiles: { name: string; algorithm: string | null }[];
  reason: TcpReason | null;
  environment: {
    system: 'linux' | 'windows' | 'macos' | 'unknown';
    release: string | null;
    deployment: 'native' | 'container' | 'kubernetes' | 'unknown';
    network_mode: 'host' | 'bridge' | 'isolated' | 'unknown';
    scope: 'host' | 'container' | 'namespace' | 'unknown';
    source: 'sysctl' | 'ss' | 'powershell' | 'unobserved';
  };
  observed_at: string;
}
const reasons: (TcpReason | null)[] = [null, 'permission_denied', 'tool_unavailable', 'source_unavailable',
  'invalid_response', 'platform_unobservable', 'namespace_unobservable', 'proxy_unobservable',
  'connection_not_found', 'ambiguous_connection', 'not_connected', 'not_tcp', 'system_selected'];
export function unavailableTcp(kind: TcpObservation['kind'], reason: TcpReason): TcpObservation {
  return { api_version: 1, kind, status: 'unavailable', algorithm: null,
    algorithms: [], algorithms_verified: false, profiles: [], reason,
    environment: { system: 'unknown', release: null, deployment: 'unknown',
      network_mode: 'unknown', scope: 'unknown', source: 'unobserved' }, observed_at: new Date().toISOString() };
}
export function parseTcpObservation(value: unknown): TcpObservation | undefined {
  const v = value as TcpObservation | undefined;
  const name = (a: unknown) => typeof a === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,63}$/.test(a);
  if (!v || v.api_version !== 1 || !['system', 'connection'].includes(v.kind) ||
    !['identified', 'mixed', 'unavailable', 'not_applicable'].includes(v.status) || !reasons.includes(v.reason) ||
    !(v.algorithm === null || name(v.algorithm)) || !Array.isArray(v.algorithms) || v.algorithms.length > 128 ||
    !v.algorithms.every(name) || new Set(v.algorithms).size !== v.algorithms.length || typeof v.algorithms_verified !== 'boolean' ||
    !Array.isArray(v.profiles) || v.profiles.length > 32 || !v.profiles.every((p) => p &&
      typeof p.name === 'string' && /^[a-zA-Z0-9 _.-]{1,64}$/.test(p.name) && (p.algorithm === null || name(p.algorithm))) ||
    typeof v.observed_at !== 'string' || !Number.isFinite(Date.parse(v.observed_at))) return undefined;
  const e = v.environment;
  if (!e || !['linux', 'windows', 'macos', 'unknown'].includes(e.system) ||
    !['native', 'container', 'kubernetes', 'unknown'].includes(e.deployment) ||
    !['host', 'bridge', 'isolated', 'unknown'].includes(e.network_mode) ||
    !['host', 'container', 'namespace', 'unknown'].includes(e.scope) ||
    !['sysctl', 'ss', 'powershell', 'unobserved'].includes(e.source) ||
    !(e.release === null || (typeof e.release === 'string' && e.release.length <= 128 && !/[\u0000-\u001f]/.test(e.release)))) return undefined;
  if (v.status === 'identified' ? !v.algorithm || v.reason !== null : v.algorithm !== null) return undefined;
  if (v.status === 'unavailable' && !v.reason) return undefined;
  if (v.status === 'mixed' && (v.kind !== 'system' || v.reason !== null || v.profiles.length < 2)) return undefined;
  if (v.status === 'not_applicable' && (v.kind !== 'connection' || v.reason !== 'not_tcp')) return undefined;
  return v;
}
