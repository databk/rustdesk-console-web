/** @jest-environment node */
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';

type SessionEvents = import('../core/session').SessionEvents;
type VideoDiagnostic = import('../media/vp9-decoder').VideoDiagnostic;

let mockEvents: SessionEvents;
let mockOutput: (frame: VideoFrame) => void;
let mockDecoderError: (diagnostic?: VideoDiagnostic) => void;
let mockDecoderAck: () => void;
let mockSaturation: (diagnostic?: VideoDiagnostic) => void;
let mockAv1ColorSupported = true;
let mockRealVideoDecoder = false;
const mockPost =
  jest.fn<
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
const mockSessionMode =
  jest.fn<
    (
      kind: 'desktop' | 'file' | undefined,
      flow: import('../core/session').VideoFlowMode | undefined,
    ) => void
  >();
const mockPassword = jest.fn();
const mockForgetPassword = jest.fn();
const mockInput = jest.fn();
const mockClipboard = jest.fn();
const mockSendImage = jest.fn();
const mockSetClipboardEnabled = jest.fn<(enabled: boolean) => boolean>();
const mockFlushClipboard = jest.fn<() => Promise<void>>();
const mockImage = jest.fn<(value: unknown) => Promise<Uint8Array>>();
jest.mock('../clipboard/image', () => ({
  ImagePacketLimitError:
    jest.requireActual<typeof import('../clipboard/image')>(
      '../clipboard/image',
    ).ImagePacketLimitError,
  clipboardPng: (value: unknown) => mockImage(value),
  pngClipboard: async (value: unknown) => ({
    format: 1,
    content: await mockImage(value),
    width: 1,
    height: 1,
  }),
}));
const mockReady = jest.fn<() => Promise<void>>();
const mockSupported = jest.fn<() => Promise<boolean>>();
const mockDecode = jest.fn();
const mockDispose = jest.fn();
const mockConfigs = jest.fn<(config?: VideoDecoderConfig) => void>();
const mockSetCodec = jest.fn();
const mockChangeResolution = jest.fn<(...args: number[]) => boolean>();
const mockAck = jest.fn();
const mockRefresh = jest.fn();
const mockVoiceEncode = jest.fn();
const mockVoiceDispose = jest.fn();
const mockVoiceStart = jest.fn<() => Promise<boolean>>();
const mockVoiceSupported = jest.fn<() => Promise<boolean>>();
jest.mock('../media/voice', () => ({
  VOICE_LIMITS: { timeoutMs: 30000 },
  VoiceEncoder: class {
    static supported = mockVoiceSupported;
    start = mockVoiceStart;
    encode = mockVoiceEncode;
    dispose = mockVoiceDispose;
  },
}));
jest.mock('../media/video-codecs', () => ({
  ...jest.requireActual<object>('../media/video-codecs'),
  videoCapabilities: async () => {
    const supported = await mockSupported();
    return {
      vp9: supported,
      vp8: supported,
      av1: supported,
      vp9_444: supported,
      av1_444: supported && mockAv1ColorSupported,
    };
  },
}));

jest.mock('../core/crypto', () => ({ cryptoReady: () => mockReady() }));
jest.mock('../core/session', () => ({
  RemoteSession: class {
    constructor(
      events: SessionEvents,
      _factory?: unknown,
      kind?: 'desktop' | 'file',
      _credentials?: unknown,
      videoFlow?: import('../core/session').VideoFlowMode,
    ) {
      mockEvents = events;
      mockSessionMode(kind, videoFlow);
    }
    connect(...args: unknown[]) {
      mockConnect(...args);
      mockEvents.state('connecting');
    }
    authenticationForFiles() {
      return undefined;
    }
    qualityMetrics() {
      return {
        received: 12,
        videoBytes: 1200,
        delay: 42,
        targetBitrateKbps: 2010,
        testDelayReceived: 3,
        testDelayReplied: 3,
        lastProbeAgeMs: 15,
        transport: {
          queuedPackets: 1,
          queuedBytes: 42,
          maxQueuedPackets: 2,
          maxQueuedBytes: 64,
          oldestQueuedMs: 3,
          maxDequeuedWaitMs: 5,
          sendBufferedBytes: 0,
        },
      };
    }
    resetVideoCounters() {}
    configureVideo() {}
    setCodec(...args: unknown[]) {
      mockSetCodec(...args);
      return true;
    }
    setRecording() {
      return true;
    }
    closeVoiceCall() {}
    startVoiceCall() {
      return true;
    }
    sendVoiceFormat() {
      return true;
    }
    async sendVoiceAudio() {
      return true;
    }
    sendChat() {
      return true;
    }
    setClipboardEnabled = mockSetClipboardEnabled;
    setReadOnly() {
      return true;
    }
    setViewOptions() {
      return true;
    }
    changeResolution = mockChangeResolution;
    submitPassword = mockPassword;
    forgetPassword = mockForgetPassword;
    sendInput = mockInput;
    sendClipboard = mockClipboard;
    sendImage = mockSendImage;
    flushClipboard = mockFlushClipboard;
    acknowledgeVideo = mockAck;
    refreshVideo = mockRefresh;
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
  ...jest.requireActual<object>('../media/vp9-decoder'),
  Vp9Decoder: mockRealVideoDecoder
    ? jest.requireActual<typeof import('../media/vp9-decoder')>(
        '../media/vp9-decoder',
      ).Vp9Decoder
    : class {
        static supported() {
          return mockSupported();
        }
        constructor(
          output: (frame: VideoFrame) => void,
          ack: () => void,
          error: (diagnostic: VideoDiagnostic) => void,
          config?: VideoDecoderConfig,
          saturated?: (diagnostic: VideoDiagnostic) => void,
        ) {
          mockOutput = output;
          mockDecoderAck = ack;
          const { videoFailureDiagnostic } = jest.requireActual<
            typeof import('../media/vp9-decoder')
          >('../media/vp9-decoder');
          mockDecoderError = (
            diagnostic = videoFailureDiagnostic('decoder-error'),
          ) => error(diagnostic);
          mockConfigs(config);
          mockSaturation = (
            diagnostic = videoFailureDiagnostic('pending-batch-limit'),
          ) => saturated?.(diagnostic);
        }
        decode = mockDecode;
        dispose = mockDispose;
        metrics() {
          return {
            decodeQueue: 1,
            pendingBatches: 1,
            decodeLatencyMs: 2,
            ackLatencyMs: 3,
          };
        }
      },
}));

const savedPost = globalThis.postMessage;
const savedMessage = globalThis.onmessage;
beforeEach(() => {
  jest.clearAllMocks();
  mockAv1ColorSupported = true;
  mockRealVideoDecoder = false;
  mockReady.mockResolvedValue(undefined);
  mockSupported.mockResolvedValue(true);
  mockVoiceStart.mockResolvedValue(true);
  mockVoiceSupported.mockResolvedValue(true);
  mockSetClipboardEnabled.mockReturnValue(true);
  mockChangeResolution.mockReturnValue(true);
  mockFlushClipboard.mockResolvedValue(undefined);
  Object.assign(globalThis, { postMessage: mockPost, isSecureContext: true });
});
afterEach(() => {
  if (globalThis.onmessage !== savedMessage) {
    // 隔离模块仍拥有录制消费/通话计时器，结束测试前按真实命令释放归属资源。
    const chunk = mockPost.mock.calls
      .map(([message]) => message)
      .findLast((message) => message.type === 'record-chunk');
    if (chunk)
      send({
        type: 'record-consumed',
        generation: chunk.generation,
        recordingGeneration: chunk.recordingGeneration,
        sequence: chunk.sequence,
        ok: false,
      });
    send({ type: 'shutdown', generation: Number.MAX_SAFE_INTEGER });
  }
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
  const value = message as { type?: string };
  if (value.type === 'connect' || value.type === 'files-connect')
    message = {
      origin: 'https://console.test',
      grant: {
        sessionGuid: 'grant',
        gatewayPath: '/api/web-client/socket',
        tickets: { rendezvous: 'r', relay: 'l' },
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      },
      ...message,
    };
  const handler = globalThis.onmessage as
    | ((event: MessageEvent) => void)
    | null;
  handler?.({ data: message } as MessageEvent);
}
function connect(generation: number) {
  send({ type: 'connect', generation, id: '123456789', profile: {} });
}

test('正式候选桌面Worker显式选择bounded-stream，ACK早退共用核心策略', async () => {
  await boot();
  expect(mockSessionMode).toHaveBeenCalledTimes(1);
  expect(mockSessionMode).toHaveBeenCalledWith('desktop', 'bounded-stream');
  connect(1);
  mockEvents.state('connected');
  mediaPeer();
  mockEvents.message({
    videoFrame: {
      display: 1,
      vp8s: { frames: [{ key: true, pts: 0, data: new Uint8Array([1]) }] },
    },
  } as never);
  mockEvents.message({
    videoFrame: {
      display: 0,
      vp8s: { frames: [{ key: false, pts: 1, data: new Uint8Array([1]) }] },
    },
  } as never);
  // 两个早退仍调用核心统一门禁；真正不发包由session加密测试验证。
  expect(mockAck).toHaveBeenCalledTimes(2);
  expect(mockDecode).not.toHaveBeenCalled();
  expect(mockRefresh).toHaveBeenCalledTimes(1);
  send({ type: 'disconnect', generation: 2 });
});
test('记住和清除命令按会话代次传递，不向页面返回密码材料', async () => {
  await boot();
  send({
    type: 'connect',
    generation: 1,
    id: '123456789',
    profile: {},
    account: 'fixture-account',
  });
  send({
    type: 'password',
    generation: 1,
    password: 'fixture password',
    remember: true,
  });
  expect(mockPassword).toHaveBeenLastCalledWith('fixture password', true);
  send({ type: 'forget-password', generation: 0 });
  expect(mockForgetPassword).not.toHaveBeenCalled();
  send({ type: 'forget-password', generation: 1 });
  expect(mockForgetPassword).toHaveBeenCalledTimes(1);
  const credentialEvents = mockPost.mock.calls
    .map(([message]) => message)
    .filter((message) => message.type === 'credential-status');
  expect(credentialEvents.length).toBeGreaterThan(0);
  for (const message of credentialEvents)
    expect(Object.keys(message).sort()).toEqual([
      'generation',
      'status',
      'type',
    ]);
  send({ type: 'disconnect', generation: 2 });
});
function frame() {
  return { close: jest.fn() } as unknown as VideoFrame;
}

function taskVideoRuntime(outputDelayMs = 0) {
  const savedDecoder = globalThis.VideoDecoder;
  const savedChunk = globalThis.EncodedVideoChunk;
  const instances: TaskDecoder[] = [];
  let peakQueue = 0;
  let submitted = 0;
  class TaskDecoder {
    static async isConfigSupported() {
      return { supported: true };
    }
    state = 'configured';
    decodeQueueSize = 0;
    private chunks: EncodedVideoChunkInit[] = [];
    private timer: ReturnType<typeof setTimeout> | undefined;
    constructor(private callbacks: VideoDecoderInit) {
      instances.push(this);
    }
    configure() {}
    decode(chunk: EncodedVideoChunkInit) {
      this.chunks.push(chunk);
      ++submitted;
      this.decodeQueueSize = this.chunks.length;
      peakQueue = Math.max(peakQueue, this.decodeQueueSize);
      if (this.timer !== undefined) return;
      // WebCodecs输出在task上交付，而不是同步decode/Promise微任务。
      this.timer = setTimeout(() => {
        this.timer = undefined;
        while (this.state !== 'closed' && this.chunks.length) {
          const output = this.chunks.shift();
          this.decodeQueueSize = this.chunks.length;
          this.callbacks.output({
            timestamp: output?.timestamp,
            codedWidth: 800,
            codedHeight: 600,
            displayWidth: 800,
            displayHeight: 600,
            close: jest.fn(),
          } as unknown as VideoFrame);
        }
      }, outputDelayMs);
    }
    close() {
      this.state = 'closed';
      clearTimeout(this.timer);
      this.timer = undefined;
      this.chunks = [];
      this.decodeQueueSize = 0;
    }
  }
  Object.assign(globalThis, {
    VideoDecoder: TaskDecoder,
    EncodedVideoChunk: class {
      constructor(value: EncodedVideoChunkInit) {
        Object.assign(this, value);
      }
    },
  });
  return {
    instances,
    counts: () => ({ peakQueue, submitted }),
    restore() {
      for (const instance of instances) instance.close();
      Object.assign(globalThis, {
        VideoDecoder: savedDecoder,
        EncodedVideoChunk: savedChunk,
      });
    },
  };
}
function taskVideo(pts: number) {
  return mockEvents.message({
    videoFrame: {
      display: 0,
      vp8s: { frames: [{ pts, key: pts === 0, data: new Uint8Array([1]) }] },
    },
  } as never);
}

test('2ms异步输出尚未就绪时，仅零延时task让出仍会撞真实8批门限', async () => {
  const runtime = taskVideoRuntime(2);
  const recover = jest.fn();
  const { Vp9Decoder } = jest.requireActual<
    typeof import('../media/vp9-decoder')
  >('../media/vp9-decoder');
  jest.useFakeTimers();
  const stream = new Vp9Decoder(
    (output) => output.close(),
    jest.fn(),
    jest.fn(),
    undefined,
    recover,
  );
  try {
    const run = (async () => {
      for (let pts = 0; pts < 9; ++pts) {
        if (pts > 0 && pts % 4 === 0)
          await new Promise<void>((resolve) => setTimeout(resolve, 0));
        stream.decode({
          frames: [{ pts, key: pts === 0, data: new Uint8Array([1]) }],
        });
      }
    })();
    await jest.runAllTimersAsync();
    await run;
    expect(recover).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'pending-batch-limit',
        pendingBatches: 8,
        submittedFrames: 8,
        outputFrames: 0,
      }),
    );
    expect(runtime.counts()).toEqual({ peakQueue: 8, submitted: 8 });
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    stream.dispose();
    runtime.restore();
    jest.useRealTimers();
  }
});

