/** @jest-environment node */
import { expect, jest, test } from '@jest/globals';
import { gatewaySocketFactory, type WebClientGrant } from './gateway';
import { BinaryTransport } from './transport';
const profile = {
  idServerUrl: 'wss://fixed.test/id',
  relayServerUrl: 'wss://fixed.test/relay',
  serverPublicKey: '',
};
const grant = (): WebClientGrant => ({
  sessionGuid: 'session',
  gatewayPath: '/api/web-client/socket',
  tickets: { rendezvous: 'id-ticket', relay: 'relay-ticket' },
  expiresAt: new Date(Date.now() + 60000).toISOString(),
});
class Socket {
  readyState = 0;
  bufferedAmount = 0;
  binaryType = 'arraybuffer';
  onopen?: () => void;
  onmessage?: (event: MessageEvent) => void;
  onclose?: (event: CloseEvent) => void;
  onerror?: () => void;
  send = jest.fn();
  close = jest.fn(() => {
    this.readyState = 3;
  });
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  message(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
}
test('同源入口首帧 ticket，不含URL/JWT；ready 前不开始原生握手，二进制原样转发', async () => {
  const socket = new Socket(),
    create = jest.fn((url: string) => {
      void url;
      return socket as unknown as WebSocket;
    });
  const transport = new BinaryTransport(
    gatewaySocketFactory(grant(), profile, 'https://console.test', create),
  );
  const opening = transport.open(profile.idServerUrl);
  socket.open();
  expect(create.mock.calls[0]?.[0]).toBe(
    'wss://console.test/api/web-client/socket',
  );
  expect(socket.send).toHaveBeenCalledWith('{"ticket":"id-ticket"}');
  expect(() => transport.send(new Uint8Array([1]))).toThrow();
  // 使用独立 transport 测正常路径，提前 send 不进入底层网络。
  transport.close();
  await expect(opening).rejects.toMatchObject({ code: 'cancelled' });
  const next = new Socket();
  const binary = new BinaryTransport(
    gatewaySocketFactory(
      grant(),
      profile,
      'https://console.test',
      () => next as unknown as WebSocket,
    ),
  );
  const ready = binary.open(profile.idServerUrl);
  next.open();
  next.message('{"ready":true}');
  await ready;
  next.message(new Uint8Array([8, 9]).buffer);
  expect(await binary.receive()).toEqual(new Uint8Array([8, 9]));
  binary.send(new Uint8Array([5]));
  expect(
    new Uint8Array(next.send.mock.calls.at(-1)?.[0] as ArrayBuffer),
  ).toEqual(new Uint8Array([5]));
  binary.close();
});
test('ticket单次使用、固定上游与截止日期均不能绕过', () => {
  const factory = gatewaySocketFactory(
    grant(),
    profile,
    'https://console.test',
    () => new Socket() as unknown as WebSocket,
  );
  factory(profile.idServerUrl);
  expect(() => factory(profile.idServerUrl)).toThrow();
  expect(() => factory('wss://attacker.test')).toThrow();
  const expired = grant();
  expired.expiresAt = new Date(0).toISOString();
  expect(() =>
    gatewaySocketFactory(
      expired,
      profile,
      'https://console.test',
    )(profile.relayServerUrl),
  ).toThrow();
  expired.expiresAt = 'invalid';
  expect(() =>
    gatewaySocketFactory(
      expired,
      profile,
      'https://console.test',
    )(profile.relayServerUrl),
  ).toThrow();
  expect(() =>
    gatewaySocketFactory(grant(), profile, 'https://user:secret@console.test'),
  ).toThrow();
});
test('已消费的ticket通过transport再次打开时保留授权错误', async () => {
  const factory = gatewaySocketFactory(
    grant(),
    profile,
    'https://console.test',
    () => new Socket() as unknown as WebSocket,
  );
  const socket = factory(profile.idServerUrl);
  socket.close();
  await expect(
    new BinaryTransport(factory).open(profile.idServerUrl),
  ).rejects.toMatchObject({ code: 'authorization' });
});
test('取消后迟到ready不可打开；撤权与登录失效有独立安全错误', async () => {
  for (const [code, expected] of [
    [4401, 'sessionExpired'],
    [4403, 'authorization'],
  ] as const) {
    const socket = new Socket();
    const transport = new BinaryTransport(
      gatewaySocketFactory(
        grant(),
        profile,
        'https://console.test',
        () => socket as unknown as WebSocket,
      ),
    );
    const opening = transport.open(profile.idServerUrl);
    socket.open();
    socket.onclose?.({ code } as CloseEvent);
    await expect(opening).rejects.toMatchObject({ code: expected });
    expect(socket.onmessage).toBeNull();
  }
  const socket = new Socket();
  const wrapper = gatewaySocketFactory(
    grant(),
    profile,
    'https://console.test',
    () => socket as unknown as WebSocket,
  )(profile.idServerUrl);
  const open = jest.fn();
  wrapper.onopen = open;
  wrapper.close();
  socket.message('{"ready":true}');
  expect(open).not.toHaveBeenCalled();
});
test('错误认证回复与二次文本帧拒绝，不交给protobuf', async () => {
  const socket = new Socket();
  const transport = new BinaryTransport(
    gatewaySocketFactory(
      grant(),
      profile,
      'https://console.test',
      () => socket as unknown as WebSocket,
    ),
  );
  const opening = transport.open(profile.idServerUrl);
  socket.open();
  socket.message('{"ready":false}');
  await expect(opening).rejects.toMatchObject({ code: 'authorization' });
});
