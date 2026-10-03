/** @jest-environment node */

import { createHash } from 'node:crypto';
import { afterEach, beforeAll, expect, jest, test } from '@jest/globals';
import sodium from 'libsodium-wrappers';
import { hbb } from '../protocol';
import {
  createKeyExchange,
  cryptoReady,
  decodeServerKey,
  passwordChallenge,
  SessionCipher,
  verifyIdentity,
} from './crypto';

beforeAll(cryptoReady);
// Narrow libsodium's overloaded output-format API to its byte-returning calls.
const sodiumBytes: {
  crypto_box_keypair: () => {
    publicKey: Uint8Array;
    privateKey: Uint8Array;
    keyType: string;
  };
  crypto_secretbox_keygen: () => Uint8Array;
  crypto_generichash: (
    length: number,
    input: Uint8Array,
    key: Uint8Array,
  ) => Uint8Array;
} = sodium;
afterEach(() => {
  jest.restoreAllMocks();
});

test('server-signed peer identity and peer-signed box key must both match the target', () => {
  const server = sodium.crypto_sign_keypair();
  const peer = sodium.crypto_sign_keypair();
  const box = sodium.crypto_box_keypair();
  const signed = sodium.crypto_sign(
    hbb.IdPk.encode({ id: '123456789', pk: peer.publicKey }).finish(),
    server.privateKey,
  );
  const verified = verifyIdentity(signed, server.publicKey, '123456789');
  const peerSigned = sodium.crypto_sign(
    hbb.IdPk.encode({ id: '123456789', pk: box.publicKey }).finish(),
    peer.privateKey,
  );
  expect(verifyIdentity(peerSigned, verified.publicKey, '123456789')).toEqual({
    publicKey: box.publicKey,
    kxVersion: 0,
  });
  expect(() => verifyIdentity(signed, server.publicKey, '987654321')).toThrow(
    'identity',
  );
  expect(() => verifyIdentity(signed, peer.publicKey, '123456789')).toThrow(
    'identity',
  );
  const corrupt = signed.slice();
  corrupt[70] ^= 1;
  expect(() => verifyIdentity(corrupt, server.publicKey, '123456789')).toThrow(
    'identity',
  );
  expect(() =>
    verifyIdentity(new Uint8Array(), server.publicKey, '123456789'),
  ).toThrow('identity');
});

test('key exchange matches the native zero-nonce box and little-endian secretbox sequence', () => {
  const peer = sodium.crypto_box_keypair();
  const { publicKey, cipher } = createKeyExchange({
    publicKey: peer.publicKey,
    kxVersion: 0,
  });
  if (!publicKey.symmetricValue || !publicKey.asymmetricValue)
    throw new Error('Missing key exchange values');
  const key = sodium.crypto_box_open_easy(
    publicKey.symmetricValue,
    new Uint8Array(24),
    publicKey.asymmetricValue,
    peer.privateKey,
  );
  const packet = cipher.encrypt(new Uint8Array([1, 2, 3]));
  const nonce = new Uint8Array(24);
  nonce[0] = 1;
  expect(sodium.crypto_secretbox_open_easy(packet, nonce, key)).toEqual(
    new Uint8Array([1, 2, 3]),
  );
  const incoming = sodium.crypto_secretbox_easy(
    new Uint8Array([4, 5]),
    nonce,
    key,
  );
  expect(cipher.decrypt(incoming)).toEqual(new Uint8Array([4, 5]));
  expect(() => cipher.decrypt(incoming)).toThrow('encryption');
  expect(() => cipher.encrypt(new Uint8Array([6]))).toThrow('encryption');
});

test('disposed cipher cannot encrypt or decrypt', () => {
  const cipher = new SessionCipher(new Uint8Array(32));
  cipher.dispose();
  cipher.dispose();
  expect(() => cipher.encrypt(new Uint8Array())).toThrow('encryption');
  expect(() => cipher.decrypt(new Uint8Array(16))).toThrow('encryption');
});

test('password challenge is SHA256(SHA256(password + salt) + challenge) including Unicode', async () => {
  const first = createHash('sha256').update('中文passwordsalt').digest();
  const expected = createHash('sha256')
    .update(first)
    .update('challenge')
    .digest();
  expect(
    Buffer.from(await passwordChallenge('中文password', 'salt', 'challenge')),
  ).toEqual(expected);
});