test.each([0, 2])(
  '真实Vp9Decoder输出延迟%sms的连续突发保持8批上限，不因零延时让出早于输出误触恢复',
  async (outputDelayMs) => {
    const runtime = taskVideoRuntime(outputDelayMs);
    mockRealVideoDecoder = true;
    try {
      await boot();
      jest.useFakeTimers({ doNotFake: ['setImmediate'] });
      connect(1);
      mockEvents.state('connected');
      mediaPeer();
      const run = (async () => {
        for (let pts = 0; pts < 20; ++pts) await taskVideo(pts);
      })();
      await jest.runAllTimersAsync();
      await run;
      send({ type: 'metrics', generation: 1 });
      expect(runtime.instances).toHaveLength(1);
      expect(runtime.counts()).toEqual({ peakQueue: 4, submitted: 20 });
      expect(mockAck).toHaveBeenCalledTimes(20);
      expect(mockPost).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'metrics',
          decoded: 20,
          displayGeneration: 0,
          decodeQueue: 0,
          pendingBatches: 0,
          recoveryCount: 0,
        }),
      );
      expect(
        mockPost.mock.calls.some(([message]) => message.videoDiagnostic),
      ).toBe(false);
      expect(mockSetCodec).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      send({ type: 'shutdown', generation: Number.MAX_SAFE_INTEGER });
      runtime.restore();
      jest.useRealTimers();
    }
  },
);

test('输出未返回时只等待固定4ms，仍按原8批门限恢复，不等待drain或无限积累', async () => {
  const runtime = taskVideoRuntime(1000);
  mockRealVideoDecoder = true;
  try {
    await boot();
    jest.useFakeTimers({ doNotFake: ['setImmediate'] });
    connect(1);
    mockEvents.state('connected');
    mediaPeer();
    const run = (async () => {
      for (let pts = 0; pts < 9; ++pts) await taskVideo(pts);
    })();
    await jest.advanceTimersByTimeAsync(12);
    await run;
    expect(runtime.counts()).toEqual({ peakQueue: 8, submitted: 8 });
    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'display',
        displayGeneration: 1,
        videoRecovery: 'key-refresh',
        videoDiagnostic: expect.objectContaining({
          reason: 'pending-batch-limit',
          pendingBatches: 8,
          submittedFrames: 8,
          outputFrames: 0,
        }),
      }),
    );
    expect(mockSetCodec).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    send({ type: 'shutdown', generation: Number.MAX_SAFE_INTEGER });
    runtime.restore();
    jest.useRealTimers();
  }
});

test.each(['reconnect', 'display'] as const)(
  '等待让出task的旧批次在%s变更后不进入新代，取消释放唯一任务',
  async (change) => {
    const runtime = taskVideoRuntime();
    mockRealVideoDecoder = true;
    try {
      await boot();
      jest.useFakeTimers({ doNotFake: ['setImmediate'] });
      connect(1);
      mockEvents.state('connected');
      mediaPeer();
      for (let pts = 0; pts < 4; ++pts) await taskVideo(pts);
      const timersBeforeYield = jest.getTimerCount();
      const oldBatch = taskVideo(4);
      // 已有输出task和批次watchdog之外，只增加一个公平性让出task。
      expect(jest.getTimerCount()).toBe(timersBeforeYield + 1);
      if (change === 'reconnect') {
        connect(2);
        mockEvents.state('connected');
        mediaPeer();
      } else
        await mockEvents.message({
          peerInfo: {
            platform: 'Windows',
            version: '1.5.0',
            currentDisplay: 0,
            displays: [{ width: 800, height: 600 }],
          },
        } as never);
      await oldBatch;
      expect(runtime.counts().submitted).toBe(4);
      expect(runtime.instances[0].state).toBe('closed');
      expect(jest.getTimerCount()).toBe(0);
      await taskVideo(0);
      await jest.runAllTimersAsync();
      send({ type: 'metrics', generation: change === 'reconnect' ? 2 : 1 });
      expect(runtime.counts().submitted).toBe(5);
      expect(mockPost).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'metrics',
          decoded: 1,
          displayGeneration: change === 'reconnect' ? 0 : 1,
          pendingBatches: 0,
          recoveryCount: 0,
        }),
      );
      expect(
        mockPost.mock.calls.some(([message]) => message.videoDiagnostic),
      ).toBe(false);
    } finally {
      send({ type: 'shutdown', generation: Number.MAX_SAFE_INTEGER });
      runtime.restore();
      jest.useRealTimers();
    }
  },
);

