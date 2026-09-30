/** @jest-environment node */
import { afterEach, beforeAll, expect, jest, test } from '@jest/globals';
import { BinaryTransport, TRANSPORT_LIMITS } from './transport';
import { cryptoReady, SessionCipher } from './crypto';
beforeAll(cryptoReady);

class Socket {
  binaryType = '';
  readyState = 0;
  bufferedAmount = 0;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  sent: ArrayBuffer[] = [];
  send(data: ArrayBuffer) {
    this.sent.push(data);
  }
  close() {
    this.readyState = 3;
  }
  opened() {
    this.readyState = 1;
    this.onopen?.();
  }
  receive(data: unknown) {
    this.onmessage?.({ data });
  }
}

afterEach(() => {
  jest.useRealTimers();
});
function create() {
  const socket = new Socket();
  const transport = new BinaryTransport(() => socket as unknown as WebSocket);
  return { socket, transport };
}

test('preserves queued packet order and settles pending reads on close', async () => {
  const { socket, transport } = create();
  const open = transport.open('wss://example.test');
  socket.opened();
  await open;
  socket.receive(new Uint8Array([1]).buffer);
  socket.receive(new Uint8Array([2]).buffer);
  expect(await transport.receive()).toEqual(new Uint8Array([1]));
  expect(await transport.receive()).toEqual(new Uint8Array([2]));
  const pending = expect(transport.receive()).rejects.toThrow('cancelled');
  transport.close();
  transport.close();
  await pending;
  expect(socket.onmessage).toBeNull();
  expect(socket.readyState).toBe(3);
  await expect(transport.receive()).rejects.toThrow('cancelled');
});

test('cancellation rejects opening immediately and clears its timeout', async () => {
  jest.useFakeTimers();
  const { transport } = create();
  const pending = expect(transport.open('wss://example.test')).rejects.toThrow(
    'cancelled',
  );
  transport.close();
  await pending;
  expect(jest.getTimerCount()).toBe(0);
});

test('opening timeout closes the socket', async () => {
  jest.useFakeTimers();
  const { socket, transport } = create();
  const pending = expect(
    transport.open('wss://example.test', 20),
  ).rejects.toThrow('timeout');
  jest.advanceTimersByTime(20);
  await pending;
  expect(socket.readyState).toBe(3);
  expect(jest.getTimerCount()).toBe(0);
});

test('queue flood terminates the session instead of retaining unlimited frames', async () => {
  const { socket, transport } = create();
  const open = transport.open('wss://example.test');
  socket.opened();
  await open;
  for (let i = 0; i <= TRANSPORT_LIMITS.queueCount; i++)
    socket.receive(new Uint8Array([1]).buffer);
  await expect(transport.receive()).rejects.toThrow('overload');
  expect(socket.readyState).toBe(3);
});

test('rejects nonbinary messages and excessive outgoing backpressure', async () => {
  const { socket, transport } = create();
  const open = transport.open('wss://example.test');
  socket.opened();
  await open;
  const pending = expect(transport.receive()).rejects.toThrow('protocol');
  socket.receive('not binary');
  await pending;
  const second = create();
  const opened = second.transport.open('wss://example.test');
  second.socket.opened();
  await opened;
  second.socket.bufferedAmount = TRANSPORT_LIMITS.queueBytes + 1;
  expect(() => second.transport.send(new Uint8Array([1]))).toThrow('overload');
  expect(second.socket.sent).toHaveLength(0);
});

test('pooled buffer views send only their visible bytes', async () => {
  const { socket, transport } = create();
  const opened = transport.open('wss://example.test');
  socket.opened();
  await opened;
  const pooled = Buffer.from([99, 10, 20, 88]);
  transport.send(pooled.subarray(1, 3));
  expect(new Uint8Array(socket.sent[0])).toEqual(new Uint8Array([10, 20]));
  transport.close();
});

test('outgoing limit includes the new packet before queuing it', async () => {
  const { socket, transport } = create();
  const opened = transport.open('wss://example.test');
  socket.opened();
  await opened;
  socket.bufferedAmount = TRANSPORT_LIMITS.queueBytes - 1;
  expect(() => transport.send(new Uint8Array(2))).toThrow('overload');
  expect(socket.sent).toHaveLength(0);
  expect(socket.readyState).toBe(3);
});

test('encrypted packet bounds include the authentication tag', async () => {
  const { socket, transport } = create();
  const opened = transport.open('wss://example.test');
  socket.opened();
  await opened;
  const cipher = new SessionCipher(new Uint8Array(32));
  transport.secure(cipher);
  expect(() => transport.send(new Uint8Array(TRANSPORT_LIMITS.packet))).toThrow(
    'overload',
  );
  expect(socket.sent).toHaveLength(0);
  expect(() => cipher.encrypt(new Uint8Array())).toThrow('encryption');
});

test('剪贴板可等待全部本地发送缓冲清空，而非仅下降到文件低水位', async () => {
  jest.useFakeTimers();
  const { socket, transport } = create();
  const open = transport.open('wss://example.test');
  socket.opened();
  await open;
  socket.bufferedAmount = 1024;
  let finished = false;
  const draining = transport.drain(0).then(() => {
    finished = true;
  });
  await jest.advanceTimersByTimeAsync(20);
  expect(finished).toBe(false);
  socket.bufferedAmount = 0;
  await jest.advanceTimersByTimeAsync(10);
  await draining;
  expect(finished).toBe(true);
  transport.close();
});

test('文件背压等待发送缓冲下降，断开立即使后续发送失效', async () => {
  jest.useFakeTimers();
  const { socket, transport } = create();
  const open = transport.open('wss://example.test');
  socket.opened();
  await open;
  socket.bufferedAmount = 2 * 1024 * 1024;
  let finished = false;
  const draining = transport.drain().then(() => {
    finished = true;
  });
  await jest.advanceTimersByTimeAsync(20);
  expect(finished).toBe(false);
  socket.bufferedAmount = 0;
  await jest.advanceTimersByTimeAsync(10);
  await draining;
  expect(finished).toBe(true);
  socket.bufferedAmount = 2 * 1024 * 1024;
  const rejected = expect(transport.drain()).rejects.toThrow('cancelled');
  transport.close();
  await jest.advanceTimersByTimeAsync(10);
  await rejected;
  expect(jest.getTimerCount()).toBe(0);
});