test('only canonical 32-byte base64 server keys are accepted', () => {
  const canonical = Buffer.alloc(32).toString('base64');
  expect(decodeServerKey(canonical)).toHaveLength(32);
  for (const invalid of [
    '',
    'not-a-key',
    `${canonical} `,
    canonical.slice(0, -1),
    Buffer.alloc(64).toString('base64'),
  ]) {
    expect(() => decodeServerKey(invalid)).toThrow('configuration');
  }
});

test('failed first password digest still clears its plaintext byte buffer', async () => {
  let observed: Uint8Array | undefined;
  jest
    .spyOn(crypto.subtle, 'digest')
    .mockImplementationOnce(async (_algorithm, value) => {
      if (!ArrayBuffer.isView(value)) throw new Error('Expected encoded input');
      observed = new Uint8Array(
        value.buffer,
        value.byteOffset,
        value.byteLength,
      );
      throw new Error('Synthetic digest failure');
    });
  await expect(
    passwordChallenge('private-test-password', 'salt', 'challenge'),
  ).rejects.toThrow('Synthetic digest failure');
  expect(observed?.length).toBeGreaterThan(0);
  expect(observed?.every((byte) => byte === 0)).toBe(true);
});

test('failed final digest clears both the first digest and combined input', async () => {
  const first = new Uint8Array(32).fill(7);
  let observed: Uint8Array | undefined;
  jest
    .spyOn(crypto.subtle, 'digest')
    .mockResolvedValueOnce(first.buffer)
    .mockImplementationOnce(async (_algorithm, value) => {
      if (!ArrayBuffer.isView(value))
        throw new Error('Expected combined input');
      observed = new Uint8Array(
        value.buffer,
        value.byteOffset,
        value.byteLength,
      );
      throw new Error('Synthetic digest failure');
    });
  await expect(
    passwordChallenge('private-test-password', 'salt', 'challenge'),
  ).rejects.toThrow('Synthetic digest failure');
  expect(first.every((byte) => byte === 0)).toBe(true);
  expect(observed?.every((byte) => byte === 0)).toBe(true);
});

// This documents an inherited compatibility risk, not a security pass.
// Do not change the wire nonces unilaterally: stock peers would stop decrypting.
test('documents the pinned protocol cross-direction nonce collision for release review', () => {
  const key = new Uint8Array(32).fill(7);
  const browser = new SessionCipher(key);
  const peer = new SessionCipher(key);
  const left = new TextEncoder().encode('synthetic left!!');
  const right = new TextEncoder().encode('synthetic right!');
  const sent = browser.encrypt(left);
  const received = peer.encrypt(right);
  const ciphertextXor = sent
    .slice(16)
    .map((byte, i) => byte ^ received[i + 16]);
  const plaintextXor = left.map((byte, i) => byte ^ right[i]);
  expect(ciphertextXor).toEqual(plaintextXor);
  browser.dispose();
  peer.dispose();
  key.fill(0);
});

test.each([
  {
    advertised: 1,
    send: 'c189ec6e1935c0751cfc85a0f075405cae507d7925bb19687caf56cbb54e0ecf',
    receive: '8a62648e9195cb10ea900c0a24d2a166c1e982347a2dc6833c3e756bf5715d36',
  },
  {
    advertised: 3,
    send: '25b0778ae600f9731c7fa457d1cc5d40071b0aa3d34c90b53e1d5344b0e7123a',
    receive: '5bbde0ac6a708d4cd1ff807125d79cb6030bde62f7a66b6cc1a79e31bd657756',
  },
])(
  'KX 1 ciphertext matches upstream Rust vectors for advertised $advertised',
  ({ advertised, send, receive }) => {
    // Independent known answers from hbb_common@229b904 src/tcp.rs::test_wire_vectors.
    const cipher = SessionCipher.negotiated(
      new Uint8Array(32).fill(0x11),
      true,
      {
        initiatorPk: new Uint8Array(32).fill(0x22),
        responderPk: new Uint8Array(32).fill(0x33),
        advertised,
        picked: 1,
      },
    );
    const nonce = new Uint8Array(24);
    nonce[0] = 1;
    const message = new TextEncoder().encode('synthetic message');
    const outgoing = cipher.encrypt(message);
    const incoming = sodium.crypto_secretbox_easy(
      message,
      nonce,
      Buffer.from(receive, 'hex'),
    );
    expect(outgoing).toEqual(
      sodium.crypto_secretbox_easy(message, nonce, Buffer.from(send, 'hex')),
    );
    expect(outgoing).not.toEqual(incoming);
    expect(cipher.decrypt(incoming)).toEqual(message);
    expect(() => cipher.decrypt(incoming)).toThrow('encryption');
    expect(() => cipher.encrypt(message)).toThrow('encryption');
  },
);