function resolutionPeer() {
  mockEvents.state('connected');
  mockEvents.message({
    loginResponse: {
      peerInfo: {
        platform: 'Windows',
        version: '1.4.9',
        currentDisplay: 0,
        displays: [{ name: 'A', width: 800, height: 600 }],
        resolutions: {
          resolutions: [
            { width: 800, height: 600 },
            { width: 1024, height: 768 },
          ],
        },
      },
    },
  } as Parameters<SessionEvents['message']>[0]);
}
function resolutionGeometry() {
  mockEvents.message({
    misc: { switchDisplay: { display: 0, width: 1024, height: 768 } },
  } as Parameters<SessionEvents['message']>[0]);
}
function resolutionVideo() {
  mockEvents.message({
    videoFrame: {
      display: 0,
      vp9s: { frames: [{ key: true, pts: 1, data: new Uint8Array([1]) }] },
    },
  } as Parameters<SessionEvents['message']>[0]);
}
function requestResolution(request = 1, displayGeneration = 0) {
  send({
    type: 'change-resolution',
    generation: 1,
    request,
    display: 0,
    width: 1024,
    height: 768,
    displayGeneration,
  });
}

test('分辨率发送不能确认；真实几何后必须绘制对应新代次与目标尺寸帧', async () => {
  await boot();
  connect(1);
  resolutionPeer();
  requestResolution();
  expect(mockChangeResolution).toHaveBeenCalledWith(0, 1024, 768);
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'resolution-status',
      request: 1,
      status: 'pending',
    }),
  );
  resolutionVideo();
  mockOutput({
    ...frame(),
    displayWidth: 1024,
    displayHeight: 768,
  } as VideoFrame);
  send({ type: 'rendered', generation: 1, displayGeneration: 0, drawn: true });
  expect(mockPost).not.toHaveBeenCalledWith(
    expect.objectContaining({ status: 'confirmed' }),
  );
  resolutionGeometry();
  resolutionVideo();
  mockOutput({
    ...frame(),
    displayWidth: 800,
    displayHeight: 600,
  } as VideoFrame);
  send({ type: 'rendered', generation: 1, displayGeneration: 1, drawn: true });
  expect(mockPost).not.toHaveBeenCalledWith(
    expect.objectContaining({ status: 'confirmed' }),
  );
  mockOutput({
    ...frame(),
    displayWidth: 1024,
    displayHeight: 768,
  } as VideoFrame);
  send({ type: 'rendered', generation: 1, displayGeneration: 0, drawn: true });
  expect(mockPost).not.toHaveBeenCalledWith(
    expect.objectContaining({ status: 'confirmed' }),
  );
  send({ type: 'rendered', generation: 1, displayGeneration: 1, drawn: true });
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'resolution-status',
      request: 1,
      status: 'confirmed',
      displayGeneration: 1,
    }),
  );
  send({ type: 'disconnect', generation: 2 });
});

test('分辨率超时只报未确认，迟到几何/帧更新实态但不复活请求', async () => {
  await boot();
  connect(1);
  resolutionPeer();
  jest.useFakeTimers();
  try {
    requestResolution();
    requestResolution(2);
    expect(mockChangeResolution).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(15000);
    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({ request: 1, status: 'unconfirmed' }),
    );
    resolutionGeometry();
    resolutionVideo();
    mockOutput({
      ...frame(),
      displayWidth: 1024,
      displayHeight: 768,
    } as VideoFrame);
    send({
      type: 'rendered',
      generation: 1,
      displayGeneration: 1,
      drawn: true,
    });
    expect(mockPost).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: 'confirmed' }),
    );
    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'display', displayGeneration: 1 }),
    );
    requestResolution(3, 0);
    expect(mockChangeResolution).toHaveBeenCalledTimes(1);
    requestResolution(4, 1);
    expect(mockChangeResolution).toHaveBeenCalledTimes(2);
    send({ type: 'read-only', generation: 1, enabled: true });
    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({ request: 4, status: 'cancelled' }),
    );
    requestResolution(5, 1);
    expect(mockChangeResolution).toHaveBeenCalledTimes(2);
    send({ type: 'disconnect', generation: 2 });
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    jest.useRealTimers();
  }
});

test('目标几何后的普通ACK和旧codec回调不能确认，新代次实际绘制才确认', async () => {
  await boot();
  connect(1);
  resolutionPeer();
  requestResolution();
  resolutionGeometry();
  resolutionVideo();
  const obsoleteOutput = mockOutput;
  mockOutput({
    ...frame(),
    displayWidth: 1024,
    displayHeight: 768,
  } as VideoFrame);
  send({ type: 'rendered', generation: 1, displayGeneration: 1 });
  expect(mockPost).not.toHaveBeenCalledWith(
    expect.objectContaining({ status: 'confirmed' }),
  );
  mockEvents.message({
    videoFrame: {
      display: 0,
      vp8s: { frames: [{ key: true, pts: 2, data: new Uint8Array([1]) }] },
    },
  } as Parameters<SessionEvents['message']>[0]);
  const obsoleteFrame = {
    ...frame(),
    displayWidth: 1024,
    displayHeight: 768,
  } as VideoFrame;
  obsoleteOutput(obsoleteFrame);
  expect(obsoleteFrame.close).toHaveBeenCalledTimes(1);
  send({ type: 'rendered', generation: 1, displayGeneration: 1, drawn: true });
  expect(mockPost).not.toHaveBeenCalledWith(
    expect.objectContaining({ status: 'confirmed' }),
  );
  mockOutput({
    ...frame(),
    displayWidth: 1024,
    displayHeight: 768,
  } as VideoFrame);
  send({ type: 'rendered', generation: 1, displayGeneration: 2, drawn: true });
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      request: 1,
      status: 'confirmed',
      displayGeneration: 2,
    }),
  );
  send({ type: 'disconnect', generation: 2 });
});

test('稀疏PeerInfo保持真实列表归属；换显示身份、撤权和切屏取消等待', async () => {
  await boot();
  connect(1);
  resolutionPeer();
  requestResolution();
  mockEvents.message({
    peerInfo: {
      currentDisplay: 0,
      displays: [{ name: 'A', width: 1024, height: 768 }],
    },
  } as Parameters<SessionEvents['message']>[0]);
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'display-options',
      options: expect.objectContaining({
        supported: true,
        resolutions: expect.arrayContaining([{ width: 1024, height: 768 }]),
      }),
    }),
  );
  expect(mockPost).not.toHaveBeenCalledWith(
    expect.objectContaining({ status: 'cancelled' }),
  );
  mockEvents.permissions({
    keyboard: false,
    clipboard: true,
    audio: true,
    file: true,
  });
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({ request: 1, status: 'cancelled' }),
  );
  mockEvents.permissions({
    keyboard: true,
    clipboard: true,
    audio: true,
    file: true,
  });
  requestResolution(2, 1);
  mockEvents.message({
    peerInfo: { displays: [{ name: 'B', width: 1024, height: 768 }] },
  } as Parameters<SessionEvents['message']>[0]);
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({ request: 2, status: 'cancelled' }),
  );
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'display-options',
      options: expect.objectContaining({ resolutions: [] }),
    }),
  );
  send({ type: 'disconnect', generation: 2 });
});

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
    videoFrame: {
      display: 0,
      vp9s: { frames: [{ key: true, pts: 0, data: new Uint8Array([1]) }] },
    },
  } as Parameters<SessionEvents['message']>[0]);
  mockOutput(frame());
  send({ type: 'disconnect', generation: 2 });
  connect(3);
  mockEvents.message({
    videoFrame: {
      display: 0,
      vp9s: { frames: [{ key: true, pts: 0, data: new Uint8Array([1]) }] },
    },
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
    videoFrame: {
      display: 0,
      vp9s: { frames: [{ key: true, pts: 0, data: new Uint8Array([1]) }] },
    },
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

test('hung optional voice probe times out without disabling video; late success cannot change ready', async () => {
  jest.useFakeTimers({ doNotFake: ['setImmediate'] });
  let resolveProbe!: (value: boolean) => void;
  mockVoiceSupported.mockReturnValue(
    new Promise((resolve) => {
      resolveProbe = resolve;
    }),
  );
  try {
    await boot();
    expect(mockPost.mock.calls.some(([event]) => event.type === 'ready')).toBe(
      false,
    );
    await jest.advanceTimersByTimeAsync(5000);
    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ready',
        videoDecoder: true,
        voiceEncoder: false,
      }),
    );
    resolveProbe(true);
    await Promise.resolve();
    expect(
      mockPost.mock.calls.filter(([event]) => event.type === 'ready'),
    ).toHaveLength(1);
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    jest.useRealTimers();
  }
});

