import { decodeServerKey } from './crypto';
import { SessionError } from './errors';

export interface IceServer {
  urls: string;
  username?: string;
  credential?: string;
}

export interface ServerProfile {
  idServerUrl: string;
  relayServerUrl: string;
  serverPublicKey: string;
  iceServers?: IceServer[];
}

// Browser ICE servers are administrator-configured; bound to reject runaway input.
export const ICE_LIMITS = {
  count: 16,
  urls: 512,
  credential: 256,
};

function validIceServer(server: IceServer): server is IceServer {
  if (typeof server.urls !== 'string' || server.urls.length > ICE_LIMITS.urls)
    return false;
  // RTCIceServer.urls accepts the WebRTC scheme set only.
  if (
    !/^(?:stun|stuns|turn|turns):[^\s\\]+$/.test(server.urls) ||
    /[\s\\?#]/.test(server.urls)
  )
    return false;
  if (
    server.username !== undefined &&
    (typeof server.username !== 'string' ||
      server.username.length > ICE_LIMITS.credential)
  )
    return false;
  if (
    server.credential !== undefined &&
    (typeof server.credential !== 'string' ||
      server.credential.length > ICE_LIMITS.credential)
  )
    return false;
  return true;
}

export function normalizeIceServers(
  servers: IceServer[] | undefined,
): IceServer[] | undefined {
  if (!Array.isArray(servers) || servers.length === 0) return undefined;
  if (servers.length > ICE_LIMITS.count) throw new SessionError('configuration');
  const normalized: IceServer[] = [];
  for (const server of servers) {
    if (!server || typeof server !== 'object' || !validIceServer(server))
      throw new SessionError('configuration');
    normalized.push({
      urls: server.urls,
      ...(server.username !== undefined ? { username: server.username } : {}),
      ...(server.credential !== undefined
        ? { credential: server.credential }
        : {}),
    });
  }
  return normalized;
}

export function validateProfile(profile: ServerProfile): ServerProfile {
  for (const value of [profile.idServerUrl, profile.relayServerUrl]) {
    try {
      const url = new URL(value);
      if (
        !value.toLowerCase().startsWith('wss://') ||
        /[\s\\?#]/.test(value) ||
        url.protocol !== 'wss:' ||
        !url.hostname ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        value.trim() !== value
      )
        throw new Error();
    } catch {
      throw new SessionError('configuration');
    }
  }
  decodeServerKey(profile.serverPublicKey);
  const iceServers = normalizeIceServers(profile.iceServers);
  return {
    idServerUrl: profile.idServerUrl,
    relayServerUrl: profile.relayServerUrl,
    serverPublicKey: profile.serverPublicKey,
    ...(iceServers ? { iceServers } : {}),
  };
}

export function normalizeTargetId(raw: string): string {
  if (raw.length > 256) throw new SessionError('configuration');
  const value = raw.trim();
  if (/^[0-9 ]+$/.test(value)) {
    const id = value.replace(/ /g, '');
    if (id) return id;
  }
  // hbb_common::is_valid_custom_id; Rust regex \w is Unicode-aware.
  if (
    /^[a-zA-Z](?:[\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Connector_Punctuation}-]|\u200c|\u200d){5,15}$/u.test(
      value,
    )
  )
    return value;
  throw new SessionError('configuration');
}

export function validateAdvertisedRelay(
  advertised: string,
  configured: string,
) {
  if (!advertised) return;
  // Native clients may advertise the complete configured WSS endpoint. Reject
  // unsafe spellings before URL normalization; never use this as a destination.
  if (advertised.toLowerCase().startsWith('wss://')) {
    try {
      const address = new URL(advertised);
      if (
        /[?#\s\\]/.test(advertised) ||
        advertised.slice(6).split('/')[0].includes('@') ||
        /\/(?:\.|%2e){1,2}(?:\/|$)/i.test(advertised) ||
        address.protocol !== 'wss:' ||
        address.username ||
        address.password ||
        address.href !== new URL(configured).href
      )
        throw new Error();
    } catch {
      throw new SessionError('configuration');
    }
    return;
  }
  // TCP advertisements retain the hostname-only compatibility check. The
  // actual connection always uses the fixed administrator WSS URL.
  if (/[/?#@\s\\]/.test(advertised)) throw new SessionError('configuration');
  try {
    const address = new URL(`tcp://${advertised}`);
    if (address.hostname !== new URL(configured).hostname) throw new Error();
  } catch {
    throw new SessionError('configuration');
  }
}
