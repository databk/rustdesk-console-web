/** @jest-environment node */
import { afterEach, beforeAll, expect, jest, test } from '@jest/globals';
import sodium from 'libsodium-wrappers';
import { hbb } from '../protocol';
import * as cryptography from './crypto';
import { RemoteSession, type SessionState } from './session';

beforeAll(cryptography.cryptoReady);
const active: RemoteSession[] = [];
afterEach(() => {
  for (const s of active) s.disconnect();
  active.length = 0;
  jest.restoreAllMocks();
  jest.useRealTimers();
});
class Socket {
  readyState = 1;
  bufferedAmount = 0;
  binaryType = '';
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: ArrayBuffer }) => void) | null = null;
  constructor(readonly accept: (bytes: Uint8Array) => void) {
    queueMicrotask(() => this.onopen?.());
  }
  send(data: ArrayBuffer) {
    this.accept(new Uint8Array(data));
  }
  receive(data: Uint8Array) {
    queueMicrotask(() =>
      this.onmessage?.({ data: new Uint8Array(data).buffer }),
    );
  }
  close() {
    this.readyState = 3;
  }
}
function fixture(
  options: {
    kind?: 'desktop' | 'file';
    wrongIdentity?: boolean;
    offline?: boolean;
    deny?: boolean;
    clickOnly?: boolean;
    noChallenge?: boolean;
    kxVersion?: number;
    rendezvousKxVersion?: number;
    tamperOffer?: boolean;
    tamperPicked?: boolean;
    peerInfo?: hbb.IPeerInfo;
  } = {},
) {
  const server = sodium.crypto_sign_keypair();
  const peer = sodium.crypto_sign_keypair();
  const box = sodium.crypto_box_keypair();
  const id = '123456789';
  const states: SessionState[] = [];
  const errors: string[] = [];
  const security: (cryptography.KxVersion | undefined)[] = [];
  const exchanges: hbb.IPublicKey[] = [];
  const relayRequests: hbb.IRequestRelay[] = [];
  const permissions: { keyboard: boolean; clipboard: boolean }[] = [];
  const permissionMessageCounts: number[] = [];
  const messages: hbb.Message[] = [];
  const clientMessages: hbb.Message[] = [];
  const sockets: Socket[] = [];
  let relay: Socket;
  let cipher: cryptography.SessionCipher | undefined;
  let stage = 0;
  const signed = (
    key: Uint8Array,
    signing: Uint8Array,
    value = id,
    kxVersion?: number,
  ) =>
    sodium.crypto_sign(
      hbb.IdPk.encode({ id: value, pk: key, kxVersion }).finish(),
      signing,
    );
  const send = (message: hbb.IMessage) => {
    if (!cipher) throw new Error('Exchange incomplete');
    relay.receive(cipher.encrypt(hbb.Message.encode(message).finish()));
  };
  const session = new RemoteSession(
    {
      security: (version) => security.push(version),
      state: (s) => states.push(s),
      error: (e) => errors.push(e),
      message: (m) => {
        messages.push(m);
      },
      permissions: (p) => {
        permissions.push(p);
        permissionMessageCounts.push(clientMessages.length);
      },
    },
    (url) => {
      let socket: Socket;
      if (url.endsWith('/id')) {
        socket = new Socket(() =>
          socket.receive(
            hbb.RendezvousMessage.encode(
              options.offline
                ? {
                    punchHoleResponse: {
                      failure: hbb.PunchHoleResponse.Failure.ID_NOT_EXIST,
                    },
                  }
                : {
                    relayResponse: {
                      uuid: 'synthetic-uuid',
                      version: '1.4.9',
                      relayServer: 'example.test:21117',
                      pk: signed(
                        peer.publicKey,
                        server.privateKey,
                        options.wrongIdentity ? '987654321' : id,
                        options.rendezvousKxVersion,
                      ),
                    },
                  },
            ).finish(),
          ),
        );
      } else {
        stage = 0;
        cipher?.dispose();
        cipher = undefined;
        socket = relay = new Socket((bytes) => {
          if (stage++ === 0) {
            const request = hbb.RendezvousMessage.decode(bytes).requestRelay;
            if (request) relayRequests.push(request);
            const offer = signed(
              box.publicKey,
              peer.privateKey,
              id,
              options.kxVersion,
            );
            if (options.tamperOffer) offer[offer.length - 1] ^= 1;
            relay.receive(
              hbb.Message.encode({
                signedId: { id: offer },
              }).finish(),
            );
            return;
          }
          if (!cipher) {
            const key = hbb.Message.decode(bytes).publicKey;
            if (!key?.symmetricValue || !key.asymmetricValue)
              throw new Error('Missing key');
            exchanges.push(key);
            const secret = sodium.crypto_box_open_easy(
              key.symmetricValue,
              new Uint8Array(24),
              key.asymmetricValue,
              box.privateKey,
            );
            cipher = cryptography.SessionCipher.negotiated(secret, false, {
              initiatorPk: key.asymmetricValue,
              responderPk: box.publicKey,
              advertised: options.kxVersion ?? 0,
              picked: !options.tamperPicked && key.kxVersion === 1 ? 1 : 0,
            });
            secret.fill(0);
            if (!options.noChallenge)
              send({ hash: { salt: 'salt', challenge: 'challenge' } });
            return;
          }
          const message = hbb.Message.decode(cipher.decrypt(bytes));
          clientMessages.push(message);
          if (message.loginRequest && options.clickOnly) {
            send({ loginResponse: { error: 'No Password Access' } });
          } else if (message.loginRequest?.password?.length) {
            if (options.deny) send({ loginResponse: { error: 'Rejected' } });
            else
              send({
                loginResponse: {
                  peerInfo: options.peerInfo ?? {
                    platform: 'Windows',
                    version: '1.4.9',
                    displays: [{ x: 0, y: 0, width: 1920, height: 1080 }],
                  },
                },
              });
          }
        });
      }
      sockets.push(socket);
      return socket as unknown as WebSocket;
    },
    options.kind,
  );
  active.push(session);
  const profile = {
    idServerUrl: 'wss://example.test/id',
    relayServerUrl: 'wss://example.test/relay',
    serverPublicKey: sodium.to_base64(
      server.publicKey,
      sodium.base64_variants.ORIGINAL,
    ),
  };
  const connect = () => session.connect(profile, id);
  return {
    session,
    connect,
    profile,
    states,
    errors,
    security,
    exchanges,
    relayRequests,
    permissions,
    permissionMessageCounts,
    messages,
    clientMessages,
    sockets,
    send,
  };
}
async function until(predicate: () => boolean) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
  throw new Error('Synthetic handshake did not advance');
}