test.each(['video', 'crypto'])(
  'hung mandatory %s initialization reports unavailable readiness',
  async (kind) => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] });
    if (kind === 'video') mockSupported.mockReturnValue(new Promise(() => {}));
    else mockReady.mockReturnValue(new Promise(() => {}));
    try {
      await boot();
      await jest.advanceTimersByTimeAsync(5000);
      expect(mockPost).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ready', videoDecoder: false }),
      );
      expect(
        mockPost.mock.calls.filter(([event]) => event.type === 'ready'),
      ).toHaveLength(1);
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  },
);

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
  message({
    videoFrame: {
      display: 0,
      vp9s: { frames: [{ key: true, pts: 0, data: new Uint8Array([1]) }] },
    },
  });
  const oldOutput = mockOutput;
  send({ type: 'select-display', index: 1, generation: 1 });
  const oldFrame = frame();
  oldOutput(oldFrame);
  expect(oldFrame.close).toHaveBeenCalled();
  const n = mockDecode.mock.calls.length;
  message({
    videoFrame: {
      display: 0,
      vp9s: { frames: [{ key: true, pts: 0, data: new Uint8Array([1]) }] },
    },
  });
  message({
    videoFrame: {
      display: 1,
      vp9s: { frames: [{ key: true, pts: 0, data: new Uint8Array([1]) }] },
    },
  });
  expect(mockDecode).toHaveBeenCalledTimes(n);
  message({
    misc: { switchDisplay: { display: 1, x: -1024, width: 1024, height: 768 } },
  });
  message({
    videoFrame: {
      display: 1,
      vp9s: { frames: [{ key: true, pts: 0, data: new Uint8Array([1]) }] },
    },
  });
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
  message({
    videoFrame: {
      display: 0,
      vp9s: { frames: [{ key: true, pts: 0, data: new Uint8Array([1]) }] },
    },
  });
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
    mockEvents.message({
      videoFrame: {
        display: 0,
        vp9s: { frames: [{ key: true, pts: 0, data: new Uint8Array([1]) }] },
      },
    });
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

test('剪贴板上下文只接受当前会话递增代次，旧PNG转换不跨失焦恢复', async () => {
  await boot();
  connect(1);
  let finish!: (bytes: Uint8Array) => void;
  mockImage.mockImplementationOnce(
    () =>
      new Promise<Uint8Array>((resolve) => {
        finish = resolve;
      }),
  );
  send({ type: 'clipboard-context', generation: 1, clipboardGeneration: 2 });
  mockEvents.message({
    multiClipboards: {
      clipboards: [{ format: 22, content: new Uint8Array([1]) }],
    },
  } as never);
  send({ type: 'clipboard-context', generation: 1, clipboardGeneration: 3 });
  finish(new Uint8Array([1]));
  await Promise.resolve();
  await Promise.resolve();
  expect(
    mockPost.mock.calls.some(([message]) => message.type === 'image'),
  ).toBe(false);
  send({ type: 'clipboard-context', generation: 0, clipboardGeneration: 99 });
  send({ type: 'clipboard-context', generation: 1, clipboardGeneration: 1 });
  send({ type: 'clipboard-context', generation: 1, clipboardGeneration: NaN });
  mockEvents.message({
    clipboard: { content: new TextEncoder().encode('fresh'), format: 0 },
  } as never);
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'clipboard',
      text: 'fresh',
      clipboardGeneration: 3,
    }),
  );
  mockImage.mockImplementationOnce(
    () =>
      new Promise<Uint8Array>((resolve) => {
        finish = resolve;
      }),
  );
  mockEvents.message({
    multiClipboards: {
      clipboards: [{ format: 22, content: new Uint8Array([1]) }],
    },
  } as never);
  for (const invalid of [3, 3.5, -1, Infinity, Number.MAX_SAFE_INTEGER + 1])
    send({
      type: 'clipboard-context',
      generation: 1,
      clipboardGeneration: invalid,
    });
  finish(new Uint8Array([2]));
  await Promise.resolve();
  await Promise.resolve();
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'image',
      bytes: new Uint8Array([2]),
      clipboardGeneration: 3,
    }),
  );
});

test('Worker 只读挡住绕过 DOM 的输入、文本和粘贴，过期代次不能修改', async () => {
  await boot();
  connect(1);
  mockEvents.state('connected');
  mockEvents.message({
    videoFrame: {
      display: 0,
      vp9s: { frames: [{ key: true, pts: 0, data: new Uint8Array([1]) }] },
    },
  } as Parameters<SessionEvents['message']>[0]);
  mockOutput(frame());
  send({ type: 'read-only', generation: 1, enabled: true });
  send({
    type: 'input',
    generation: 1,
    displayGeneration: 0,
    input: { keyEvent: { seq: 'blocked', press: true } },
  });
  send({ type: 'text', generation: 1, displayGeneration: 0, text: 'blocked' });
  send({
    type: 'paste',
    generation: 1,
    displayGeneration: 0,
    content: { text: 'blocked' },
  });
  await new Promise((resolve) => setImmediate(resolve));
  expect(mockInput).not.toHaveBeenCalled();
  expect(mockClipboard).not.toHaveBeenCalled();
  send({ type: 'read-only', generation: 0, enabled: false });
  send({
    type: 'input',
    generation: 1,
    displayGeneration: 0,
    input: { keyEvent: { chr: 65, press: true } },
  });
  expect(mockInput).not.toHaveBeenCalled();
  send({ type: 'read-only', generation: 1, enabled: false });
  send({
    type: 'input',
    generation: 1,
    displayGeneration: 0,
    input: { keyEvent: { chr: 65, press: true } },
  });
  expect(mockInput).toHaveBeenCalledTimes(1);
});

test('监测按请求返回真实层级计数，过期会话请求不生效', async () => {
  await boot();
  connect(1);
  send({ type: 'metrics', generation: 0, request: 1 });
  expect(
    mockPost.mock.calls.filter(([m]) => m.type === 'metrics'),
  ).toHaveLength(0);
  send({ type: 'metrics', generation: 1, request: 2 });
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'metrics',
      generation: 1,
      request: 2,
      decoded: 0,
      videoBytes: 1200,
      delay: 42,
      targetBitrateKbps: 2010,
      testDelayReceived: 3,
      testDelayReplied: 3,
      lastProbeAgeMs: 15,
      transport: expect.objectContaining({
        queuedPackets: 1,
        queuedBytes: 42,
        maxDequeuedWaitMs: 5,
      }),
      audio: expect.objectContaining({
        receivedPackets: 0,
        pendingPackets: 0,
        inFlight: 0,
      }),
      audioGeneration: expect.any(Number),
      displayGeneration: 0,
    }),
  );
});

