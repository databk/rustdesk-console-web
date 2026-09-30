/** @jest-environment node */
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';

type SessionEvents = import('../core/session').SessionEvents;

let mockEvents: SessionEvents;
let mockOutput: (frame: VideoFrame) => void;
const mockPost = jest.fn<
  (
    message: {
      type: string;
      generation?: number;
      [key: string]: unknown;
    },
    options?: { transfer: Transferable[] },
  ) => void
>();
const mockConnect = jest.fn();
const mockPassword = jest.fn();
const mockInput = jest.fn();
const mockClipboard = jest.fn();
const mockSendImage = jest.fn();
const mockImage = jest.fn<(value: unknown) => Promise<Uint8Array>>();
jest.mock('../clipboard/image', () => ({
  clipboardPng: (value: unknown) => mockImage(value),
}));
const mockReady = jest.fn<() => Promise<void>>();
const mockSupported = jest.fn<() => Promise<boolean>>();
const mockDecode = jest.fn();
const mockDispose = jest.fn();

jest.mock('../core/crypto', () => ({ cryptoReady: () => mockReady() }));
jest.mock('../core/session', () => ({
  RemoteSession: class {
    constructor(events: SessionEvents) {
      mockEvents = events;
    }
    connect(...args: unknown[]) {
      mockConnect(...args);
      mockEvents.state('connecting');
    }
    submitPassword = mockPassword;
    sendInput = mockInput;
    sendClipboard = mockClipboard;
    sendImage = mockSendImage;
    async flushClipboard() {}
    acknowledgeVideo() {}
    refreshVideo() {}
    setAudio() {
      return true;
    }
    selectDisplay() {
      return true;
    }
    disconnect() {
      mockEvents.state('closed');
    }
  },
}));
jest.mock('../media/vp9-decoder', () => ({
  Vp9Decoder: class {
    static supported() {
      return mockSupported();
    }
    constructor(output: (frame: VideoFrame) => void) {
      mockOutput = output;
    }
    decode = mockDecode;
    dispose = mockDispose;
  },
}));

const savedPost = globalThis.postMessage;
const savedMessage = globalThis.onmessage;
beforeEach(() => {
  jest.clearAllMocks();
  mockReady.mockResolvedValue(undefined);
  mockSupported.mockResolvedValue(true);
  Object.assign(globalThis, { postMessage: mockPost, isSecureContext: true });
});
afterEach(() => {
  Object.assign(globalThis, {
    postMessage: savedPost,
    onmessage: savedMessage,
  });
});
async function boot() {
  jest.isolateModules(() => {
    require('./session.worker');
  });
  await new Promise((resolve) => setImmediate(resolve));
}
function send(message: object) {
  const handler = globalThis.onmessage as
    | ((event: MessageEvent) => void)
    | null;
  handler?.({ data: message } as MessageEvent);
}
function connect(generation: number) {
  send({ type: 'connect', generation, id: '123456789', profile: {} });
}
function frame() {
  return { close: jest.fn() } as unknown as VideoFrame;
}

test('events carry the current session and obsolete commands cannot act on a newer connection', async () => {
  await boot();
  connect(2);
  expect(mockPost).toHaveBeenCalledWith({
    type: 'state',
    state: 'connecting',
    generation: 2,
  });
  send({ type: 'password', generation: 1, password: 'obsolete' });
  send({ type: 'input', generation: 1, input: { keyEvent: { chr: 97 } } });
  send({ type: 'disconnect', generation: 1 });
  connect(1);
  expect(mockConnect).toHaveBeenCalledTimes(1);
  expect(mockPassword).not.toHaveBeenCalled();
  expect(mockInput).not.toHaveBeenCalled();
  send({ type: 'password', generation: 2, password: 'current' });
  expect(mockPassword).toHaveBeenCalledWith('current');
  send({ type: 'disconnect', generation: 3 });
  expect(mockPost).toHaveBeenCalledWith({
    type: 'state',
    state: 'closed',
    generation: 3,
  });
});