async function connectedFixture(kxVersion = 0) {
  const f = fixture({ kxVersion });
  const run = f.connect();
  await until(() => f.states.at(-1) === 'awaitingApproval');
  await f.session.submitPassword('synthetic');
  await until(() => f.states.at(-1) === 'connected');
  return { ...f, run };
}

async function keyboardPermission(
  f: ReturnType<typeof fixture>,
  enabled: boolean,
) {
  const count = f.permissions.length;
  f.send({
    misc: {
      permissionInfo: {
        permission: hbb.PermissionInfo.Permission.Keyboard,
        enabled,
      },
    },
  });
  await until(() => f.permissions.length > count);
}

test.each([0, 1])(
  'KX %i restores permission by releasing sent holds before enabling input, without replaying blocked actions',
  async (kxVersion) => {
    const f = await connectedFixture(kxVersion);
    for (let i = 0; i < 300; i++)
      expect(
        f.session.sendInput({
          keyEvent: { controlKey: hbb.ControlKey.Shift, down: true },
        }),
      ).toBe(true);
    f.session.sendInput({
      keyEvent: { chr: 97, down: true, modifiers: [hbb.ControlKey.Shift] },
    });
    for (const button of [1, 2, 4])
      f.session.sendInput({ mouseEvent: { mask: 1 | (button << 3) } });
    await keyboardPermission(f, false);
    const count = f.clientMessages.length;
    for (const input of [
      { keyEvent: { controlKey: hbb.ControlKey.Shift, down: false } },
      { keyEvent: { chr: 97, down: false } },
      { keyEvent: { chr: 98, down: true } },
      { keyEvent: { seq: 'Do not replay this text', press: true } },
      { mouseEvent: { mask: 10 } },
      { mouseEvent: { mask: 0, x: 100, y: 200 } },
      { mouseEvent: { mask: 3, y: -1 } },
    ])
      expect(f.session.sendInput(input)).toBe(false);
    await keyboardPermission(f, false);
    expect(f.clientMessages).toHaveLength(count);
    await keyboardPermission(f, true);
    const releases = f.clientMessages.slice(count);
    expect(releases).toHaveLength(5);
    expect(releases[0].keyEvent).toMatchObject({
      controlKey: hbb.ControlKey.Shift,
      down: false,
      modifiers: [],
    });
    expect(releases[1].keyEvent).toMatchObject({
      chr: 97,
      down: false,
      modifiers: [],
    });
    expect(releases.slice(2).map((m) => m.mouseEvent?.mask)).toEqual([
      10, 18, 34,
    ]);
    expect(f.permissionMessageCounts.at(-1)).toBe(count + 5);
    f.session.sendInput({ keyEvent: { chr: 99, down: true } });
    await keyboardPermission(f, true);
    expect(f.clientMessages).toHaveLength(count + 6);
    f.session.sendInput({ keyEvent: { chr: 99, down: false } });
    f.session.disconnect();
    await f.run;
    expect(f.clientMessages).toHaveLength(count + 7);
    expect(f.errors).toEqual([]);
  },
);