test('音频成功统计跟随当前代次，旧会话和旧音频ACK不归还新PCM，重置清空', async () => {
  type AudioDataFixture = {
    numberOfChannels: number;
    numberOfFrames: number;
    sampleRate: number;
    copyTo(destination: Float32Array): void;
    close(): void;
  };
  const api = globalThis as unknown as {
    AudioDecoder?: unknown;
    EncodedAudioChunk?: unknown;
  };
  const previousDecoder = api.AudioDecoder,
    previousChunk = api.EncodedAudioChunk;
  const outputs: ((data: AudioDataFixture) => void)[] = [];
  Object.assign(globalThis, {
    AudioDecoder: class {
      static async isConfigSupported() {
        return { supported: true };
      }
      state = 'configured';
      decodeQueueSize = 0;
      constructor(callbacks: { output(data: AudioDataFixture): void }) {
        outputs.push(callbacks.output);
      }
      configure() {}
      decode() {}
      close() {
        this.state = 'closed';
      }
    },
    EncodedAudioChunk: class {},
  });
  let request = 0;
  const metrics = () => {
    send({ type: 'metrics', generation: 1, request: ++request });
    return mockPost.mock.calls.at(-1)?.[0] as unknown as Extract<
      import('./contract').WorkerEvent,
      { type: 'metrics' }
    >;
  };
  const pcm = (): AudioDataFixture => ({
    numberOfChannels: 2,
    numberOfFrames: 480,
    sampleRate: 48000,
    copyTo(destination) {
      destination.fill(0.25);
    },
    close: jest.fn(),
  });
  const configureAudio = async () => {
    mockEvents.message({
      misc: { audioFormat: { sampleRate: 48000, channels: 2 } },
    } as never);
    await Promise.resolve();
  };
  const receiveAudio = async () => {
    mockEvents.message({
      audioFrame: { data: new Uint8Array([0xf8, 0]) },
    } as never);
    await new Promise((resolve) => setTimeout(resolve, 0));
  };
  try {
    await boot();
    connect(1);
    mockEvents.state('connected');
    send({ type: 'audio', generation: 1, enabled: true });
    await configureAudio();
    await receiveAudio();
    outputs[0](pcm());
    const first = metrics();
    expect(first.audio).toMatchObject({
      receivedPackets: 1,
      decodedPcm: 1,
      deliveredPcm: 1,
      inFlight: 1,
      acknowledgements: 0,
    });

    await configureAudio();
    const reset = metrics();
    expect(reset.audioGeneration).toBe((first.audioGeneration as number) + 1);
    expect(reset.audio).toMatchObject({
      receivedPackets: 0,
      decodedPcm: 0,
      inFlight: 0,
    });
    const stale = pcm();
    outputs[0](stale);
    expect(stale.close).toHaveBeenCalledTimes(1);
    expect(metrics().audio?.decodedPcm).toBe(0);
    await receiveAudio();
    outputs[1](pcm());
    send({
      type: 'audio-rendered',
      generation: 0,
      audioGeneration: reset.audioGeneration,
    });
    send({
      type: 'audio-rendered',
      generation: 1,
      audioGeneration: first.audioGeneration,
    });
    const waiting = metrics();
    expect(waiting.audio).toMatchObject({
      receivedPackets: 1,
      deliveredPcm: 1,
      inFlight: 1,
      acknowledgements: 0,
    });
    send({
      type: 'audio-rendered',
      generation: 1,
      audioGeneration: reset.audioGeneration,
    });
    expect(metrics().audio).toMatchObject({ inFlight: 0, acknowledgements: 1 });
    expect(waiting.audio?.inFlight).toBe(1);
    expect(
      Object.values(waiting.audio ?? {}).every(
        (value) =>
          typeof value === 'number' && Number.isFinite(value) && value >= 0,
      ),
    ).toBe(true);
    send({ type: 'audio', generation: 1, enabled: false });
    const cleared = metrics();
    expect(cleared.audioGeneration).toBe((reset.audioGeneration as number) + 1);
    expect(cleared.audio).toMatchObject({
      sampleRate: 0,
      receivedPackets: 0,
      decodedPcm: 0,
      deliveredPcm: 0,
      inFlight: 0,
      acknowledgements: 0,
    });
  } finally {
    send({ type: 'disconnect', generation: 2 });
    Object.assign(globalThis, {
      AudioDecoder: previousDecoder,
      EncodedAudioChunk: previousChunk,
    });
  }
});

test('关闭同步取消迟到PNG、阻断双向文字和图片，开启不重放缓存', async () => {
  await boot();
  connect(1);
  let finish!: (bytes: Uint8Array) => void;
  mockImage.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  mockEvents.message({
    multiClipboards: {
      clipboards: [{ format: 22, content: new Uint8Array([1]) }],
    },
  } as never);
  send({
    type: 'clipboard-context',
    generation: 1,
    clipboardGeneration: 2,
    enabled: false,
  });
  finish(new Uint8Array([2]));
  await Promise.resolve();
  await Promise.resolve();
  const inbound = {
    clipboard: { content: new TextEncoder().encode('blocked'), format: 0 },
  };
  mockEvents.message(inbound as never);
  send({ type: 'paste', generation: 1, content: { text: 'blocked' } });
  send({
    type: 'paste',
    generation: 1,
    content: { bytes: new Uint8Array([2]) },
  });
  expect(mockClipboard).not.toHaveBeenCalled();
  expect(mockSendImage).not.toHaveBeenCalled();
  expect(
    mockPost.mock.calls.filter(
      ([m]) => m.type === 'clipboard' || m.type === 'image',
    ),
  ).toHaveLength(0);
  send({
    type: 'clipboard-context',
    generation: 1,
    clipboardGeneration: 3,
    enabled: true,
  });
  expect(
    mockPost.mock.calls.filter(
      ([m]) => m.type === 'clipboard' || m.type === 'image',
    ),
  ).toHaveLength(0);
  mockEvents.message(inbound as never);
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'clipboard',
      clipboardGeneration: 3,
      text: 'blocked',
    }),
  );
  mockEvents.permissions({
    keyboard: true,
    clipboard: false,
    audio: true,
    file: true,
  });
  send({
    type: 'clipboard-context',
    generation: 1,
    clipboardGeneration: 4,
    enabled: true,
  });
  mockEvents.message(inbound as never);
  expect(
    mockPost.mock.calls.filter(([m]) => m.type === 'clipboard'),
  ).toHaveLength(1);
});

test('重连接受当前剪贴板关闭设置，历史上下文不能重新开启同步', async () => {
  await boot();
  connect(1);
  send({
    type: 'clipboard-context',
    generation: 1,
    clipboardGeneration: 9,
    enabled: false,
  });
  connect(2);
  // 页面在 connect 前后重发同一代次，仍须用于初始化新会话。
  send({
    type: 'clipboard-context',
    generation: 2,
    clipboardGeneration: 9,
    enabled: false,
  });
  expect(mockSetClipboardEnabled).toHaveBeenLastCalledWith(false);
  send({ type: 'clipboard-context', generation: 2, clipboardGeneration: 10 });
  send({
    type: 'clipboard-context',
    generation: 1,
    clipboardGeneration: 99,
    enabled: true,
  });
  send({
    type: 'clipboard-context',
    generation: 2,
    clipboardGeneration: 10,
    enabled: true,
  });
  const inbound = {
    clipboard: { content: new TextEncoder().encode('fresh'), format: 0 },
  };
  mockEvents.message(inbound as never);
  send({ type: 'paste', generation: 2, content: { text: 'blocked' } });
  expect(mockClipboard).not.toHaveBeenCalled();
  expect(
    mockPost.mock.calls.filter(([m]) => m.type === 'clipboard'),
  ).toHaveLength(0);
  expect(mockSetClipboardEnabled).toHaveBeenLastCalledWith(false);
  send({
    type: 'clipboard-context',
    generation: 2,
    clipboardGeneration: 11,
    enabled: true,
  });
  mockEvents.message(inbound as never);
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'clipboard',
      clipboardGeneration: 11,
      generation: 2,
    }),
  );
});

test('发送缓冲等待期间关闭再开启同步，不发送旧粘贴快捷键', async () => {
  await boot();
  jest.useFakeTimers();
  try {
    mockClipboard.mockReturnValue(true);
    mockInput.mockReturnValue(true);
    let drained: () => void = () => {};
    mockFlushClipboard.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          drained = resolve;
        }),
    );
    connect(1);
    mockEvents.state('connected');
    mockEvents.message({
      videoFrame: {
        display: 0,
        vp9s: { frames: [{ key: true, pts: 0, data: new Uint8Array([1]) }] },
      },
    } as never);
    mockOutput(frame());
    const paste = (text: string) =>
      send({
        type: 'paste',
        generation: 1,
        displayGeneration: 0,
        content: { text },
      });
    paste('old');
    send({
      type: 'clipboard-context',
      generation: 1,
      clipboardGeneration: 1,
      enabled: false,
    });
    send({
      type: 'clipboard-context',
      generation: 1,
      clipboardGeneration: 2,
      enabled: true,
    });
    drained();
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(1000);
    expect(mockClipboard).toHaveBeenCalledTimes(1);
    expect(mockInput).not.toHaveBeenCalled();
    paste('new');
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(300);
    expect(mockClipboard).toHaveBeenCalledTimes(2);
    expect(mockInput).toHaveBeenCalledTimes(1);
    expect(mockInput).toHaveBeenCalledWith(
      expect.objectContaining({
        keyEvent: expect.objectContaining({ chr: 118, press: true }),
      }),
    );
  } finally {
    jest.useRealTimers();
  }
});

test('多编码切换递增显示代次并拒绝旧帧；444实际头选择profile1配置', async () => {
  await boot();
  connect(1);
  mockEvents.message({
    loginResponse: {
      peerInfo: { currentDisplay: 0, displays: [{ width: 160, height: 96 }] },
    },
  } as never);
  mockEvents.message({
    videoFrame: {
      display: 0,
      vp8s: { frames: [{ key: true, pts: 0, data: new Uint8Array([1]) }] },
    },
  } as never);
  expect(mockConfigs).toHaveBeenLastCalledWith(
    expect.objectContaining({ codec: 'vp8' }),
  );
  const old = mockOutput;
  mockEvents.message({
    videoFrame: {
      display: 0,
      vp9s: {
        frames: [
          {
            key: true,
            pts: 1,
            data: new Uint8Array([0xa2, 0x49, 0x83, 0x42, 0]),
          },
        ],
      },
    },
  } as never);
  expect(mockConfigs).toHaveBeenLastCalledWith(
    expect.objectContaining({ codec: 'vp09.01.10.08.03' }),
  );
  const late = frame();
  old(late);
  expect(late.close).toHaveBeenCalled();
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'video-format',
      format: { codec: 'vp9', profile: 1, chroma: '4:4:4' },
      displayGeneration: 1,
    }),
  );
  send({ type: 'disconnect', generation: 2 });
});

