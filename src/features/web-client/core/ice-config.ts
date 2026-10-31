import type { IceServer } from './profile';

// ICE servers are a front-of-browser concern (STUN/TURN for WebRTC) and are not
// part of the server-persisted web client configuration, so they live in
// localStorage and are edited in the web client settings page.
const STORAGE_KEY = 'webClient.iceServers';
const MAX_SERVERS = 16;
const MAX_URL = 512;
const MAX_CREDENTIAL = 256;

// Mirrors rustdesk's hbb_common::webrtc::DEFAULT_ICE_SERVERS.  Four networks,
// not four names: webrtc-ice queries each URL from its own socket, so entries
// sharing a host buy no redundancy.  Two anycast, two unicast; the 443 entry
// is for networks that pass no other UDP port.
export const DEFAULT_ICE_SERVERS: IceServer[] = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun.antisip.com:3478' },
  { urls: 'stun:stun.nextcloud.com:443' },
];

function parseLine(line: string): IceServer | undefined {
  const trimmed = line.trim();
  if (!trimmed) return undefined;
  const [urls, username, credential] = trimmed.split(/\s+/);
  if (!urls || !/^(?:stun|stuns|turn|turns):[^\s\\]+$/.test(urls))
    return undefined;
  if (urls.length > MAX_URL) return undefined;
  if (username && username.length > MAX_CREDENTIAL) return undefined;
  if (credential && credential.length > MAX_CREDENTIAL) return undefined;
  const server: IceServer = { urls };
  if (username) server.username = username;
  if (credential) server.credential = credential;
  return server;
}

export function parseIceServersText(text: string): IceServer[] {
  const servers: IceServer[] = [];
  for (const line of text.split('\n')) {
    const server = parseLine(line);
    if (server) {
      servers.push(server);
      if (servers.length >= MAX_SERVERS) break;
    }
  }
  return servers;
}

export function formatIceServersText(servers: IceServer[] | undefined): string {
  if (!servers || servers.length === 0) return '';
  return servers
    .map((server) =>
      [server.urls, server.username ?? '', server.credential ?? '']
        .filter((value) => value !== '')
        .join(' '),
    )
    .join('\n');
}

export function loadIceServers(): IceServer[] {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) return DEFAULT_ICE_SERVERS;
    const servers = parseIceServersText(text);
    return servers.length > 0 ? servers : DEFAULT_ICE_SERVERS;
  } catch {
    return DEFAULT_ICE_SERVERS;
  }
}

export function loadIceServersText(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveIceServers(servers: IceServer[] | undefined): void {
  try {
    if (!servers || servers.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, formatIceServersText(servers));
  } catch {
    // localStorage unavailable (private mode); WebRTC falls back to relay.
  }
}