test('released input and atomic text are not retained for permission recovery', async () => {
  const f = await connectedFixture();
  f.session.sendInput({ keyEvent: { chr: 97, down: true } });
  f.session.sendInput({ keyEvent: { chr: 97, down: false } });
  f.session.sendInput({ mouseEvent: { mask: 9 } });
  f.session.sendInput({ mouseEvent: { mask: 10 } });
  f.session.sendInput({ keyEvent: { seq: 'Atomic text', press: true } });
  f.session.sendInput({ mouseEvent: { mask: 0, x: 42, y: 24 } });
  const count = f.clientMessages.length;
  await keyboardPermission(f, false);
  await keyboardPermission(f, true);
  f.session.disconnect();
  await f.run;
  expect(f.clientMessages).toHaveLength(count);
});

test('normal shutdown releases held input once while permission remains available', async () => {
  const f = await connectedFixture();
  f.session.sendInput({
    keyEvent: { controlKey: hbb.ControlKey.Control, down: true },
  });
  f.session.sendInput({ mouseEvent: { mask: 9 } });
  const count = f.clientMessages.length;
  f.session.disconnect();
  f.session.disconnect();
  await f.run;
  expect(f.clientMessages).toHaveLength(count + 2);
  expect(f.clientMessages[count].keyEvent).toMatchObject({
    controlKey: hbb.ControlKey.Control,
    down: false,
  });
  expect(f.clientMessages[count + 1].mouseEvent?.mask).toBe(10);
  expect(f.errors).toEqual([]);
});

test.each([true, false])(
  '原生分辨率变化清理持键，撤权期间不发送输入（keyboard=%s）',
  async (keyboard) => {
    const f = await connectedFixture();
    try {
      f.session.sendInput({
        keyEvent: { controlKey: hbb.ControlKey.Shift, down: true },
      });
      f.session.sendInput({ mouseEvent: { mask: 9 } });
      if (!keyboard) await keyboardPermission(f, false);
      const count = f.clientMessages.length;
      f.send({
        misc: { switchDisplay: { display: 0, width: 1280, height: 720 } },
      });
      await until(() =>
        f.messages.some((message) => !!message.misc?.switchDisplay),
      );
      if (!keyboard) {
        expect(f.clientMessages).toHaveLength(count);
        await keyboardPermission(f, true);
      }
      await until(() => f.clientMessages.length === count + 2);
      expect(f.clientMessages[count].keyEvent).toMatchObject({
        controlKey: hbb.ControlKey.Shift,
        down: false,
      });
      expect(f.clientMessages[count + 1].mouseEvent?.mask).toBe(10);
      f.session.disconnect();
      await f.run;
      expect(f.clientMessages).toHaveLength(count + 2);
      expect(f.errors).toEqual([]);
    } finally {
      f.session.disconnect();
      await f.run;
    }
  },
);