const av1ColorHeader = new Uint8Array([
  0x12, 0, 0x0a, 13, 32, 0, 0, 2, 175, 247, 155, 95, 52, 8, 8, 4, 64,
]);
function mediaPeer() {
  mockEvents.message({
    loginResponse: {
      peerInfo: { currentDisplay: 0, displays: [{ width: 64, height: 48 }] },
    },
  } as never);
}
function av1Video(bytes = av1ColorHeader, key = true, pts = 0) {
  mockEvents.message({
    videoFrame: { display: 0, av1s: { frames: [{ key, pts, data: bytes }] } },
  } as never);
}

test('AV1 profile1配置和实际444来自序列头，转换后的VideoFrame不能改写编码色彩', async () => {
  await boot();
  connect(1);
  mediaPeer();
  av1Video();
  expect(mockConfigs).toHaveBeenLastCalledWith(
    expect.objectContaining({ codec: 'av01.1.00M.08.0.000.02.02.01.0' }),
  );
  mockOutput({ ...frame(), format: 'I420' } as VideoFrame);
  const formats = mockPost.mock.calls.filter(
    ([message]) => message.type === 'video-format',
  );
  expect(formats).toHaveLength(1);
  expect(formats[0][0]).toMatchObject({
    format: { codec: 'av1', profile: 1, bitDepth: 8, chroma: '4:4:4' },
  });
  const old = mockOutput;
  av1Video(new Uint8Array([10, 6, 24, 12, 255, 192, 0, 128]), true, 1);
  expect(mockConfigs).toHaveBeenLastCalledWith(
    expect.objectContaining({ codec: 'av01.0.00M.08.0.110.02.02.02.0' }),
  );
  const obsolete = frame();
  old(obsolete);
  expect(obsolete.close).toHaveBeenCalledTimes(1);
  send({ type: 'metrics', generation: 1, request: 1 });
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'metrics',
      displayGeneration: 1,
      decoded: 0,
    }),
  );
  send({ type: 'disconnect', generation: 2 });
});

test('等待关键帧时逐批ACK但仅刷新一次，新显示和重连重新获得刷新资格', async () => {
  await boot();
  connect(1);
  mockEvents.state('connected');
  mediaPeer();
  const video = (key = false) =>
    mockEvents.message({
      videoFrame: {
        display: 0,
        vp8s: { frames: [{ key, pts: 0, data: new Uint8Array([1]) }] },
      },
    } as never);
  for (let i = 0; i < 3; ++i) video();
  expect(mockAck).toHaveBeenCalledTimes(3);
  expect(mockRefresh).toHaveBeenCalledTimes(1);
  expect(mockConfigs).not.toHaveBeenCalled();
  video(true);
  mockEvents.message({
    misc: { switchDisplay: { display: 0, width: 64, height: 48 } },
  } as never);
  for (let i = 0; i < 3; ++i) video();
  expect(mockAck).toHaveBeenCalledTimes(6);
  expect(mockRefresh).toHaveBeenCalledTimes(2);
  video(true);
  mockDecoderError();
  expect(mockRefresh).toHaveBeenCalledTimes(3);
  video();
  video();
  expect(mockAck).toHaveBeenCalledTimes(8);
  expect(mockRefresh).toHaveBeenCalledTimes(3);
  connect(2);
  mockEvents.state('connected');
  mediaPeer();
  video();
  expect(mockRefresh).toHaveBeenCalledTimes(4);
  send({ type: 'disconnect', generation: 3 });
});

test('新编码先到delta时清旧依赖链并等待key，不消耗解码回退次数', async () => {
  await boot();
  connect(1);
  mockEvents.state('connected');
  mediaPeer();
  mockEvents.message({
    videoFrame: {
      display: 0,
      vp8s: { frames: [{ key: true, pts: 0, data: new Uint8Array([1]) }] },
    },
  } as never);
  const oldOutput = mockOutput;
  for (let i = 1; i < 4; ++i) av1Video(new Uint8Array([1]), false, i);
  expect(mockConfigs).toHaveBeenCalledTimes(1);
  expect(mockAck).toHaveBeenCalledTimes(3);
  expect(mockRefresh).toHaveBeenCalledTimes(1);
  expect(mockSetCodec).not.toHaveBeenCalled();
  const oldFrame = frame();
  oldOutput(oldFrame);
  expect(oldFrame.close).toHaveBeenCalledTimes(1);
  av1Video();
  expect(mockConfigs).toHaveBeenLastCalledWith(
    expect.objectContaining({ codec: 'av01.1.00M.08.0.000.02.02.01.0' }),
  );
  expect(
    mockConfigs.mock.calls.at(-1)?.[0]?.hardwareAcceleration,
  ).toBeUndefined();
  send({ type: 'disconnect', generation: 2 });
});

test('解码器配置失败先确认未提交batch，ACK同步关闭时不能继续回退', async () => {
  for (const closeOnAck of [false, true]) {
    await boot();
    mockConfigs.mockClear();
    mockAck.mockClear();
    mockRefresh.mockClear();
    mockSetCodec.mockClear();
    connect(1);
    mockEvents.state('connected');
    mediaPeer();
    mockConfigs.mockImplementationOnce(() => {
      throw new Error('Unsupported decoder configuration');
    });
    if (closeOnAck)
      mockAck.mockImplementationOnce(() => {
        mockEvents.state('closed');
      });
    const warnings = mockPost.mock.calls.filter(
      ([message]) => message.type === 'warning' && message.code === 'video',
    ).length;
    av1Video();
    expect(mockAck).toHaveBeenCalledTimes(1);
    expect(mockSetCodec).not.toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalledTimes(closeOnAck ? 0 : 1);
    expect(
      mockPost.mock.calls.filter(
        ([message]) => message.type === 'warning' && message.code === 'video',
      ),
    ).toHaveLength(warnings + (closeOnAck ? 0 : 1));
    send({ type: 'disconnect', generation: 2 });
  }
});

test('同会话已关闭后迟到decoder错误不能刷新或重新发布回退状态', async () => {
  await boot();
  connect(1);
  mockEvents.state('connected');
  mediaPeer();
  av1Video();
  const oldError = mockDecoderError;
  mockEvents.state('closed');
  const count = mockPost.mock.calls.length;
  oldError();
  expect(mockPost).toHaveBeenCalledTimes(count);
  expect(mockRefresh).not.toHaveBeenCalled();
  expect(mockSetCodec).not.toHaveBeenCalled();
});

test('AV1只有420能力时拒绝声明/解码444，安全降级；截断首头不伪设420', async () => {
  mockAv1ColorSupported = false;
  await boot();
  connect(1);
  mediaPeer();
  av1Video();
  expect(mockConfigs).not.toHaveBeenCalled();
  expect(mockSetCodec).toHaveBeenCalledWith('vp9', false);
  expect(
    mockPost.mock.calls.filter(([m]) => m.type === 'video-format'),
  ).toHaveLength(0);
  send({ type: 'disconnect', generation: 2 });
});

test('实际AV1流解码错误同格式软件重试一次，保持协商并拒绝旧代次；第二次才VP9', async () => {
  await boot();
  connect(1);
  mockEvents.state('connected');
  mediaPeer();
  const av1Main = new Uint8Array([10, 6, 24, 12, 255, 192, 0, 128]);
  av1Video(av1Main);
  const oldOutput = mockOutput,
    oldError = mockDecoderError,
    oldAck = mockDecoderAck;
  mockDecoderError();
  expect(mockSetCodec).not.toHaveBeenCalled();
  av1Video(av1Main, false, 1);
  expect(mockConfigs).toHaveBeenCalledTimes(1);
  av1Video(av1Main, true, 2);
  expect(mockConfigs).toHaveBeenLastCalledWith(
    expect.objectContaining({
      codec: 'av01.0.00M.08.0.110.02.02.02.0',
      hardwareAcceleration: 'prefer-software',
    }),
  );
  const oldFrame = frame();
  oldOutput(oldFrame);
  oldAck();
  oldError();
  expect(oldFrame.close).toHaveBeenCalledTimes(1);
  expect(mockSetCodec).not.toHaveBeenCalled();
  mockOutput(frame());
  send({ type: 'metrics', generation: 1 });
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'metrics',
      decoded: 1,
      displayGeneration: 1,
    }),
  );
  mockDecoderError();
  expect(mockSetCodec).toHaveBeenCalledTimes(1);
  expect(mockSetCodec).toHaveBeenCalledWith('vp9', false);
  send({ type: 'disconnect', generation: 2 });
});

