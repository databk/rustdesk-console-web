import { decodeServerKey } from './crypto';
import { SessionError } from './errors';

export interface ServerProfile {
  idServerUrl: string;
  relayServerUrl: string;
  serverPublicKey: string;
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
  return {
    idServerUrl: profile.idServerUrl,
    relayServerUrl: profile.relayServerUrl,
    serverPublicKey: profile.serverPublicKey,
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
  // hbbr advertises its TCP address. The actual connection always uses the fixed
  // administrator WSS URL; ports and reverse-proxy paths never come from the peer.
  if (/[/?#@\s\\]/.test(advertised)) throw new SessionError('configuration');
  try {
    const address = new URL(`tcp://${advertised}`);
    if (address.hostname !== new URL(configured).hostname) throw new Error();
  } catch {
    throw new SessionError('configuration');
  }
}