test('revoked shutdown never sends input or carries holds into a new session', async () => {
  const f = await connectedFixture();
  f.session.sendInput({
    keyEvent: { controlKey: hbb.ControlKey.Shift, down: true },
  });
  f.session.sendInput({ mouseEvent: { mask: 9 } });
  await keyboardPermission(f, false);
  const count = f.clientMessages.length;
  f.session.disconnect();
  await f.run;
  expect(f.clientMessages).toHaveLength(count);
  const again = f.connect();
  await until(() => f.states.at(-1) === 'awaitingApproval');
  await f.session.submitPassword('synthetic');
  await until(() => f.states.at(-1) === 'connected');
  await keyboardPermission(f, false);
  await keyboardPermission(f, true);
  f.session.disconnect();
  await again;
  expect(
    f.clientMessages.slice(count).some((m) => m.keyEvent || m.mouseEvent),
  ).toBe(false);
});

test('permission recovery fails closed if a release cannot be sent', async () => {
  const f = await connectedFixture();
  f.session.sendInput({
    keyEvent: { controlKey: hbb.ControlKey.Shift, down: true },
  });
  await keyboardPermission(f, false);
  const socket = f.sockets.at(-1);
  if (!socket) throw new Error('Missing relay socket');
  jest.spyOn(socket, 'send').mockImplementation(() => {
    throw new Error('Synthetic transport failure');
  });
  f.send({
    misc: {
      permissionInfo: {
        permission: hbb.PermissionInfo.Permission.Keyboard,
        enabled: true,
      },
    },
  });
  await f.run;
  expect(f.errors).toEqual(['transport']);
  expect(f.states.at(-1)).toBe('failed');
  expect(f.permissions.at(-1)?.keyboard).toBe(false);
  expect(f.sockets.every((s) => s.readyState === 3)).toBe(true);
});

test('shutdown remains idempotent when best-effort releases fail', async () => {
  const f = await connectedFixture();
  f.session.sendInput({
    keyEvent: { controlKey: hbb.ControlKey.Shift, down: true },
  });
  const socket = f.sockets.at(-1);
  if (!socket) throw new Error('Missing relay socket');
  const send = jest.spyOn(socket, 'send').mockImplementation(() => {
    throw new Error('Synthetic transport failure');
  });
  expect(() => f.session.disconnect()).not.toThrow();
  f.session.disconnect();
  await f.run;
  expect(send).toHaveBeenCalledTimes(1);
  expect(f.errors).toEqual([]);
  expect(f.states.at(-1)).toBe('closed');
});