test('old render acknowledgements do not release frames belonging to a new session', async () => {
  await boot();
  connect(1);
  mockEvents.message({
    videoFrame: { display: 0, vp9s: { frames: [] } },
  } as Parameters<SessionEvents['message']>[0]);
  mockOutput(frame());
  send({ type: 'disconnect', generation: 2 });
  connect(3);
  mockEvents.message({
    videoFrame: { display: 0, vp9s: { frames: [] } },
  } as Parameters<SessionEvents['message']>[0]);
  mockOutput(frame());
  const pending = frame();
  mockOutput(pending);
  const count = mockPost.mock.calls.filter(([m]) => m.type === 'frame').length;
  send({ type: 'rendered', displayGeneration: 0, generation: 1 });
  expect(mockPost.mock.calls.filter(([m]) => m.type === 'frame')).toHaveLength(
    count,
  );
  send({ type: 'rendered', displayGeneration: 0, generation: 3 });
  expect(mockPost.mock.calls.filter(([m]) => m.type === 'frame')).toHaveLength(
    count + 1,
  );
  expect(mockPost.mock.calls.at(-1)?.[0].generation).toBe(3);
});

test('shutdown acknowledges closed session and decoder, then ignores further commands', async () => {
  await boot();
  connect(1);
  mockEvents.message({
    videoFrame: { display: 0, vp9s: { frames: [] } },
  } as Parameters<SessionEvents['message']>[0]);
  mockOutput(frame());
  const pending = frame();
  mockOutput(pending);
  send({ type: 'shutdown', generation: 2 });
  expect(mockDispose).toHaveBeenCalledTimes(1);
  expect(pending.close).toHaveBeenCalledTimes(1);
  expect(
    mockPost.mock.calls
      .filter(([m]) => m.type !== 'audio-reset')
      .slice(-2)
      .map(([message]) => message),
  ).toEqual([
    { type: 'state', state: 'closed', generation: 2 },
    { type: 'shutdown-complete', generation: 2 },
  ]);
  connect(3);
  send({ type: 'input', generation: 2, input: { keyEvent: { chr: 97 } } });
  expect(mockConnect).toHaveBeenCalledTimes(1);
  expect(mockInput).not.toHaveBeenCalled();
});

test('text input shares the UTF-8 byte bound and revoked clipboard data is discarded', async () => {
  await boot();
  connect(1);
  send({ type: 'text', generation: 1, text: '中'.repeat(400000) });
  expect(mockInput).not.toHaveBeenCalled();
  expect(mockPost).toHaveBeenCalledWith({
    type: 'warning',
    code: 'clipboard',
    generation: 1,
  });
  mockEvents.permissions({
    keyboard: true,
    clipboard: false,
    audio: true,
    file: true,
  });
  mockEvents.message({
    clipboard: { content: new TextEncoder().encode('private'), format: 0 },
  } as Parameters<SessionEvents['message']>[0]);
  expect(mockPost.mock.calls.some(([m]) => m.type === 'clipboard')).toBe(false);
});

test('failed cryptographic initialization reports unsupported readiness instead of hanging', async () => {
  mockReady.mockRejectedValue(new Error('Initialization failed'));
  await boot();
  expect(mockPost).toHaveBeenCalledWith({
    type: 'ready',
    secureContext: true,
    videoDecoder: false,
    generation: 0,
  });
});

test('verified session security events carry generation without publishing peer identity or secrets', async () => {
  await boot();
  connect(2);
  mockEvents.security(0);
  expect(mockPost).toHaveBeenLastCalledWith({
    type: 'security',
    kxVersion: 0,
    generation: 2,
  });
  mockEvents.security(undefined);
  expect(mockPost).toHaveBeenLastCalledWith({
    type: 'security',
    kxVersion: undefined,
    generation: 2,
  });
  connect(3);
  mockEvents.security(1);
  expect(mockPost).toHaveBeenLastCalledWith({
    type: 'security',
    kxVersion: 1,
    generation: 3,
  });
});

test('多屏切换丢弃旧屏包、旧解码回调和旧绘制 ACK', async () => {
  await boot();
  connect(1);
  const message = (value: object) =>
    mockEvents.message(value as Parameters<SessionEvents['message']>[0]);
  message({
    loginResponse: {
      peerInfo: {
        displays: [
          { width: 800, height: 600 },
          { x: -1024, width: 1024, height: 768 },
        ],
      },
    },
  });
  message({ videoFrame: { display: 0, vp9s: { frames: [] } } });
  const oldOutput = mockOutput;
  send({ type: 'select-display', index: 1, generation: 1 });
  const oldFrame = frame();
  oldOutput(oldFrame);
  expect(oldFrame.close).toHaveBeenCalled();
  const n = mockDecode.mock.calls.length;
  message({ videoFrame: { display: 0, vp9s: { frames: [] } } });
  message({ videoFrame: { display: 1, vp9s: { frames: [] } } });
  expect(mockDecode).toHaveBeenCalledTimes(n);
  message({
    misc: { switchDisplay: { display: 1, x: -1024, width: 1024, height: 768 } },
  });
  message({ videoFrame: { display: 1, vp9s: { frames: [] } } });
  mockOutput(frame());
  mockOutput(frame());
  const count = mockPost.mock.calls.filter(([m]) => m.type === 'frame').length;
  send({ type: 'rendered', generation: 1, displayGeneration: 0 });
  expect(mockPost.mock.calls.filter(([m]) => m.type === 'frame')).toHaveLength(
    count,
  );
  send({ type: 'rendered', generation: 1, displayGeneration: 2 });
  expect(mockPost.mock.calls.filter(([m]) => m.type === 'frame')).toHaveLength(
    count + 1,
  );
  send({ type: 'disconnect', generation: 2 });
});