test('饱和恢复结束当前录制并清旧代次，等待关键帧且不扩大队列', async () => {
  await boot();
  connect(1);
  mockEvents.state('connected');
  mediaPeer();
  send({
    type: 'record-start',
    generation: 1,
    recordingGeneration: 1,
    maxBytes: 100000,
  });
  const video = (key: boolean, pts: number) =>
    mockEvents.message({
      videoFrame: {
        display: 0,
        vp8s: { frames: [{ key, pts, data: new Uint8Array([1]) }] },
      },
    } as never);
  video(true, 0);
  const obsolete = mockOutput;
  mockSaturation();
  video(false, 1);
  expect(mockConfigs).toHaveBeenCalledTimes(1);
  const oldFrame = frame();
  obsolete(oldFrame);
  expect(oldFrame.close).toHaveBeenCalledTimes(1);
  video(true, 2);
  mockOutput(frame());
  send({ type: 'metrics', generation: 1, request: 1 });
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'metrics',
      displayGeneration: 1,
      decoded: 1,
      recoveryCount: 1,
    }),
  );
  for (const sequence of [1, 2])
    send({
      type: 'record-consumed',
      generation: 1,
      recordingGeneration: 1,
      sequence,
      ok: true,
    });
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'record-done',
      reason: 'changed',
      recordingGeneration: 1,
    }),
  );
  send({ type: 'disconnect', generation: 2 });
});

test('同会话饱和恢复及软件/VP9降级有次数上限，新会话重新获得额度', async () => {
  await boot();
  connect(1);
  mockEvents.state('connected');
  mediaPeer();
  const diagnostic = jest
    .requireActual<typeof import('../media/vp9-decoder')>(
      '../media/vp9-decoder',
    )
    .videoFailureDiagnostic('pending-batch-limit', undefined, {
      pendingBatches: 8,
      submittedFrames: 8,
      batchFrames: 1,
    });
  const video = () =>
    mockEvents.message({
      videoFrame: {
        display: 0,
        vp8s: { frames: [{ key: true, pts: 0, data: new Uint8Array([1]) }] },
      },
    } as never);
  video();
  const obsolete = mockSaturation;
  mockSaturation(diagnostic);
  video();
  const count = mockConfigs.mock.calls.length;
  obsolete();
  expect(mockConfigs).toHaveBeenCalledTimes(count);
  mockSaturation(diagnostic);
  video();
  expect(mockSetCodec).not.toHaveBeenCalled();
  mockSaturation(diagnostic);
  video();
  expect(mockConfigs).toHaveBeenLastCalledWith(
    expect.objectContaining({
      codec: 'vp8',
      hardwareAcceleration: 'prefer-software',
    }),
  );
  mockSaturation(diagnostic);
  expect(mockSetCodec).toHaveBeenCalledTimes(1);
  expect(mockSetCodec).toHaveBeenCalledWith('vp9', false);
  mockEvents.message({
    videoFrame: {
      display: 0,
      vp9s: {
        frames: [
          {
            key: true,
            pts: 1,
            data: new Uint8Array([0x82, 0x49, 0x83, 0x42, 0]),
          },
        ],
      },
    },
  } as never);
  mockSaturation(diagnostic);
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'error', code: 'media' }),
  );
  const failures = mockPost.mock.calls
    .map(([message]) => message)
    .filter((message) => message.videoDiagnostic);
  expect(
    failures.map((message) => ({
      type: message.type,
      videoDisplayGeneration: message.videoDisplayGeneration,
      videoSaturationAttempts: message.videoSaturationAttempts,
      videoRecovery: message.videoRecovery,
      videoDiagnostic: message.videoDiagnostic,
    })),
  ).toEqual([
    {
      type: 'display',
      videoDisplayGeneration: 0,
      videoSaturationAttempts: 1,
      videoRecovery: 'key-refresh',
      videoDiagnostic: diagnostic,
    },
    {
      type: 'display',
      videoDisplayGeneration: 1,
      videoSaturationAttempts: 2,
      videoRecovery: 'key-refresh',
      videoDiagnostic: diagnostic,
    },
    {
      type: 'warning',
      videoDisplayGeneration: 2,
      videoSaturationAttempts: 3,
      videoRecovery: 'software',
      videoDiagnostic: diagnostic,
    },
    {
      type: 'warning',
      videoDisplayGeneration: 3,
      videoSaturationAttempts: 4,
      videoRecovery: 'vp9',
      videoDiagnostic: diagnostic,
    },
    {
      type: 'error',
      videoDisplayGeneration: 4,
      videoSaturationAttempts: 5,
      videoRecovery: 'closed',
      videoDiagnostic: diagnostic,
    },
  ]);
  const warnings = mockPost.mock.calls.filter(
    ([message]) => message.type === 'warning' && message.code === 'video',
  ).length;
  connect(2);
  mockEvents.state('connected');
  mediaPeer();
  video();
  expect(
    mockConfigs.mock.calls.at(-1)?.[0]?.hardwareAcceleration,
  ).toBeUndefined();
  mockSaturation(diagnostic);
  video();
  expect(mockPost).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: 'video-format', displayGeneration: 1 }),
  );
  expect(
    mockPost.mock.calls
      .filter(([message]) => message.videoDiagnostic)
      .at(-1)?.[0],
  ).toMatchObject({
    videoDisplayGeneration: 0,
    videoSaturationAttempts: 1,
    videoRecovery: 'key-refresh',
    videoDiagnostic: diagnostic,
  });
  expect(
    mockPost.mock.calls.filter(
      ([message]) => message.type === 'warning' && message.code === 'video',
    ),
  ).toHaveLength(warnings);
  expect(mockSetCodec).toHaveBeenCalledTimes(1);
  send({ type: 'disconnect', generation: 3 });
});

test('原生通话同意匹配时间戳才能编码；撤权、超时和旧采集均停止', async () => {
  await boot();
  connect(1);
  mockEvents.state('connected');
  send({
    type: 'call-start',
    generation: 1,
    callGeneration: 1,
    timestamp: 1234,
  });
  send({
    type: 'voice-pcm',
    generation: 1,
    callGeneration: 1,
    samples: new Float32Array(960),
  });
  expect(mockVoiceEncode).not.toHaveBeenCalled();
  mockEvents.message({
    voiceCallResponse: { accepted: true, reqTimestamp: 1233 },
  } as never);
  await Promise.resolve();
  expect(mockVoiceStart).not.toHaveBeenCalled();
  mockEvents.message({
    voiceCallResponse: { accepted: true, reqTimestamp: 1234 },
  } as never);
  await Promise.resolve();
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'call-state',
      state: 'active',
      callGeneration: 1,
    }),
  );
  send({
    type: 'voice-pcm',
    generation: 1,
    callGeneration: 1,
    samples: new Float32Array(960),
  });
  expect(mockVoiceEncode).toHaveBeenCalledTimes(1);
  mockEvents.permissions({
    keyboard: true,
    clipboard: true,
    file: true,
    audio: false,
    recording: true,
  });
  send({
    type: 'voice-pcm',
    generation: 1,
    callGeneration: 1,
    samples: new Float32Array(960),
  });
  expect(mockVoiceEncode).toHaveBeenCalledTimes(1);
  expect(mockVoiceDispose).toHaveBeenCalled();
  send({ type: 'disconnect', generation: 2 });
});

test('录制单块确认、过期recording代次和撤权收尾，不改变桌面状态', async () => {
  await boot();
  connect(1);
  mockEvents.state('connected');
  mockEvents.message({
    loginResponse: {
      peerInfo: { currentDisplay: 0, displays: [{ width: 160, height: 96 }] },
    },
  } as never);
  send({
    type: 'record-start',
    generation: 1,
    recordingGeneration: 1,
    maxBytes: 16 * 1024 * 1024,
  });
  mockEvents.message({
    videoFrame: {
      display: 0,
      vp8s: { frames: [{ key: true, pts: 100, data: new Uint8Array([1]) }] },
    },
  } as never);
  expect(
    mockPost.mock.calls.filter(([m]) => m.type === 'record-chunk'),
  ).toHaveLength(1);
  send({
    type: 'record-consumed',
    generation: 1,
    recordingGeneration: 0,
    sequence: 1,
    ok: true,
  });
  expect(
    mockPost.mock.calls.filter(([m]) => m.type === 'record-chunk'),
  ).toHaveLength(1);
  mockEvents.permissions({
    keyboard: true,
    clipboard: true,
    file: true,
    audio: true,
    recording: false,
  });
  send({
    type: 'record-consumed',
    generation: 1,
    recordingGeneration: 1,
    sequence: 1,
    ok: true,
  });
  send({
    type: 'record-consumed',
    generation: 1,
    recordingGeneration: 1,
    sequence: 2,
    ok: true,
  });
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'record-done',
      reason: 'denied',
      recordingGeneration: 1,
    }),
  );
  expect(
    mockPost.mock.calls.filter(
      ([m]) => m.type === 'state' && m.state === 'closed',
    ),
  ).toHaveLength(0);
  send({ type: 'disconnect', generation: 2 });
});

test('重复原生接受响应不能创建第二个编码器或重复发布通话激活', async () => {
  await boot();
  connect(1);
  mockEvents.state('connected');
  send({
    type: 'call-start',
    generation: 1,
    callGeneration: 1,
    timestamp: 1234,
  });
  let complete: ((ok: boolean) => void) | undefined;
  mockVoiceStart.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  const response = {
    voiceCallResponse: { accepted: true, reqTimestamp: 1234 },
  };
  mockEvents.message(response as never);
  mockEvents.message(response as never);
  expect(mockVoiceStart).toHaveBeenCalledTimes(1);
  complete?.(true);
  await Promise.resolve();
  mockEvents.message(response as never);
  expect(mockVoiceStart).toHaveBeenCalledTimes(1);
  expect(
    mockPost.mock.calls.filter(
      ([message]) =>
        message.type === 'call-state' && message.state === 'active',
    ),
  ).toHaveLength(1);
  send({ type: 'disconnect', generation: 2 });
});