test('held-input bookkeeping is bounded before another press is sent', async () => {
  const f = await connectedFixture();
  for (let i = 0; i < 256; i++)
    expect(
      f.session.sendInput({ keyEvent: { chr: 1000 + i, down: true } }),
    ).toBe(true);
  expect(f.session.sendInput({ keyEvent: { chr: 2000, down: true } })).toBe(
    false,
  );
  await f.run;
  const keys = f.clientMessages.flatMap((m) =>
    m.keyEvent ? [m.keyEvent] : [],
  );
  expect(keys.filter((k) => k.down)).toHaveLength(256);
  expect(keys.filter((k) => !k.down)).toHaveLength(256);
  expect(keys.some((k) => k.chr === 2000)).toBe(false);
  expect(f.errors).toEqual(['protocol']);
});
test('encrypted session subscribes capture and enforces live keyboard/clipboard permissions', async () => {
  const f = fixture();
  const run = f.connect();
  await until(() => f.states.includes('awaitingApproval'));
  await f.session.submitPassword('synthetic');
  await until(() => f.states.includes('connected'));
  expect(
    f.clientMessages.some((m) => m.misc?.captureDisplays?.set?.[0] === 0),
  ).toBe(true);
  expect(f.session.sendInput({ keyEvent: { chr: 97, down: true } })).toBe(true);
  f.send({
    misc: {
      permissionInfo: {
        permission: hbb.PermissionInfo.Permission.Keyboard,
        enabled: false,
      },
    },
  });
  f.send({
    misc: {
      permissionInfo: {
        permission: hbb.PermissionInfo.Permission.Clipboard,
        enabled: false,
      },
    },
  });
  await until(() => f.permissions.some((p) => !p.keyboard && !p.clipboard));
  const count = f.clientMessages.length;
  expect(f.session.sendInput({ keyEvent: { chr: 98, down: true } })).toBe(
    false,
  );
  expect(f.session.sendClipboard({ content: new Uint8Array([65]) })).toBe(
    false,
  );
  expect(f.clientMessages).toHaveLength(count);
  f.session.disconnect();
  await run;
  expect(
    f.sockets.every((s) => s.readyState === 3 && s.onmessage === null),
  ).toBe(true);
  expect(f.errors).toEqual([]);
});
test('server identity mismatch fails before contacting relay and never sends a password', async () => {
  const f = fixture({ wrongIdentity: true });
  await f.connect();
  expect(f.errors).toEqual(['identity']);
  expect(f.sockets).toHaveLength(1);
  expect(f.clientMessages).toHaveLength(0);
});
test('offline and rejected endpoints produce finite sanitized failures', async () => {
  const offline = fixture({ offline: true });
  await offline.connect();
  expect(offline.errors).toEqual(['offline']);
  const denied = fixture({ deny: true });
  const run = denied.connect();
  await until(() => denied.states.includes('awaitingApproval'));
  await denied.session.submitPassword('synthetic');
  await run;
  expect(denied.errors).toEqual(['denied']);
});
test.each([0, 1])(
  'KX %i waits for native click-only approval without a password',
  async (kxVersion) => {
    const f = fixture({ clickOnly: true, kxVersion });
    const run = f.connect();
    await until(
      () =>
        f.states.filter((s) => s === 'awaitingApproval').length === 2 ||
        f.states.includes('failed'),
    );
    expect(f.states.at(-1)).toBe('awaitingApproval');
    expect(f.errors).toEqual([]);
    expect(f.states).not.toContain('connected');
    expect(
      f.clientMessages.filter((m) => m.loginRequest?.password?.length),
    ).toHaveLength(0);
    f.send({
      loginResponse: {
        peerInfo: {
          platform: 'Windows',
          displays: [{ width: 1920, height: 1080 }],
        },
      },
    });
    await until(() => f.states.includes('connected'));
    expect(f.security.at(-1)).toBe(kxVersion);
    expect(f.clientMessages.some((m) => m.misc?.captureDisplays)).toBe(true);
    f.session.disconnect();
    await run;
  },
);
test.each(['reject', 'cancel'])(
  'native click-only wait ends on %s',
  async (action) => {
    const f = fixture({ clickOnly: true });
    const run = f.connect();
    await until(
      () =>
        f.states.filter((s) => s === 'awaitingApproval').length === 2 ||
        f.states.includes('failed'),
    );
    expect(f.states.at(-1)).toBe('awaitingApproval');
    if (action === 'reject') f.send({ misc: { closeReason: 'Rejected' } });
    else f.session.disconnect();
    await run;
    expect(f.states).not.toContain('connected');
    expect(f.errors).toEqual(action === 'reject' ? ['denied'] : []);
    expect(f.sockets.every((s) => s.readyState === 3)).toBe(true);
  },
);
test('repeated click-only notices cannot extend authentication indefinitely', async () => {
  jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'nextTick'] });
  const f = fixture({ clickOnly: true });
  const run = f.connect();
  await jest.advanceTimersByTimeAsync(1);
  expect(f.states.at(-1)).toBe('awaitingApproval');
  for (let i = 0; i < 3; ++i) {
    await jest.advanceTimersByTimeAsync(39000);
    f.send({ loginResponse: { error: 'No Password Access' } });
    await jest.advanceTimersByTimeAsync(0);
    expect(f.states.at(-1)).toBe('awaitingApproval');
  }
  await jest.advanceTimersByTimeAsync(3000);
  await run;
  expect(f.errors).toEqual(['timeout']);
  expect(f.sockets.every((s) => s.readyState === 3)).toBe(true);
});
test('disconnect during password hashing zeroes the late result without resurrecting the session', async () => {
  const f = fixture();
  const run = f.connect();
  await until(() => f.states.includes('awaitingApproval'));
  let finish: (value: ArrayBuffer) => void = () => {};
  jest.spyOn(crypto.subtle, 'digest').mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const submitted = f.session.submitPassword('synthetic');
  f.session.disconnect();
  const result = new Uint8Array([1, 2]);
  finish(result.buffer);
  await submitted;
  await run;
  expect(result).toEqual(new Uint8Array(2));
  expect(f.states.at(-1)).toBe('closed');
  expect(f.errors).toEqual([]);
  expect(
    f.clientMessages.filter((m) => m.loginRequest?.password?.length),
  ).toHaveLength(0);
});
test('newer password submission wins and an obsolete hash cannot fail a live connection', async () => {
  const f = fixture();
  const run = f.connect();
  await until(() => f.states.includes('awaitingApproval'));
  const pending: ((value: ArrayBuffer) => void)[] = [];
  const delayed = () =>
    new Promise<ArrayBuffer>((resolve) => {
      pending.push(resolve);
    });
  jest
    .spyOn(crypto.subtle, 'digest')
    .mockImplementationOnce(delayed)
    .mockImplementationOnce(delayed);
  const first = f.session.submitPassword('first');
  const second = f.session.submitPassword('second');
  pending[1](new Uint8Array([2]).buffer);
  await second;
  await until(() => f.states.includes('connected'));
  const obsolete = new Uint8Array([1]);
  pending[0](obsolete.buffer);
  await first;
  expect(obsolete[0]).toBe(0);
  expect(f.states.at(-1)).toBe('connected');
  expect(f.errors).toEqual([]);
  expect(
    f.clientMessages.filter((m) => m.loginRequest?.password?.length),
  ).toHaveLength(1);
  f.session.disconnect();
  await run;
});