test('图片转换期间撤权或更换会话，不发布迟到图片', async () => {
  await boot();
  connect(1);
  let resolve: (value: Uint8Array) => void = () => {};
  mockImage.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  mockEvents.message({
    multiClipboards: {
      clipboards: [{ format: 22, content: new Uint8Array([1]) }],
    },
  } as Parameters<SessionEvents['message']>[0]);
  mockEvents.permissions({
    keyboard: true,
    clipboard: false,
    audio: true,
    file: true,
  });
  resolve(new Uint8Array([1, 2]));
  await new Promise((done) => setImmediate(done));
  expect(
    mockPost.mock.calls.some(([message]) => message.type === 'image'),
  ).toBe(false);
  send({ type: 'disconnect', generation: 2 });
});

test('同屏 PeerInfo 热更新无需等待原生重复 SwitchDisplay 就能恢复首帧', async () => {
  await boot();
  connect(1);
  const message = (value: object) =>
    mockEvents.message(value as Parameters<SessionEvents['message']>[0]);
  const peer = { currentDisplay: 0, displays: [{ width: 800, height: 600 }] };
  message({ loginResponse: { peerInfo: peer } });
  message({ peerInfo: peer });
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'display',
      displayGeneration: 1,
      display: { display: 0, width: 800, height: 600 },
    }),
  );
  message({ videoFrame: { display: 0, vp9s: { frames: [] } } });
  expect(mockDecode).toHaveBeenCalledTimes(1);
  mockOutput(frame());
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'frame',
      displayGeneration: 1,
    }),
    expect.anything(),
  );
  send({
    type: 'input',
    generation: 1,
    displayGeneration: 1,
    input: { keyEvent: { chr: 97, down: true } },
  });
  expect(mockInput).toHaveBeenCalledTimes(1);
  send({ type: 'disconnect', generation: 2 });
});

test('直接粘贴需要有效画面及剪贴板和键盘权限，切屏或新输入会取消排队快捷键', async () => {
  await boot();
  jest.useFakeTimers();
  try {
    mockClipboard.mockReturnValue(true);
    mockInput.mockReturnValue(true);
    connect(1);
    const paste = () =>
      send({
        type: 'paste',
        generation: 1,
        displayGeneration: 0,
        content: { text: 'clipboard' },
      });
    paste();
    expect(mockClipboard).not.toHaveBeenCalled();
    mockEvents.state('connected');
    mockEvents.message({
      loginResponse: {
        peerInfo: {
          platform: 'Mac OS',
          currentDisplay: 0,
          displays: [
            { width: 800, height: 600 },
            { width: 800, height: 600 },
          ],
        },
      },
    });
    mockEvents.message({ videoFrame: { display: 0, vp9s: { frames: [] } } });
    mockOutput(frame());
    paste();
    expect(mockClipboard).toHaveBeenCalledTimes(1);
    send({
      type: 'input',
      generation: 1,
      displayGeneration: 0,
      input: { mouseEvent: { mask: 9 } },
    });
    jest.runOnlyPendingTimers();
    expect(mockInput).toHaveBeenCalledTimes(1);
    mockEvents.permissions({
      keyboard: true,
      clipboard: false,
      audio: true,
      file: true,
    });
    paste();
    expect(mockClipboard).toHaveBeenCalledTimes(1);
    mockEvents.permissions({
      keyboard: true,
      clipboard: true,
      audio: true,
      file: true,
    });
    paste();
    send({ type: 'select-display', generation: 1, index: 1 });
    jest.runOnlyPendingTimers();
    expect(mockInput).toHaveBeenCalledTimes(1);
  } finally {
    jest.useRealTimers();
  }
});