test('signed KX capability cannot be changed or stripped while preserving its signature', () => {
  const signing = sodium.crypto_sign_keypair();
  const identity = {
    id: '123456789',
    pk: new Uint8Array(32).fill(3),
    kxVersion: 1,
  };
  const signed = sodium.crypto_sign(
    hbb.IdPk.encode(identity).finish(),
    signing.privateKey,
  );
  expect(verifyIdentity(signed, signing.publicKey, identity.id).kxVersion).toBe(
    1,
  );
  for (const kxVersion of [undefined, 0, 3]) {
    const altered = hbb.IdPk.encode({ ...identity, kxVersion }).finish();
    const packet = new Uint8Array(64 + altered.length);
    packet.set(signed.subarray(0, 64));
    packet.set(altered, 64);
    expect(() =>
      verifyIdentity(packet, signing.publicKey, identity.id),
    ).toThrow('identity');
  }
});

test('invalid offers cannot silently select legacy encryption', () => {
  for (const kxVersion of [-1, 1.5, NaN, Infinity, 0x100000000]) {
    expect(() =>
      createKeyExchange({ publicKey: new Uint8Array(32), kxVersion }),
    ).toThrow('identity');
  }
});

test('KX 1 rejects reflected packets and mismatched transcript versions', () => {
  const root = new Uint8Array(32).fill(7);
  const transcript = {
    initiatorPk: new Uint8Array(32).fill(1),
    responderPk: new Uint8Array(32).fill(2),
    advertised: 1,
    picked: 1 as const,
  };
  const browser = SessionCipher.negotiated(root, true, transcript);
  const packet = browser.encrypt(new Uint8Array([1, 2, 3]));
  const mismatched = SessionCipher.negotiated(root, false, {
    ...transcript,
    advertised: 3,
  });
  expect(() => mismatched.decrypt(packet)).toThrow('encryption');
  expect(() => browser.decrypt(packet)).toThrow('encryption');
  expect(() => browser.encrypt(new Uint8Array([4]))).toThrow('encryption');
});

test('exchange clears ephemeral/root/derived buffers and dispose clears both retained keys', () => {
  const peer = sodium.crypto_box_keypair();
  const local = sodium.crypto_box_keypair();
  const root = sodium.crypto_secretbox_keygen();
  const zero = sodium.memzero;
  const cleared: Uint8Array[] = [];
  jest.spyOn(sodiumBytes, 'crypto_box_keypair').mockReturnValue(local);
  jest.spyOn(sodiumBytes, 'crypto_secretbox_keygen').mockReturnValue(root);
  jest.spyOn(sodium, 'memzero').mockImplementation((value) => {
    cleared.push(value);
    zero(value);
  });
  const exchange = createKeyExchange({
    publicKey: peer.publicKey,
    kxVersion: 1,
  });
  expect(exchange.kxVersion).toBe(1);
  expect(root.every((b) => b === 0)).toBe(true);
  expect(local.privateKey.every((b) => b === 0)).toBe(true);
  expect(cleared).toHaveLength(4);
  expect(cleared.every((buffer) => buffer.every((b) => b === 0))).toBe(true);
  expect(exchange.cipher.encrypt(new Uint8Array([1]))).toHaveLength(17);
  exchange.cipher.dispose();
  expect(cleared).toHaveLength(6);
  expect(cleared.every((buffer) => buffer.every((b) => b === 0))).toBe(true);
});

test('failed second directional derivation clears partial output, root and ephemeral key', () => {
  const peer = sodium.crypto_box_keypair();
  const local = sodium.crypto_box_keypair();
  const root = sodium.crypto_secretbox_keygen();
  const partial = new Uint8Array(32).fill(9);
  jest.spyOn(sodiumBytes, 'crypto_box_keypair').mockReturnValue(local);
  jest.spyOn(sodiumBytes, 'crypto_secretbox_keygen').mockReturnValue(root);
  jest
    .spyOn(sodiumBytes, 'crypto_generichash')
    .mockImplementationOnce(() => partial)
    .mockImplementationOnce(() => {
      throw new Error('synthetic KDF failure');
    });
  expect(() =>
    createKeyExchange({ publicKey: peer.publicKey, kxVersion: 1 }),
  ).toThrow('encryption');
  for (const buffer of [partial, root, local.privateKey])
    expect(buffer.every((b) => b === 0)).toBe(true);
});