test('keepalives cannot extend authentication indefinitely before the first challenge', async () => {
  jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'nextTick'] });
  const f = fixture({ noChallenge: true });
  const run = f.connect();
  await jest.advanceTimersByTimeAsync(1);
  expect(f.states.at(-1)).toBe('authenticating');
  for (let i = 0; i < 3; ++i) {
    await jest.advanceTimersByTimeAsync(39000);
    f.send({ testDelay: { time: i + 1, fromClient: false } });
    await jest.advanceTimersByTimeAsync(0);
    expect(f.states.at(-1)).toBe('authenticating');
  }
  await jest.advanceTimersByTimeAsync(3000);
  await run;
  expect(f.errors).toEqual(['timeout']);
  expect(f.sockets.every((s) => s.readyState === 3)).toBe(true);
});

test.each([
  { currentDisplay: 9, displays: [{ width: 1920, height: 1080 }] },
  { displays: [{ width: 0, height: 1080 }] },
  { displays: [{ width: 8192, height: 8192 }] },
  {
    displays: Array.from({ length: 17 }, () => ({ width: 1920, height: 1080 })),
  },
])(
  'malformed peer displays fail before capture or UI publication: %j',
  async (peer) => {
    const f = fixture({ peerInfo: { platform: 'Windows', ...peer } });
    const run = f.connect();
    await until(() => f.states.includes('awaitingApproval'));
    await f.session.submitPassword('synthetic');
    await run;
    expect(f.errors).toEqual(['protocol']);
    expect(f.states).not.toContain('connected');
    expect(f.messages).toHaveLength(0);
    expect(f.clientMessages.some((m) => m.misc?.captureDisplays)).toBe(false);
  },
);

test('invalid display updates cannot reach an established session UI', async () => {
  const f = fixture();
  const run = f.connect();
  await until(() => f.states.includes('awaitingApproval'));
  await f.session.submitPassword('synthetic');
  await until(() => f.states.includes('connected'));
  f.send({ misc: { switchDisplay: { width: 0, height: 1080 } } });
  await run;
  expect(f.errors).toEqual(['protocol']);
  expect(f.messages.some((m) => m.misc?.switchDisplay)).toBe(false);
});

