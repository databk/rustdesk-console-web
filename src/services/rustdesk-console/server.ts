import { request } from "@umijs/max";

export type ServerService = "hbbs" | "hbbr";
export interface ServiceStatus {
  service: ServerService;
  state: string;
  running?: boolean;
  available: boolean;
  image?: string;
  restart_count?: number;
  runtime?: {
    version: string;
    uptime_seconds: number;
    public_key?: string;
  } | null;
}
export interface ServerNode {
  id: string;
  name: string;
  reachable: boolean;
  services: ServiceStatus[];
}
export interface ServerPeer {
  id: string;
  uuid: string;
  address: string;
  ip: string;
  online: boolean;
  banned: boolean;
  last_registration_age_seconds: number;
}
export interface RelaySession {
  uuid: string;
  target_id: string;
  peer_target_id: string;
  endpoints: string[];
  transport: string;
  started_at: number;
  bytes: number;
  bytes_per_second: number;
  closing: boolean;
}
export interface ServerConfig {
  values: Record<string, string>;
  effective_values: Record<string, string> | null;
  available: boolean;
  pending_restart: boolean;
  schema: {
    name: string;
    default: string;
    kind: string;
    secret: boolean;
    restart_required: boolean;
    minimum?: number;
    maximum?: number;
  }[];
}
export interface ServerBans {
  device_ids: string[];
  ips: string[];
  synchronization: Record<ServerService, { state: "applied" | "pending" }>;
}
const base = (node: string) => `/api/servers/${encodeURIComponent(node)}`;
export const getServerNodes = () =>
  request<{ data: ServerNode[] }>("/api/servers");
export const getServerPeers = (node: string) =>
  request<{ data: ServerPeer[] }>(`${base(node)}/peers`);
export const getRelaySessions = (node: string) =>
  request<{ data: RelaySession[] }>(`${base(node)}/sessions`);
export const disconnectRelaySession = (node: string, uuid: string) =>
  request<{ state: "closing" }>(
    `${base(node)}/sessions/${encodeURIComponent(uuid)}`,
    { method: "DELETE" },
  );
export const controlServer = (
  node: string,
  service: ServerService,
  action: "start" | "stop" | "restart" | "apply",
) =>
  request<{ state: string }>(`${base(node)}/services/${service}/${action}`, {
    method: "POST",
    timeout: 240000,
  });
export const getServerLogs = (node: string, service: ServerService) =>
  request<{ text: string }>(`${base(node)}/services/${service}/logs`, {
    params: { tail: 200 },
  });
export const getServerConfig = (node: string, service: ServerService) =>
  request<ServerConfig>(`${base(node)}/services/${service}/config`);
export const saveServerConfig = (
  node: string,
  service: ServerService,
  values: Record<string, string>,
) =>
  request<ServerConfig>(`${base(node)}/services/${service}/config`, {
    method: "PUT",
    data: { values },
  });
export const getServerBans = (node: string) =>
  request<ServerBans>(`${base(node)}/bans`);
export const saveServerBans = (
  node: string,
  values: Pick<ServerBans, "device_ids" | "ips">,
) => request<ServerBans>(`${base(node)}/bans`, { method: "PUT", data: values });
