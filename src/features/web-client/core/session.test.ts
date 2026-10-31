/** @jest-environment node */
import { afterEach, beforeAll, expect, jest, test } from '@jest/globals';
import sodium from 'libsodium-wrappers';
import { hbb } from '../protocol';
import * as cryptography from './crypto';
import {
  type FileAuthentication,
  RemoteSession,
  type SessionState,
} from './session';

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
    serverKey?: {
      publicKey: Uint8Array;
      privateKey: Uint8Array;
      keyType: string;
    };
    salt?: string;
    challenge?: string;
    wrongPassword?: boolean;
    wrongIdentity?: boolean;
    offline?: boolean;
    deny?: boolean;
    clickOnly?: boolean;
    holdLogin?: boolean;
    noChallenge?: boolean;
    kxVersion?: number;
    rendezvousKxVersion?: number;
    tamperOffer?: boolean;
    tamperPicked?: boolean;
    peerInfo?: hbb.IPeerInfo;
    advertisedRelay?: string;
    relayServerUrl?: string;
    videoFlow?: import('./session').VideoFlowMode;
    credentials?: Pick<
      import('./remembered-credentials').RememberedCredentials,
      'load' | 'save' | 'forget' | 'cancel'
    >;
  } = {},
) {
  const server = options.serverKey ?? sodium.crypto_sign_keypair();
  const peer = sodium.crypto_sign_keypair();
  const box = sodium.crypto_box_keypair();
  const id = '123456789';
  const states: SessionState[] = [];
  const authentication: boolean[] = [];
  const errors: string[] = [];
  const security: (cryptography.KxVersion | undefined)[] = [];
  const exchanges: hbb.IPublicKey[] = [];
  const relayRequests: hbb.IRequestRelay[] = [];
  const permissions: {
    keyboard: boolean;
    clipboard: boolean;
    audio?: boolean;
    recording?: boolean;
  }[] = [];
  const permissionMessageCounts: number[] = [];
  const messages: hbb.Message[] = [];
  const clientMessages: hbb.Message[] = [];
  const sockets: Socket[] = [];
  const openedUrls: string[] = [];
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
      authentication: (succeeded) => authentication.push(succeeded),
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
      openedUrls.push(url);
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
                      relayServer:
                        options.advertisedRelay ?? 'example.test:21117',
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
              send({
                hash: {
                  salt: options.salt ?? 'salt',
                  challenge: options.challenge ?? 'challenge',
                },
              });
            return;
          }
          const message = hbb.Message.decode(cipher.decrypt(bytes));
          clientMessages.push(message);
          if (message.loginRequest && options.holdLogin) return;
          if (message.loginRequest && options.clickOnly) {
            send({ loginResponse: { error: 'No Password Access' } });
          } else if (message.loginRequest?.password?.length) {
            if (options.wrongPassword)
              send({ loginResponse: { error: 'Wrong Password' } });
            else if (options.deny)
              send({ loginResponse: { error: 'Rejected' } });
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
    options.credentials,
    options.videoFlow,
  );
  active.push(session);
  const profile = {
    idServerUrl: 'wss://example.test/id',
    relayServerUrl: options.relayServerUrl ?? 'wss://example.test/relay',
    serverPublicKey: sodium.to_base64(
      server.publicKey,
      sodium.base64_variants.ORIGINAL,
    ),
  };
  const connect = (reuse?: FileAuthentication) =>
    session.connect(profile, id, reuse);
  return {
    session,
    serverKey: server,
    connect,
    profile,
    states,
    authentication,
    errors,
    security,
    exchanges,
    relayRequests,
    permissions,
    permissionMessageCounts,
    messages,
    clientMessages,
    sockets,
    openedUrls,
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

test.each([0, 1])(
  '原生认证报告仅来自已解析LoginResponse，KX %i保持加密握手',
  async (kxVersion) => {
    const success = await connectedFixture(kxVersion);
    expect(success.authentication).toEqual([true]);
    success.session.disconnect();
    await success.run;
    const denied = fixture({ kxVersion, deny: true });
    const run = denied.connect();
    await until(() => denied.states.at(-1) === 'awaitingApproval');
    expect(denied.authentication).toEqual([]);
    await denied.session.submitPassword('synthetic');
    await until(() => denied.states.at(-1) === 'failed');
    expect(denied.authentication).toEqual([false]);
    await run;
  },
);

test.each(['Android', 'Linux', 'Mac OS'])(
  'non-Windows peer platform %s connects without a protocol error',
  async (platform) => {
    const f = fixture({
      peerInfo: {
        platform,
        version: '1.4.9',
        displays: [{ x: 0, y: 0, width: 1080, height: 1920 }],
      },
    });
    const run = f.connect();
    await until(() => f.states.at(-1) === 'awaitingApproval');
    await f.session.submitPassword('synthetic');
    await until(() => f.states.at(-1) === 'connected');
    expect(f.authentication).toEqual([true]);
    expect(f.errors).toEqual([]);
    f.session.disconnect();
    await run;
  },
);

test.each([0, 1])(
  'complete WSS relay advertisement reaches encrypted authentication with KX %i using the fixed endpoint',
  async (kxVersion) => {
    const relayServerUrl = 'wss://186.241.77.98:22443/ws/relay';
    const f = fixture({
      kxVersion,
      relayServerUrl,
      advertisedRelay: 'WSS://186.241.77.98:22443/ws/relay',
    });
    const run = f.connect();
    await until(() => f.states.at(-1) === 'awaitingApproval');
    expect(f.security.at(-1)).toBe(kxVersion);
    expect(f.exchanges).toHaveLength(1);
    expect(f.clientMessages[0].loginRequest?.username).toBe('123456789');
    expect(f.openedUrls).toEqual([f.profile.idServerUrl, relayServerUrl]);
    await f.session.submitPassword('synthetic');
    await until(() => f.states.at(-1) === 'connected');
    expect(f.errors).toEqual([]);
    expect(f.openedUrls).toEqual([f.profile.idServerUrl, relayServerUrl]);
    f.session.disconnect();
    await run;
  },
);

test('mismatched complete WSS relay advertisement stops before opening the relay', async () => {
  const f = fixture({
    relayServerUrl: 'wss://186.241.77.98:22443/ws/relay',
    advertisedRelay: 'wss://186.241.77.98:22443/ws/id',
  });
  await f.connect();
  expect(f.errors).toEqual(['configuration']);
  expect(f.openedUrls).toEqual([f.profile.idServerUrl]);
  expect(f.exchanges).toHaveLength(0);
  expect(f.clientMessages).toHaveLength(0);
});

test('自定义画质真实加密消息使用NotSet与左移百分比，预设恢复不带自定义', async () => {
  const f = await connectedFixture(1);
  f.session.setReadOnly(true);
  for (const customQuality of [10, 50, 100]) {
    expect(
      f.session.setViewOptions({
        quality: 'custom',
        customQuality,
        fps: 5,
        remoteCursor: true,
      }),
    ).toBe(true);
    await until(
      () =>
        f.clientMessages.at(-1)?.misc?.option?.customImageQuality ===
        customQuality << 8,
    );
    expect(f.clientMessages.at(-1)?.misc?.option).toMatchObject({
      imageQuality: hbb.ImageQuality.NotSet,
      customImageQuality: customQuality << 8,
      customFps: 5,
    });
  }
  for (const customQuality of [undefined, 9, 101, 50.5, NaN, Infinity])
    expect(
      f.session.setViewOptions({
        quality: 'custom',
        customQuality,
        fps: 30,
        remoteCursor: true,
      }),
    ).toBe(false);
  expect(
    f.session.setViewOptions({
      quality: 'balanced',
      customQuality: 100,
      fps: 60,
      remoteCursor: false,
    }),
  ).toBe(true);
  await until(() => f.clientMessages.at(-1)?.misc?.option?.customFps === 60);
  expect(f.clientMessages.at(-1)?.misc?.option?.imageQuality).toBe(
    hbb.ImageQuality.Balanced,
  );
  expect(
    Object.hasOwn(
      f.clientMessages.at(-1)?.misc?.option ?? {},
      'customImageQuality',
    ),
  ).toBe(false);
  f.session.disconnect();
  await f.run;
});

test('分辨率现代消息使用当前原生索引，稀疏热更新保留能力并遵守只读与撤权', async () => {
  const f = fixture({
    peerInfo: {
      platform: 'Windows',
      version: '1.4.9',
      currentDisplay: 1,
      displays: [
        { name: 'A', width: 800, height: 600 },
        { name: 'B', width: 1024, height: 768 },
      ],
      resolutions: { resolutions: [{ width: 1280, height: 720 }] },
    },
  });
  const run = f.connect();
  await until(() => f.states.at(-1) === 'awaitingApproval');
  await f.session.submitPassword('synthetic');
  await until(() => f.states.at(-1) === 'connected');
  expect(f.session.changeResolution(0, 1280, 720)).toBe(false);
  expect(f.session.changeResolution(1, 1920, 1080)).toBe(false);
  f.send({
    peerInfo: {
      currentDisplay: 0,
      displays: [
        { name: 'A', width: 800, height: 600 },
        { name: 'B', width: 1024, height: 768 },
      ],
    },
  });
  await until(() => f.messages.some((message) => !!message.peerInfo));
  expect(f.session.changeResolution(1, 1280, 720)).toBe(true);
  await until(() =>
    f.clientMessages.some((message) => !!message.misc?.changeDisplayResolution),
  );
  expect(f.clientMessages.at(-1)?.misc?.changeDisplayResolution).toMatchObject({
    display: 1,
    resolution: { width: 1280, height: 720 },
  });
  expect(f.clientMessages.at(-1)?.misc?.changeResolution).toBeFalsy();
  f.session.setReadOnly(true);
  expect(f.session.changeResolution(1, 1280, 720)).toBe(false);
  f.session.setReadOnly(false);
  await keyboardPermission(f, false);
  expect(f.session.changeResolution(1, 1280, 720)).toBe(false);
  f.session.disconnect();
  await run;
});

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
  pending[1](new Uint8Array(32).fill(2).buffer);
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

test.each([0, 1])(
  '当前桌面候选对文件新 challenge 重新认证，sessionId 无损关联（KX %s）',
  async (kxVersion) => {
    const desktop = await connectedFixture(kxVersion);
    const candidate = desktop.session.authenticationForFiles()!;
    expect(candidate).toBeDefined();
    const desktopLogin = desktop.clientMessages
      .filter((m) => m.loginRequest?.password?.length)
      .at(-1)!.loginRequest!;
    expect(typeof desktopLogin.sessionId).not.toBe('number');
    expect(desktopLogin.sessionId!.toString()).not.toBe('0');
    const files = fixture({
      kind: 'file',
      kxVersion,
      serverKey: desktop.serverKey,
      challenge: 'new-file-challenge',
      peerInfo: { platform: 'Windows' },
    });
    const expected = await cryptography.passwordChallenge(
      'synthetic',
      'salt',
      'new-file-challenge',
    );
    const run = files.connect(candidate);
    await until(() => files.states.at(-1) === 'connected');
    const login = files.clientMessages.find(
      (m) => m.loginRequest,
    )?.loginRequest;
    if (!login) throw new Error('Missing file login');
    expect(login.sessionId!.toString()).toBe(
      desktopLogin.sessionId!.toString(),
    );
    expect(login.password).toEqual(expected);
    expect(login.password).not.toEqual(desktopLogin.password);
    expect(candidate.passwordH1.every((b) => b === 0)).toBe(true);
    expect(files.relayRequests[0].connType).toBe(hbb.ConnType.FILE_TRANSFER);
    expect(files.session.authenticationForFiles()).toBeUndefined();
    files.session.disconnect();
    await run;
    desktop.session.disconnect();
    await desktop.run;
  },
);

test.each(['salt', 'profile', 'wrong', 'click'])(
  '文件自动认证 %s 不绕过新认证且清零副本',
  async (reason) => {
    const desktop = await connectedFixture();
    const candidate = desktop.session.authenticationForFiles()!;
    const files = fixture({
      kind: 'file',
      serverKey: reason === 'profile' ? undefined : desktop.serverKey,
      salt: reason === 'salt' ? 'different-salt' : 'salt',
      wrongPassword: reason === 'wrong',
      clickOnly: reason === 'click',
    });
    const run = files.connect(candidate);
    await until(() => files.clientMessages.some((m) => m.loginRequest));
    await until(() => candidate.passwordH1.every((b) => b === 0));
    expect(files.states).not.toContain('connected');
    expect(files.clientMessages.filter((m) => m.loginRequest)).toHaveLength(1);
    if (reason === 'salt' || reason === 'profile')
      expect(files.clientMessages[0].loginRequest!.password).toHaveLength(0);
    if (reason === 'wrong')
      await until(() => files.errors.includes('password'));
    files.session.disconnect();
    await run;
    desktop.session.disconnect();
    await desktop.run;
  },
);

test('错误密码后人工批准不保留候选；纯人工批准也无文件材料', async () => {
  const f = fixture({ wrongPassword: true });
  const run = f.connect();
  await until(() => f.states.at(-1) === 'awaitingApproval');
  await f.session.submitPassword('incorrect');
  await until(() => f.errors.includes('password'));
  f.send({
    loginResponse: {
      peerInfo: {
        platform: 'Windows',
        displays: [{ width: 100, height: 100 }],
      },
    },
  });
  await until(() => f.states.at(-1) === 'connected');
  expect(f.session.authenticationForFiles()).toBeUndefined();
  f.session.disconnect();
  await run;
  const click = fixture({ clickOnly: true });
  const clickRun = click.connect();
  await until(() => click.states.at(-1) === 'awaitingApproval');
  click.send({
    loginResponse: {
      peerInfo: {
        platform: 'Windows',
        displays: [{ width: 100, height: 100 }],
      },
    },
  });
  await until(() => click.states.at(-1) === 'connected');
  expect(click.session.authenticationForFiles()).toBeUndefined();
  click.session.disconnect();
  await clickRun;
});

test.each(['Wrong Password', 'No Password Access'])(
  'H2 派生期间收到 %s 和人工成功，不复活敏感候选或重发登录',
  async (error) => {
    const f = fixture();
    const run = f.connect();
    await until(() => f.states.at(-1) === 'awaitingApproval');
    const first = new Uint8Array(32).fill(7);
    let finish!: (value: ArrayBuffer) => void;
    jest
      .spyOn(crypto.subtle, 'digest')
      .mockResolvedValueOnce(first.buffer)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    const submitted = f.session.submitPassword('synthetic');
    await until(() => !!finish);
    f.send({ loginResponse: { error } });
    await until(() =>
      error === 'Wrong Password'
        ? f.errors.includes('password')
        : f.states.at(-1) === 'awaitingApproval',
    );
    f.send({
      loginResponse: {
        peerInfo: {
          platform: 'Windows',
          displays: [{ width: 100, height: 100 }],
        },
      },
    });
    await until(() => f.states.at(-1) === 'connected');
    const second = new Uint8Array(32).fill(8);
    finish(second.buffer);
    await submitted;
    expect(f.session.authenticationForFiles()).toBeUndefined();
    expect(first.every((byte) => byte === 0)).toBe(true);
    expect(second.every((byte) => byte === 0)).toBe(true);
    expect(f.clientMessages.filter((m) => m.loginRequest)).toHaveLength(1);
    f.session.disconnect();
    await run;
  },
);

test('文件撤权和断开清除桌面敏感材料，不可跨目标复用', async () => {
  const f = await connectedFixture();
  const candidate = f.session.authenticationForFiles()!;
  f.send({
    misc: {
      permissionInfo: {
        permission: hbb.PermissionInfo.Permission.File,
        enabled: false,
      },
    },
  });
  await until(() => f.session.authenticationForFiles() === undefined);
  f.session.disconnect();
  await f.run;
  const files = fixture({ kind: 'file', serverKey: f.serverKey });
  candidate.targetId = '987654321';
  const run = files.connect(candidate);
  await until(() => files.clientMessages.some((m) => m.loginRequest));
  expect(files.clientMessages[0].loginRequest!.password).toHaveLength(0);
  expect(candidate.passwordH1.every((b) => b === 0)).toBe(true);
  files.session.disconnect();
  await run;
});

test('文件撤权再恢复不能复活期间仍在派生的密码材料', async () => {
  const f = fixture();
  const run = f.connect();
  await until(() => f.states.at(-1) === 'awaitingApproval');
  let finish!: (value: ArrayBuffer) => void;
  jest.spyOn(crypto.subtle, 'digest').mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const submitted = f.session.submitPassword('synthetic');
  f.send({
    misc: {
      permissionInfo: {
        permission: hbb.PermissionInfo.Permission.File,
        enabled: false,
      },
    },
  });
  await until(() => f.permissions.length === 1);
  f.send({
    misc: {
      permissionInfo: {
        permission: hbb.PermissionInfo.Permission.File,
        enabled: true,
      },
    },
  });
  await until(() => f.permissions.length === 2);
  const hash = new Uint8Array(32).fill(9);
  finish(hash.buffer);
  await submitted;
  await until(() => f.states.at(-1) === 'connected');
  expect(f.session.authenticationForFiles()).toBeUndefined();
  expect(hash.every((b) => b === 0)).toBe(true);
  f.session.disconnect();
  await run;
});

test('显示选项使用原生 OptionMessage，拒绝无界或错误值', async () => {
  const f = await connectedFixture();
  expect(
    f.session.setViewOptions({ quality: 'best', fps: 15, remoteCursor: false }),
  ).toBe(true);
  await until(() =>
    f.clientMessages.some((m) => m.misc?.option?.customFps === 15),
  );
  expect(f.clientMessages.at(-1)?.misc?.option).toMatchObject({
    imageQuality: hbb.ImageQuality.Best,
    customFps: 15,
    showRemoteCursor: hbb.OptionMessage.BoolOption.No,
  });
  const count = f.clientMessages.length;
  for (const fps of [0, 4, 121, 1.5, Infinity, NaN])
    expect(
      f.session.setViewOptions({
        quality: 'balanced',
        fps,
        remoteCursor: true,
      }),
    ).toBe(false);
  expect(
    f.session.setViewOptions({
      quality: 'unsupported' as 'best',
      fps: 30,
      remoteCursor: true,
    }),
  ).toBe(false);
  expect(f.clientMessages).toHaveLength(count);
  for (const quality of ['custom', 'low', 'balanced', 'best'] as const) {
    expect(
      f.session.setViewOptions({
        quality,
        customQuality: 75,
        fps: 120,
        remoteCursor: true,
      }),
    ).toBe(true);
    expect(f.clientMessages.at(-1)?.misc?.option).toMatchObject({
      customFps: 120,
      ...(quality === 'custom'
        ? { imageQuality: hbb.ImageQuality.NotSet, customImageQuality: 75 << 8 }
        : {}),
    });
  }
  f.session.disconnect();
  await f.run;
  const next = f.connect();
  await until(() => f.states.at(-1) === 'awaitingApproval');
  await f.session.submitPassword('synthetic');
  await until(() => f.states.at(-1) === 'connected');
  expect(
    f.clientMessages.filter((message) => message.loginRequest).at(-1)
      ?.loginRequest?.option?.customFps,
  ).toBe(30);
  f.session.disconnect();
  await next;
});

test('只读先释放按下状态，再阻止所有键鼠与文本；不伪装撤权', async () => {
  const f = await connectedFixture();
  const controlKey = hbb.ControlKey.Shift;
  f.session.sendInput({ keyEvent: { controlKey, down: true } });
  f.session.sendInput({ mouseEvent: { mask: 1 | (1 << 3) } });
  expect(f.session.setReadOnly(true)).toBe(true);
  await until(
    () =>
      f.clientMessages.filter((m) => m.keyEvent || m.mouseEvent).length === 4,
  );
  expect(
    f.clientMessages.filter((m) => m.keyEvent || m.mouseEvent).slice(-2),
  ).toMatchObject([
    { keyEvent: { controlKey, down: false } },
    { mouseEvent: { mask: 2 | (1 << 3) } },
  ]);
  expect(
    f.session.sendInput({ keyEvent: { seq: 'blocked', press: true } }),
  ).toBe(false);
  expect(f.session.sendInput({ mouseEvent: { mask: 0, x: 1, y: 1 } })).toBe(
    false,
  );
  expect(f.session.setReadOnly(false)).toBe(true);
  expect(
    f.session.sendInput({ keyEvent: { seq: 'allowed', press: true } }),
  ).toBe(true);
  await keyboardPermission(f, false);
  f.session.setReadOnly(true);
  f.session.setReadOnly(false);
  expect(
    f.session.sendInput({ keyEvent: { seq: 'still-blocked', press: true } }),
  ).toBe(false);
  f.session.disconnect();
  await f.run;
});

test('只读不穿过撤权发送释放，恢复权限只清理原持键', async () => {
  const f = await connectedFixture();
  f.session.sendInput({
    keyEvent: { controlKey: hbb.ControlKey.Shift, down: true },
  });
  await keyboardPermission(f, false);
  const before = f.clientMessages.length;
  f.session.setReadOnly(true);
  await new Promise((resolve) => setTimeout(resolve, 1));
  expect(f.clientMessages).toHaveLength(before);
  await keyboardPermission(f, true);
  expect(f.clientMessages.at(-1)?.keyEvent).toMatchObject({
    controlKey: hbb.ControlKey.Shift,
    down: false,
  });
  expect(
    f.session.sendInput({ keyEvent: { seq: 'read-only', press: true } }),
  ).toBe(false);
  f.session.disconnect();
  await f.run;
});

test('SAS 按能力启用，原生功能键不会被登记为持键并重复发送', async () => {
  const f = await connectedFixture();
  expect(
    f.session.sendInput({
      keyEvent: { controlKey: hbb.ControlKey.CtrlAltDel, down: true },
    }),
  ).toBe(false);
  f.send({
    peerInfo: {
      platform: 'Windows',
      sasEnabled: true,
      displays: [{ width: 800, height: 600 }],
    },
  });
  await until(() => f.messages.some((m) => m.peerInfo));
  expect(
    f.session.sendInput({
      keyEvent: {
        controlKey: hbb.ControlKey.CtrlAltDel,
        down: true,
        mode: hbb.KeyboardMode.Legacy,
      },
    }),
  ).toBe(true);
  expect(
    f.session.sendInput({
      keyEvent: {
        controlKey: hbb.ControlKey.LockScreen,
        down: true,
        mode: hbb.KeyboardMode.Legacy,
      },
    }),
  ).toBe(true);
  await until(() => f.clientMessages.filter((m) => m.keyEvent).length === 2);
  f.session.setReadOnly(true);
  f.session.disconnect();
  await f.run;
  expect(f.clientMessages.filter((m) => m.keyEvent)).toHaveLength(2);
});

test('随机 uint64 高位及低位均经 protobuf 无损传递', async () => {
  jest.spyOn(crypto, 'getRandomValues').mockImplementationOnce((array) => {
    (array as Uint8Array).set([255, 255, 255, 255, 255, 255, 255, 253]);
    return array;
  });
  const f = fixture();
  const run = f.connect();
  await until(() => f.clientMessages.some((m) => m.loginRequest));
  expect(f.clientMessages[0].loginRequest!.sessionId!.toString()).toBe(
    '18446744073709551613',
  );
  f.session.disconnect();
  await run;
});

test('剪贴板设置同时发送原生选项并阻断双向内容，权限仍为独立上限', async () => {
  const f = await connectedFixture();
  expect(f.session.setClipboardEnabled(false)).toBe(true);
  expect(f.clientMessages.at(-1)?.misc?.option?.disableClipboard).toBe(
    hbb.OptionMessage.BoolOption.Yes,
  );
  expect(f.session.sendClipboard({ content: new Uint8Array([1]) })).toBe(false);
  expect(f.session.sendImage(new Uint8Array([1]))).toBe(false);
  await expect(f.session.flushClipboard()).rejects.toThrow();
  const count = f.messages.length;
  f.send({ clipboard: { content: new Uint8Array([1]) } });
  await new Promise((resolve) => setTimeout(resolve, 5));
  expect(f.messages).toHaveLength(count);
  f.session.setClipboardEnabled(true);
  expect(f.clientMessages.at(-1)?.misc?.option?.disableClipboard).toBe(
    hbb.OptionMessage.BoolOption.No,
  );
  expect(f.messages).toHaveLength(count);
  f.send({
    misc: {
      permissionInfo: {
        permission: hbb.PermissionInfo.Permission.Clipboard,
        enabled: false,
      },
    },
  });
  await until(() => f.permissions.at(-1)?.clipboard === false);
  expect(f.session.sendClipboard({ content: new Uint8Array([1]) })).toBe(false);
  f.session.disconnect();
  await f.run;
});

test('统计只计当前屏VP9负载，延迟来自对端上次往返探测，断开清空', async () => {
  const f = await connectedFixture();
  f.send({
    videoFrame: {
      display: 0,
      vp9s: {
        frames: [{ data: new Uint8Array(10) }, { data: new Uint8Array(20) }],
      },
    },
  });
  await until(() => f.session.qualityMetrics().videoBytes === 30);
  f.send({
    videoFrame: {
      display: 1,
      vp9s: { frames: [{ data: new Uint8Array(99) }] },
    },
  });
  f.send({ testDelay: { lastDelay: 0, fromClient: false } });
  await until(() => f.clientMessages.some((m) => !!m.testDelay));
  expect(f.session.qualityMetrics()).toEqual({
    received: 2,
    videoBytes: 30,
    delay: undefined,
    targetBitrateKbps: undefined,
    testDelayReceived: 1,
    testDelayReplied: 1,
    lastProbeAgeMs: expect.any(Number),
    transport: expect.objectContaining({ queuedPackets: 0, queuedBytes: 0 }),
  });
  f.send({ testDelay: { lastDelay: 42, fromClient: false } });
  await until(() => f.session.qualityMetrics().delay === 42);
  f.send({ testDelay: { lastDelay: 999, fromClient: true } });
  await new Promise((resolve) => setTimeout(resolve, 5));
  expect(f.session.qualityMetrics().delay).toBe(42);
  f.session.disconnect();
  expect(f.session.qualityMetrics()).toEqual({
    received: 0,
    videoBytes: 0,
    delay: undefined,
    targetBitrateKbps: undefined,
    testDelayReceived: 0,
    testDelayReplied: 0,
    lastProbeAgeMs: undefined,
    transport: undefined,
  });
  await f.run;
});

test('目标码率沿用原生kbit/s并原样回复探测，视频重置保留连接诊断，重连清空', async () => {
  const f = await connectedFixture();
  f.send({
    testDelay: {
      time: 123,
      lastDelay: 350,
      targetBitrate: 2010,
      fromClient: false,
    },
  });
  await until(() => f.session.qualityMetrics().targetBitrateKbps === 2010);
  expect(
    f.clientMessages.findLast((message) => !!message.testDelay)?.testDelay,
  ).toMatchObject({
    time: expect.anything(),
    lastDelay: 350,
    targetBitrate: 2010,
    fromClient: false,
  });
  expect(
    f.clientMessages
      .findLast((message) => !!message.testDelay)
      ?.testDelay?.time?.toString(),
  ).toBe('123');
  f.send({ testDelay: { targetBitrate: 4000, fromClient: true } });
  await new Promise((resolve) => setTimeout(resolve, 5));
  f.session.resetVideoCounters();
  expect(f.session.qualityMetrics()).toMatchObject({
    targetBitrateKbps: 2010,
    transport: expect.objectContaining({ queuedPackets: 0, queuedBytes: 0 }),
  });
  f.send({ testDelay: { targetBitrate: 0, fromClient: false } });
  await until(() => f.session.qualityMetrics().targetBitrateKbps === undefined);
  f.send({ testDelay: { targetBitrate: 7777, fromClient: false } });
  await until(() => f.session.qualityMetrics().targetBitrateKbps === 7777);
  f.session.disconnect();
  await f.run;
  expect(f.session.qualityMetrics().targetBitrateKbps).toBeUndefined();
  const next = f.connect();
  await until(() => f.states.at(-1) === 'awaitingApproval');
  await f.session.submitPassword('synthetic');
  await until(() => f.states.at(-1) === 'connected');
  expect(f.session.qualityMetrics().targetBitrateKbps).toBeUndefined();
  expect(f.session.qualityMetrics().transport?.queuedPackets).toBe(0);
  f.session.disconnect();
  await next;
  expect(f.session.qualityMetrics().transport).toBeUndefined();
});

test('重复延迟值仍累计真实探测，年龄随时钟更新，视频重置保留而重连清空', async () => {
  let now = 100;
  jest.spyOn(performance, 'now').mockImplementation(() => now);
  const f = await connectedFixture();
  expect(f.session.qualityMetrics()).toMatchObject({
    testDelayReceived: 0,
    testDelayReplied: 0,
    lastProbeAgeMs: undefined,
  });
  const probe = {
    time: 123,
    lastDelay: 335,
    targetBitrate: 2010,
    fromClient: false,
  };
  f.send({ testDelay: probe });
  await until(() => f.session.qualityMetrics().testDelayReplied === 1);
  expect(f.session.qualityMetrics()).toMatchObject({
    testDelayReceived: 1,
    testDelayReplied: 1,
    lastProbeAgeMs: 0,
  });
  now = 145;
  expect(f.session.qualityMetrics().lastProbeAgeMs).toBe(45);
  f.send({ testDelay: { ...probe, fromClient: true } });
  await new Promise((resolve) => setTimeout(resolve, 5));
  expect(f.session.qualityMetrics()).toMatchObject({
    testDelayReceived: 1,
    testDelayReplied: 1,
    lastProbeAgeMs: 45,
  });
  now = 200;
  f.send({ testDelay: probe });
  await until(() => f.session.qualityMetrics().testDelayReplied === 2);
  f.session.resetVideoCounters();
  now = 220;
  expect(f.session.qualityMetrics()).toMatchObject({
    delay: 335,
    testDelayReceived: 2,
    testDelayReplied: 2,
    lastProbeAgeMs: 20,
  });
  expect(
    f.clientMessages.filter((message) => !!message.testDelay),
  ).toHaveLength(2);
  f.session.disconnect();
  await f.run;
  expect(f.session.qualityMetrics()).toMatchObject({
    testDelayReceived: 0,
    testDelayReplied: 0,
    lastProbeAgeMs: undefined,
  });
  const next = f.connect();
  await until(() => f.states.at(-1) === 'awaitingApproval');
  await f.session.submitPassword('synthetic');
  await until(() => f.states.at(-1) === 'connected');
  expect(f.session.qualityMetrics()).toMatchObject({
    testDelayReceived: 0,
    testDelayReplied: 0,
    lastProbeAgeMs: undefined,
  });
  f.session.disconnect();
  await next;
});

test('探测年龄不受负数及非有限时钟污染且保持有界', async () => {
  let now = 100;
  jest.spyOn(performance, 'now').mockImplementation(() => now);
  const f = await connectedFixture();
  f.send({ testDelay: { lastDelay: 335, fromClient: false } });
  await until(() => f.session.qualityMetrics().testDelayReplied === 1);
  for (const invalid of [-100, Number.NaN, Number.POSITIVE_INFINITY]) {
    now = invalid;
    expect(f.session.qualityMetrics().lastProbeAgeMs).toBe(0);
  }
  now = Number.MAX_VALUE;
  expect(f.session.qualityMetrics().lastProbeAgeMs).toBe(
    Number.MAX_SAFE_INTEGER,
  );
  now = 120;
  expect(f.session.qualityMetrics().lastProbeAgeMs).toBe(20);
  f.session.disconnect();
  await f.run;
});

test('探测回包发送失败不计为成功回包并按会话失败清空诊断', async () => {
  const f = await connectedFixture();
  f.send({ testDelay: { lastDelay: 335, fromClient: false } });
  await until(() => f.session.qualityMetrics().testDelayReplied === 1);
  const failureSnapshots: ReturnType<RemoteSession['qualityMetrics']>[] = [];
  const socket = f.sockets.at(-1);
  if (!socket) throw new Error('Missing synthetic relay socket');
  jest.spyOn(socket, 'send').mockImplementation(() => {
    failureSnapshots.push(f.session.qualityMetrics());
    throw new Error('Synthetic socket send failure');
  });
  f.send({ testDelay: { lastDelay: 335, fromClient: false } });
  await f.run;
  expect(failureSnapshots).toHaveLength(1);
  expect(failureSnapshots[0]).toMatchObject({
    testDelayReceived: 2,
    testDelayReplied: 1,
  });
  expect(f.states.at(-1)).toBe('failed');
  expect(f.errors).toContain('transport');
  expect(f.session.qualityMetrics()).toMatchObject({
    testDelayReceived: 0,
    testDelayReplied: 0,
    lastProbeAgeMs: undefined,
  });
});

test('多编码登录能力、聊天、通话归属和录制权限走真实加密protobuf', async () => {
  const f = fixture({ kxVersion: 1 });
  f.session.configureVideo({
    vp9: true,
    vp8: true,
    av1: true,
    vp9_444: true,
    av1_444: true,
  });
  const run = f.connect();
  await until(() => f.states.at(-1) === 'awaitingApproval');
  await f.session.submitPassword('synthetic');
  await until(() => f.states.at(-1) === 'connected');
  expect(
    f.clientMessages.find((m) => m.loginRequest)?.loginRequest?.option
      ?.supportedDecoding,
  ).toMatchObject({
    abilityVp9: 1,
    abilityVp8: 1,
    abilityAv1: 1,
    i444: { vp9: true, av1: true },
  });
  expect(f.session.setCodec('vp9', true)).toBe(true);
  expect(
    f.clientMessages.at(-1)?.misc?.option?.supportedDecoding?.preferChroma,
  ).toBe(hbb.Chroma.I444);
  expect(f.session.setCodec('av1', true)).toBe(true);
  expect(
    f.clientMessages.at(-1)?.misc?.option?.supportedDecoding,
  ).toMatchObject({
    prefer: hbb.SupportedDecoding.PreferCodec.AV1,
    preferChroma: hbb.Chroma.I444,
  });
  expect(f.session.setCodec('auto', true)).toBe(true);
  expect(f.clientMessages.at(-1)?.misc?.option?.supportedDecoding?.prefer).toBe(
    hbb.SupportedDecoding.PreferCodec.Auto,
  );
  expect(f.session.setCodec('vp8', true)).toBe(false);
  expect(f.session.sendChat('你好 <script>alert(1)</script>')).toBe(true);
  expect(f.clientMessages.at(-1)?.misc?.chatMessage?.text).toContain(
    '<script>',
  );
  expect(f.session.sendChat('太快')).toBe(false);
  expect(f.session.sendChat('字'.repeat(4096))).toBe(false);
  f.send({ misc: { chatMessage: { text: '对方消息' } } });
  await until(() =>
    f.messages.some((m) => m.misc?.chatMessage?.text === '对方消息'),
  );
  expect(f.session.startVoiceCall(1234)).toBe(true);
  expect(f.session.sendVoiceFormat(1234)).toBe(false);
  const count = f.messages.length;
  f.send({ voiceCallResponse: { accepted: true, reqTimestamp: 1233 } });
  await new Promise((resolve) => setTimeout(resolve, 5));
  expect(f.messages).toHaveLength(count);
  expect(f.session.sendVoiceFormat(1234)).toBe(false);
  f.send({ voiceCallResponse: { accepted: true, reqTimestamp: 1234 } });
  await until(() => f.messages.length > count);
  expect(f.session.sendVoiceFormat(1234)).toBe(true);
  const acceptedMessages = f.messages.length;
  f.send({ voiceCallResponse: { accepted: true, reqTimestamp: 1234 } });
  f.send({ voiceCallResponse: { accepted: false, reqTimestamp: 1234 } });
  await new Promise((resolve) => setTimeout(resolve, 5));
  expect(f.messages).toHaveLength(acceptedMessages);
  expect(f.session.sendVoiceFormat(1234)).toBe(true);
  expect(await f.session.sendVoiceAudio(1234, new Uint8Array([0xf8, 0]))).toBe(
    true,
  );
  f.send({
    misc: {
      permissionInfo: {
        permission: hbb.PermissionInfo.Permission.Audio,
        enabled: false,
      },
    },
  });
  await until(() => f.permissions.at(-1)?.audio === false);
  expect(await f.session.sendVoiceAudio(1234, new Uint8Array([0xf8, 0]))).toBe(
    false,
  );
  expect(f.session.setRecording(true)).toBe(true);
  expect(f.clientMessages.at(-1)?.misc?.clientRecordStatus).toBe(true);
  f.send({
    misc: {
      permissionInfo: {
        permission: hbb.PermissionInfo.Permission.Recording,
        enabled: false,
      },
    },
  });
  await until(() => f.permissions.at(-1)?.recording === false);
  expect(f.session.setRecording(true)).toBe(false);
  expect(f.session.setRecording(false)).toBe(true);
  f.session.disconnect();
  await run;
});

test('视频反馈模式的真实加密登录与ACK门禁一致，stream不发送额外确认', async () => {
  for (const videoFlow of ['decoded-ack', 'bounded-stream'] as const) {
    const f = fixture({ kxVersion: 1, videoFlow });
    f.session.acknowledgeVideo();
    expect(f.clientMessages).toHaveLength(0);
    const run = f.connect();
    await until(() => f.states.at(-1) === 'awaitingApproval');
    expect(
      f.clientMessages.find((message) => message.loginRequest)?.loginRequest
        ?.videoAckRequired,
    ).toBe(videoFlow === 'decoded-ack');
    f.session.acknowledgeVideo();
    expect(
      f.clientMessages.some((message) => message.misc?.videoReceived),
    ).toBe(false);
    await f.session.submitPassword('synthetic');
    await until(() => f.states.at(-1) === 'connected');
    // 正常解码、废弃批次及Worker早退均共用这个核心门禁。
    for (let i = 0; i < 3; ++i) f.session.acknowledgeVideo();
    expect(
      f.clientMessages.filter((message) => message.misc?.videoReceived),
    ).toHaveLength(videoFlow === 'decoded-ack' ? 3 : 0);
    // 禁止ACK不影响新关键帧请求或其它原生控制消息。
    f.session.refreshVideo();
    expect(f.clientMessages.at(-1)?.misc?.refreshVideo).toBe(true);
    expect(f.session.sendChat('stream-control-test')).toBe(true);
    expect(f.clientMessages.at(-1)?.misc?.chatMessage?.text).toBe(
      'stream-control-test',
    );
    f.session.disconnect();
    const count = f.clientMessages.length;
    f.session.acknowledgeVideo();
    expect(f.clientMessages).toHaveLength(count);
    await run;
  }
});

test('独立文件会话即使构造decoded-ack也不发送视频确认', async () => {
  const f = fixture({ kind: 'file', kxVersion: 1, videoFlow: 'decoded-ack' });
  const run = f.connect();
  await until(() => f.states.at(-1) === 'awaitingApproval');
  expect(f.clientMessages[0].loginRequest?.videoAckRequired).toBe(false);
  await f.session.submitPassword('synthetic');
  await until(() => f.states.at(-1) === 'connected');
  const count = f.clientMessages.length;
  f.session.acknowledgeVideo();
  expect(f.clientMessages).toHaveLength(count);
  await f.session.sendFile({ fileAction: { readDir: { path: 'C:/Users' } } });
  expect(f.clientMessages.at(-1)?.fileAction?.readDir?.path).toBe('C:/Users');
  f.session.disconnect();
  await run;
});

test('核心按远端真实编码/444能力拒绝直接命令，动态撤销与重连不保留旧资格', async () => {
  const f = fixture({
    kxVersion: 1,
    peerInfo: {
      platform: 'Windows',
      displays: [{ width: 64, height: 48 }],
      encoding: { av1: true, vp8: false, i444: { vp9: true, av1: false } },
    },
  });
  f.session.configureVideo({
    vp9: true,
    vp8: true,
    av1: true,
    vp9_444: true,
    av1_444: true,
  });
  let run = f.connect();
  await until(() => f.states.at(-1) === 'awaitingApproval');
  await f.session.submitPassword('synthetic');
  await until(() => f.states.at(-1) === 'connected');
  expect(f.session.setCodec('av1', true)).toBe(false);
  expect(f.session.setCodec('vp8', false)).toBe(false);
  expect(f.session.setCodec('vp9', true)).toBe(true);
  const before = f.clientMessages.length;
  f.send({
    misc: { supportedEncoding: { av1: true, i444: { av1: true, vp9: false } } },
  });
  await until(() => f.messages.some((m) => !!m.misc?.supportedEncoding));
  await until(() => f.clientMessages.length > before);
  expect(
    f.clientMessages.at(-1)?.misc?.option?.supportedDecoding?.preferChroma,
  ).toBe(hbb.Chroma.I420);
  expect(f.session.setCodec('vp9', true)).toBe(false);
  expect(f.session.setCodec('av1', true)).toBe(true);
  f.send({ misc: { supportedEncoding: { av1: false, vp8: false } } });
  await until(
    () =>
      f.clientMessages.at(-1)?.misc?.option?.supportedDecoding?.prefer ===
      hbb.SupportedDecoding.PreferCodec.Auto,
  );
  expect(
    f.clientMessages.at(-1)?.misc?.option?.supportedDecoding?.preferChroma,
  ).toBe(hbb.Chroma.I420);
  expect(f.session.setCodec('av1', false)).toBe(false);
  f.session.disconnect();
  await run;
  run = f.connect();
  await until(() => f.states.at(-1) === 'awaitingApproval');
  expect(
    f.clientMessages.filter((m) => m.loginRequest).at(-1)?.loginRequest?.option
      ?.supportedDecoding?.preferChroma,
  ).toBe(hbb.Chroma.I420);
  await f.session.submitPassword('synthetic');
  await until(() => f.states.at(-1) === 'connected');
  expect(f.session.setCodec('vp9', true)).toBe(true);
  expect(f.session.setCodec('av1', true)).toBe(false);
  f.session.disconnect();
  await run;
});

test('RGBA图片经真实加密protobuf到对端，超界只拒绝本次而桌面继续可用', async () => {
  const f = await connectedFixture(1);
  const rgba = {
    format: hbb.ClipboardFormat.ImageRgba,
    width: 2,
    height: 1,
    content: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 128]),
  };
  expect(f.session.sendImage(rgba)).toBe(true);
  expect(
    f.clientMessages.at(-1)?.multiClipboards?.clipboards?.[0],
  ).toMatchObject(rgba);
  expect(
    f.session.sendImage({
      ...rgba,
      width: 2048,
      height: 1024,
      content: new Uint8Array(2048 * 1024 * 4),
    }),
  ).toBe(false);
  expect(f.states.at(-1)).toBe('connected');
  expect(
    f.session.sendInput({
      keyEvent: { chr: 97, down: true, mode: hbb.KeyboardMode.Legacy },
    }),
  ).toBe(true);
});
function credentialHooks() {
  return {
    load: jest
      .fn<() => Promise<Uint8Array<ArrayBuffer> | undefined>>()
      .mockResolvedValue(undefined),
    save: jest
      .fn<(binding: unknown, first: Uint8Array) => Promise<boolean>>()
      .mockResolvedValue(true),
    forget: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    cancel: jest.fn(),
  };
}
test('凭据慢查询和自动认证全程不发布手动表单状态，并可复用文件派生凭据', async () => {
  let complete!: (value: Uint8Array<ArrayBuffer> | undefined) => void;
  const credentials = credentialHooks();
  credentials.load.mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  const first = await cryptography.derivePasswordHash('fixture secret', 'salt');
  const f = fixture({ credentials, holdLogin: true });
  const run = f.connect();
  await until(() => credentials.load.mock.calls.length === 1);
  expect(f.states.at(-1)).toBe('checkingCredentials');
  expect(f.clientMessages.filter((m) => m.loginRequest)).toHaveLength(0);
  await f.session.submitPassword('should not replace pending lookup');
  complete(first.slice());
  await until(() =>
    f.clientMessages.some((m) => m.loginRequest?.password?.length),
  );
  expect(f.states.at(-1)).toBe('automaticAuthenticating');
  expect(f.states).not.toContain('authenticating');
  expect(f.states).not.toContain('awaitingApproval');
  f.send({
    loginResponse: {
      peerInfo: {
        platform: 'Windows',
        displays: [{ width: 800, height: 600 }],
      },
    },
  });
  await until(() => f.states.includes('connected'));
  const files = fixture({ kind: 'file', credentials, serverKey: f.serverKey });
  const fileRun = files.connect(f.session.authenticationForFiles());
  await until(() => files.states.includes('connected'));
  expect(credentials.load).toHaveBeenCalledTimes(1);
  expect(files.states).not.toContain('checkingCredentials');
  expect(files.states).not.toContain('automaticAuthenticating');
  f.session.disconnect();
  files.session.disconnect();
  await Promise.all([run, fileRun]);
});
test.each([false, true])(
  '无记忆记录或存储失败（%s）才返回手动认证',
  async (storageError) => {
    const credentials = credentialHooks();
    if (storageError)
      credentials.load.mockRejectedValue(new Error('storage unavailable'));
    const f = fixture({ credentials });
    const run = f.connect();
    await until(() => f.states.includes('awaitingApproval'));
    expect(f.states.indexOf('checkingCredentials')).toBeLessThan(
      f.states.indexOf('authenticating'),
    );
    expect(f.states).not.toContain('automaticAuthenticating');
    expect(f.errors).toEqual([]);
    await f.session.submitPassword('fixture manual password');
    await until(() => f.states.includes('connected'));
    f.session.disconnect();
    await run;
  },
);
test.each(['cancel', 'timeout'])(
  '凭据查询期间%s，迟到结果清零且不会恢复连接',
  async (action) => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'nextTick'] });
    let complete!: (value: Uint8Array<ArrayBuffer> | undefined) => void;
    const credentials = credentialHooks();
    credentials.load.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const f = fixture({ credentials });
    const run = f.connect();
    await jest.advanceTimersByTimeAsync(1);
    expect(f.states.at(-1)).toBe('checkingCredentials');
    if (action === 'cancel') f.session.disconnect();
    else await jest.advanceTimersByTimeAsync(120_000);
    const closedStates = [...f.states];
    const late = new Uint8Array(32).fill(42);
    complete(late);
    await jest.advanceTimersByTimeAsync(1);
    await run;
    expect(f.states).toEqual(closedStates);
    expect(late.every((byte) => byte === 0)).toBe(true);
    expect(f.clientMessages.filter((m) => m.loginRequest)).toHaveLength(0);
    expect(credentials.save).not.toHaveBeenCalled();
    expect(f.errors).toEqual(action === 'timeout' ? ['timeout'] : []);
  },
);
test('默认不保存，显式记住只在连接成功后保存Worker派生H1且不发明文', async () => {
  for (const remember of [false, true]) {
    const credentials = credentialHooks();
    const f = fixture({ credentials });
    const run = f.connect();
    await until(() => f.states.includes('awaitingApproval'));
    expect(credentials.save).not.toHaveBeenCalled();
    await f.session.submitPassword('fixture secret', remember);
    await until(() => f.states.includes('connected'));
    const first = await cryptography.derivePasswordHash(
      'fixture secret',
      'salt',
    );
    if (remember) {
      expect(credentials.save).toHaveBeenCalledWith(
        expect.objectContaining({ targetId: '123456789', salt: 'salt' }),
        first,
      );
    } else expect(credentials.save).not.toHaveBeenCalled();
    expect(
      f.clientMessages.filter((m) => m.loginRequest?.password?.length).at(-1)
        ?.loginRequest?.password,
    ).toEqual(await cryptography.challengeFromHash(first, 'challenge'));
    f.session.disconnect();
    await run;
  }
});
test('记忆H1只回答新挑战；密码错误清失效记录并允许手动恢复', async () => {
  const first = await cryptography.derivePasswordHash('fixture secret', 'salt');
  for (const wrongPassword of [false, true]) {
    const credentials = credentialHooks();
    credentials.load.mockResolvedValue(first.slice());
    const f = fixture({
      credentials,
      wrongPassword,
      challenge: 'fresh challenge',
    });
    const run = f.connect();
    await until(() =>
      wrongPassword
        ? f.errors.includes('password')
        : f.states.includes('connected'),
    );
    expect(
      f.clientMessages.find((m) => m.loginRequest?.password?.length)
        ?.loginRequest?.password,
    ).toEqual(await cryptography.challengeFromHash(first, 'fresh challenge'));
    expect(credentials.load).toHaveBeenCalledTimes(1);
    expect(credentials.save).not.toHaveBeenCalled();
    if (wrongPassword) {
      expect(credentials.forget).toHaveBeenCalledTimes(1);
      expect(f.states.at(-1)).toBe('authenticating');
    }
    f.session.disconnect();
    await run;
  }
});
test('仅远端批准或忘记之后不能保存此前认证候选', async () => {
  const credentials = credentialHooks();
  const f = fixture({ credentials, clickOnly: true });
  const run = f.connect();
  await until(() => f.states.includes('awaitingApproval'));
  await f.session.submitPassword('fixture secret', true);
  await until(
    () => f.clientMessages.filter((m) => m.loginRequest).length === 2,
  );
  await new Promise((resolve) => setTimeout(resolve, 5));
  f.send({
    loginResponse: {
      peerInfo: {
        platform: 'Windows',
        version: '1.4.9',
        displays: [{ width: 800, height: 600 }],
      },
    },
  });
  await until(() => f.states.includes('connected'));
  expect(credentials.save).not.toHaveBeenCalled();
  f.session.forgetPassword();
  expect(credentials.forget).toHaveBeenCalledTimes(1);
  f.session.disconnect();
  await run;
});
