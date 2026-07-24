/**
 * WebAuthn browser helpers.
 *
 * The server returns WebAuthn options with base64url-encoded strings, but the
 * browser API expects ArrayBuffers. These helpers handle the conversion in both
 * directions so callers can pass server JSON straight to `navigator.credentials`
 * and serialize the browser response back to JSON for the server.
 */

/** Convert an ArrayBuffer (or typed array) to a base64url string. */
export function bufferToBase64url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Convert a base64url string to an ArrayBuffer. */
export function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Whether the current browser supports WebAuthn. */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined'
  );
}

/**
 * Convert server-side PublicKeyCredentialCreationOptions (base64url strings)
 * to the browser-compatible format (ArrayBuffers).
 */
export function prepareCreationOptions(
  json: API.PublicKeyCredentialCreationOptionsJSON,
): PublicKeyCredentialCreationOptions {
  const options: PublicKeyCredentialCreationOptions = {
    rp: json.rp,
    user: {
      ...json.user,
      id: base64urlToBuffer(json.user.id),
    },
    challenge: base64urlToBuffer(json.challenge),
    pubKeyCredParams: json.pubKeyCredParams,
  };
  if (json.authenticatorSelection) {
    options.authenticatorSelection = json.authenticatorSelection as AuthenticatorSelectionCriteria;
  }
  if (json.excludeCredentials) {
    options.excludeCredentials = json.excludeCredentials.map((c) => ({
      id: base64urlToBuffer(c.id),
      type: 'public-key' as const,
      transports: c.transports as AuthenticatorTransport[] | undefined,
    }));
  }
  if (json.timeout !== undefined) options.timeout = json.timeout;
  if (json.attestation) {
    options.attestation = json.attestation as AttestationConveyancePreference;
  }
  return options;
}

/**
 * Convert server-side PublicKeyCredentialRequestOptions (base64url strings)
 * to the browser-compatible format (ArrayBuffers).
 */
export function prepareRequestOptions(
  json: API.PublicKeyCredentialRequestOptionsJSON,
): PublicKeyCredentialRequestOptions {
  const options: PublicKeyCredentialRequestOptions = {
    challenge: base64urlToBuffer(json.challenge),
  };
  if (json.rpId) options.rpId = json.rpId;
  if (json.timeout !== undefined) options.timeout = json.timeout;
  if (json.userVerification) {
    options.userVerification = json.userVerification as UserVerificationRequirement;
  }
  if (json.allowCredentials) {
    options.allowCredentials = json.allowCredentials.map((c) => ({
      id: base64urlToBuffer(c.id),
      type: 'public-key' as const,
      transports: c.transports as AuthenticatorTransport[] | undefined,
    }));
  }
  return options;
}

/**
 * Serialize the browser's PublicKeyCredential (from navigator.credentials.create)
 * into a JSON-serializable RegistrationResponseJSON for the server.
 */
export function serializeRegistrationResponse(
  credential: PublicKeyCredential,
): API.RegistrationResponseJSON {
  const response = credential.response as AuthenticatorAttestationResponse;
  const transports =
    typeof response.getTransports === 'function'
      ? response.getTransports()
      : [];

  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    response: {
      attestationObject: bufferToBase64url(response.attestationObject),
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      transports,
    },
    authenticatorAttachment: credential.authenticatorAttachment ?? undefined,
    clientExtensionResults: credential.getClientExtensionResults(),
    type: credential.type as 'public-key',
  };
}

/**
 * Serialize the browser's PublicKeyCredential (from navigator.credentials.get)
 * into a JSON-serializable AuthenticationResponseJSON for the server.
 */
export function serializeAuthenticationResponse(
  credential: PublicKeyCredential,
): API.AuthenticationResponseJSON {
  const response = credential.response as AuthenticatorAssertionResponse;

  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    response: {
      authenticatorData: bufferToBase64url(response.authenticatorData),
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      signature: bufferToBase64url(response.signature),
      userHandle: response.userHandle
        ? bufferToBase64url(response.userHandle)
        : undefined,
    },
    authenticatorAttachment: credential.authenticatorAttachment ?? undefined,
    clientExtensionResults: credential.getClientExtensionResults(),
    type: credential.type as 'public-key',
  };
}