test('解码失败先同流软件重试一次，再VP9/420，旧错误与ACK不能影响新流', async () => {
  await boot();
  connect(1);
  mockEvents.state('connected');
  mockEvents.message({
    loginResponse: {
      peerInfo: { currentDisplay: 0, displays: [{ width: 160, height: 96 }] },
    },
  } as never);
  const video = {
    videoFrame: {
      display: 0,
      vp8s: { frames: [{ key: true, pts: 0, data: new Uint8Array([1]) }] },
    },
  };
  mockEvents.message(video as never);
  expect(mockConfigs).toHaveBeenLastCalledWith(
    expect.objectContaining({ codec: 'vp8' }),
  );
  expect(
    mockConfigs.mock.calls.at(-1)?.[0]?.hardwareAcceleration,
  ).toBeUndefined();
  const obsoleteError = mockDecoderError,
    obsoleteAck = mockDecoderAck;
  mockDecoderError();
  expect(mockSetCodec).not.toHaveBeenCalled();
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'warning', code: 'video' }),
  );
  const count = mockPost.mock.calls.length;
  obsoleteError();
  obsoleteAck();
  expect(mockPost).toHaveBeenCalledTimes(count);
  expect(mockAck).not.toHaveBeenCalled();
  mockEvents.message(video as never);
  expect(mockConfigs).toHaveBeenLastCalledWith(
    expect.objectContaining({
      codec: 'vp8',
      hardwareAcceleration: 'prefer-software',
    }),
  );
  mockDecoderError();
  expect(mockSetCodec).toHaveBeenCalledWith('vp9', false);
  mockEvents.message({
    videoFrame: {
      display: 0,
      vp9s: {
        frames: [
          {
            key: true,
            pts: 1,
            data: new Uint8Array([0x82, 0x49, 0x83, 0x42, 0]),
          },
        ],
      },
    },
  } as never);
  expect(mockConfigs).toHaveBeenLastCalledWith(
    expect.objectContaining({
      codec: 'vp09.00.10.08',
      hardwareAcceleration: 'prefer-software',
    }),
  );
  mockDecoderError();
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'error', code: 'media' }),
  );
  expect(mockSetCodec).toHaveBeenCalledTimes(1);
});

test('原生已接受但编码能力Promise挂起时仍按时结束，迟到完成不能重新激活', async () => {
  await boot();
  jest.useFakeTimers();
  try {
    connect(1);
    mockEvents.state('connected');
    send({
      type: 'call-start',
      generation: 1,
      callGeneration: 1,
      timestamp: 1234,
    });
    let complete: ((ok: boolean) => void) | undefined;
    mockVoiceStart.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    mockEvents.message({
      voiceCallResponse: { accepted: true, reqTimestamp: 1234 },
    } as never);
    jest.advanceTimersByTime(30000);
    expect(mockVoiceDispose).toHaveBeenCalled();
    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'call-state', state: 'timeout' }),
    );
    complete?.(true);
    await Promise.resolve();
    expect(
      mockPost.mock.calls.filter(
        ([message]) =>
          message.type === 'call-state' && message.state === 'active',
      ),
    ).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
    send({ type: 'disconnect', generation: 2 });
  } finally {
    jest.useRealTimers();
  }
});

test('断开后录制收尾ACK必须同时属于原会话、录制代次和序列', async () => {
  await boot();
  connect(1);
  mockEvents.state('connected');
  mockEvents.message({
    loginResponse: {
      peerInfo: { currentDisplay: 0, displays: [{ width: 160, height: 96 }] },
    },
  } as never);
  send({
    type: 'record-start',
    generation: 1,
    recordingGeneration: 1,
    maxBytes: 16 * 1024 * 1024,
  });
  mockEvents.message({
    videoFrame: {
      display: 0,
      vp8s: { frames: [{ key: true, pts: 100, data: new Uint8Array([1]) }] },
    },
  } as never);
  send({ type: 'disconnect', generation: 2 });
  const consumed = {
    type: 'record-consumed',
    recordingGeneration: 1,
    sequence: 1,
    ok: true,
  };
  send({ ...consumed, generation: 2 });
  send({ ...consumed, generation: 1, sequence: NaN });
  send({ ...consumed, generation: 1, ok: 'true' });
  expect(
    mockPost.mock.calls.filter(([message]) => message.type === 'record-chunk'),
  ).toHaveLength(1);
  send({ ...consumed, generation: 1 });
  expect(
    mockPost.mock.calls.filter(([message]) => message.type === 'record-chunk'),
  ).toHaveLength(2);
  send({ ...consumed, generation: 3, sequence: 2 });
  expect(
    mockPost.mock.calls.filter(([message]) => message.type === 'record-done'),
  ).toHaveLength(0);
  send({ ...consumed, generation: 1, sequence: 2 });
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'record-done',
      generation: 1,
      recordingGeneration: 1,
      reason: 'disconnected',
    }),
  );
});

test('通话中切换桌面声音保留接收解码器，挂断后重配既有格式恢复桌面声音', async () => {
  const api = globalThis as unknown as {
    AudioDecoder?: unknown;
    EncodedAudioChunk?: unknown;
  };
  const previousDecoder = api.AudioDecoder,
    previousChunk = api.EncodedAudioChunk;
  const configure = jest.fn(),
    decode = jest.fn();
  let decodeError: (() => void) | undefined;
  Object.assign(globalThis, {
    AudioDecoder: class {
      static async isConfigSupported() {
        return { supported: true };
      }
      state = 'configured';
      decodeQueueSize = 0;
      constructor(callbacks: { error(): void }) {
        decodeError = callbacks.error;
      }
      configure = configure;
      decode = decode;
      close() {
        this.state = 'closed';
      }
    },
    EncodedAudioChunk: class {},
  });
  try {
    await boot();
    connect(1);
    mockEvents.state('connected');
    send({ type: 'audio', generation: 1, enabled: true });
    mockEvents.message({
      misc: { audioFormat: { sampleRate: 48000, channels: 2 } },
    } as never);
    await Promise.resolve();
    expect(configure).toHaveBeenCalledTimes(1);
    send({
      type: 'call-start',
      generation: 1,
      callGeneration: 1,
      timestamp: 1234,
    });
    mockEvents.message({
      voiceCallResponse: { accepted: true, reqTimestamp: 1234 },
    } as never);
    await Promise.resolve();
    const resets = mockPost.mock.calls.filter(
      ([message]) => message.type === 'audio-reset',
    ).length;
    send({ type: 'audio', generation: 1, enabled: false });
    send({ type: 'audio', generation: 1, enabled: true });
    expect(
      mockPost.mock.calls.filter(([message]) => message.type === 'audio-reset'),
    ).toHaveLength(resets);
    expect(configure).toHaveBeenCalledTimes(1);
    send({ type: 'call-stop', generation: 1, callGeneration: 1 });
    await Promise.resolve();
    expect(configure).toHaveBeenCalledTimes(2);
    mockEvents.message({
      audioFrame: { data: new Uint8Array([0xf8, 0]) },
    } as never);
    // 音频按任务调度出队，等待实际解码提交。
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(decode).toHaveBeenCalledTimes(1);
    send({
      type: 'call-start',
      generation: 1,
      callGeneration: 2,
      timestamp: 1235,
    });
    mockEvents.message({
      voiceCallResponse: { accepted: true, reqTimestamp: 1235 },
    } as never);
    await Promise.resolve();
    const failedAudioGeneration = mockPost.mock.calls
      .map(([message]) => message)
      .findLast((message) => message.type === 'audio-reset')?.audioGeneration;
    expect(typeof failedAudioGeneration).toBe('number');
    decodeError?.();
    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        code: 'audio',
        audioGeneration: failedAudioGeneration,
        audioDiagnostic: expect.objectContaining({
          reason: 'decoder-error',
          sampleRate: 48000,
          channels: 2,
        }),
      }),
    );
    expect(
      mockPost.mock.calls
        .map(([message]) => message)
        .findLast((message) => message.type === 'audio-reset')?.audioGeneration,
    ).toBe((failedAudioGeneration as number) + 1);
    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'call-state',
        state: 'failed',
        callGeneration: 2,
      }),
    );
    const encoded = mockVoiceEncode.mock.calls.length;
    send({
      type: 'voice-pcm',
      generation: 1,
      callGeneration: 2,
      samples: new Float32Array(960),
    });
    expect(mockVoiceEncode).toHaveBeenCalledTimes(encoded);
    send({ type: 'disconnect', generation: 2 });
  } finally {
    Object.assign(globalThis, {
      AudioDecoder: previousDecoder,
      EncodedAudioChunk: previousChunk,
    });
  }
});