test('a second login response cannot reset an established session', async () => {
  const f = fixture();
  const run = f.connect();
  await until(() => f.states.includes('awaitingApproval'));
  await f.session.submitPassword('synthetic');
  await until(() => f.states.includes('connected'));
  f.send({
    loginResponse: {
      peerInfo: {
        platform: 'Windows',
        displays: [{ width: 1920, height: 1080 }],
      },
    },
  });
  await run;
  expect(f.errors).toEqual(['protocol']);
  expect(f.states.filter((state) => state === 'connected')).toHaveLength(1);
  expect(f.messages.filter((message) => message.loginResponse)).toHaveLength(1);
});

test.each([
  { advertised: undefined, rendezvous: 1, picked: 0 },
  { advertised: 0, rendezvous: 1, picked: 0 },
  { advertised: 1, rendezvous: 0, picked: 1 },
  { advertised: 3, rendezvous: 0, picked: 1 },
])(
  'verified peer offer $advertised selects $picked independently of rendezvous metadata',
  async ({ advertised, rendezvous, picked }) => {
    const f = fixture({
      kxVersion: advertised,
      rendezvousKxVersion: rendezvous,
    });
    const run = f.connect();
    await until(() => f.states.includes('awaitingApproval'));
    expect(f.exchanges).toHaveLength(1);
    expect(f.exchanges[0].kxVersion).toBe(picked);
    expect(f.security.at(-1)).toBe(picked);
    await f.session.submitPassword('synthetic');
    await until(() => f.states.includes('connected'));
    expect(f.security.at(-1)).toBe(picked);
    expect(f.errors).toEqual([]);
    f.session.disconnect();
    await run;
    expect(f.security.at(-1)).toBeUndefined();
  },
);

test('tampered signed KX advertisement stops before key exchange and authentication', async () => {
  const f = fixture({ kxVersion: 1, tamperOffer: true });
  await f.connect();
  expect(f.errors).toEqual(['identity']);
  expect(f.exchanges).toHaveLength(0);
  expect(f.clientMessages).toHaveLength(0);
  expect(f.security.every((value) => value === undefined)).toBe(true);
});

test('picked version downgrade fails without a legacy retry or password submission', async () => {
  const f = fixture({ kxVersion: 1, tamperPicked: true });
  await f.connect();
  expect(f.exchanges).toHaveLength(1);
  expect(f.exchanges[0].kxVersion).toBe(1);
  expect(f.errors).toEqual(['encryption']);
  expect(f.clientMessages).toHaveLength(0);
  expect(f.sockets).toHaveLength(2);
  expect(f.security.at(-1)).toBeUndefined();
});

test('reconnecting from legacy to KX 1 clears the old session security state', async () => {
  const options = { kxVersion: 0 };
  const f = fixture(options);
  const first = f.connect();
  await until(() => f.security.at(-1) === 0);
  f.session.disconnect();
  await first;
  expect(f.security.at(-1)).toBeUndefined();
  options.kxVersion = 1;
  const second = f.connect();
  await until(() => f.exchanges.length === 2 && f.security.at(-1) === 1);
  expect(f.exchanges[1].kxVersion).toBe(1);
  f.session.disconnect();
  await second;
});

test('独立 FileTransfer 登录复用签名认证且不订阅画面或授予输入', async () => {
  const f = fixture({
    kind: 'file',
    kxVersion: 1,
    peerInfo: { platform: 'Windows', version: '1.5.0' },
  });
  const run = f.connect();
  await until(() => f.states.at(-1) === 'awaitingApproval');
  expect(f.relayRequests[0].connType).toBe(hbb.ConnType.FILE_TRANSFER);
  expect(f.clientMessages[0].loginRequest?.fileTransfer).toBeTruthy();
  expect(f.clientMessages[0].loginRequest?.option).toBeNull();
  expect(f.session.sendInput({ keyEvent: { seq: 'x', press: true } })).toBe(
    false,
  );
  await expect(
    f.session.sendFile({ fileAction: { readDir: { path: '' } } }),
  ).rejects.toThrow();
  await f.session.submitPassword('file-specific');
  await until(() => f.states.at(-1) === 'connected');
  expect(f.clientMessages.some((m) => m.misc?.captureDisplays)).toBe(false);
  await f.session.sendFile({ fileAction: { readDir: { path: 'C:/Users' } } });
  await until(() => f.clientMessages.some((m) => !!m.fileAction?.readDir));
  expect(f.security).toContain(1);
  f.session.disconnect();
  await run;
});
