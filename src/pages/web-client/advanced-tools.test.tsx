import '../../features/web-client/input/dom-test-encoding';
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import React from 'react';

type RecordingSink =
  import('@/features/web-client/media/recording-save').RecordingSink;
type SessionCommand =
  import('@/features/web-client/worker/contract').SessionCommand;
type WorkerEvent = import('@/features/web-client/worker/contract').WorkerEvent;

import { AdvancedDialogs, useAdvancedTools } from './advanced-tools';

type AdvancedTools = import('./advanced-tools').AdvancedTools;

const mockChoose =
  jest.fn<
    () => Promise<{ sink: RecordingSink; streaming: boolean; maxBytes: number }>
  >();
const mockMicStart = jest.fn<() => Promise<boolean>>();
const mockMicDispose = jest.fn(),
  mockEnable = jest.fn(),
  mockPlay = jest.fn(),
  mockClear = jest.fn();
jest.mock('@/features/web-client/media/recording-save', () => ({
  chooseRecording: () => mockChoose(),
}));
jest.mock('@/features/web-client/media/microphone', () => ({
  Microphone: class {
    start = mockMicStart;
    dispose = mockMicDispose;
    enable = mockEnable;
    mute() {}
    consumed() {}
  },
}));
jest.mock('@/features/web-client/media/audio-player', () => ({
  AudioPlayer: class {
    async start() {}
    volume() {}
    play = mockPlay;
    clear = mockClear;
    dispose() {}
  },
}));
let tools: AdvancedTools;
let identity = 1,
  recordingAllowed = true,
  audioAllowed = true,
  connected = true;
const post = jest.fn<(command: SessionCommand, owner?: number) => void>();
const onClose = jest.fn<(tool: 'chat' | 'call', ownedFocus: boolean) => void>();
function Harness({ dialogs = false }: { dialogs?: boolean }) {
  tools = useAdvancedTools(post, () => identity, {
    connected: () => connected,
    audio: () => audioAllowed,
    recording: () => recordingAllowed,
    display: () => 0,
  });
  return dialogs
    ? React.createElement(
        React.Fragment,
        null,
        React.createElement('input', { 'aria-label': 'Other tool' }),
        React.createElement(AdvancedDialogs, {
          tools,
          connected,
          audioAllowed,
          text: (_key, fallback) => fallback,
          onClose,
        }),
      )
    : null;
}
function emit(message: object) {
  act(() => {
    tools.handle({ generation: identity, ...message } as WorkerEvent);
  });
}
function sink() {
  return {
    write: jest.fn<(b: Uint8Array) => Promise<void>>().mockResolvedValue(),
    close: jest.fn<() => Promise<void>>().mockResolvedValue(),
    abort: jest.fn<() => Promise<void>>().mockResolvedValue(),
    duration: jest.fn<(n: number) => void>(),
  };
}
beforeEach(() => {
  jest.clearAllMocks();
  identity = 1;
  recordingAllowed = true;
  audioAllowed = true;
  connected = true;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: () => {} },
  });
  Object.assign(globalThis, { AudioWorkletNode: class {} });
  mockMicStart.mockResolvedValue(true);
  render(React.createElement(Harness));
  emit({ type: 'ready', voiceEncoder: true, audioDecoder: true });
});
afterEach(() => {
  cleanup();
  jest.useRealTimers();
});
test('采集授权期间取消，迟到结果不能发送原生拨号', async () => {
  let resolve: ((ok: boolean) => void) | undefined;
  mockMicStart.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  let start: Promise<void> | undefined;
  act(() => {
    start = tools.startCall();
  });
  act(() => tools.endCall());
  await act(async () => {
    resolve?.(true);
    await start;
  });
  expect(post.mock.calls.some(([c]) => c.type === 'call-start')).toBe(false);
  expect(mockMicDispose).toHaveBeenCalled();
});
test('原生同意后开启采集；旧audioGeneration被丢弃，通话PCM只走一个播放器', async () => {
  await act(async () => tools.startCall());
  const call = post.mock.calls
    .map(([c]) => c)
    .find((c) => c.type === 'call-start');
  if (call?.type !== 'call-start') throw new Error('Missing call');
  const pcm = { sampleRate: 48000, planes: [new Float32Array(960)] };
  expect(
    tools.handle({
      type: 'audio-frame',
      generation: 1,
      audioGeneration: 0,
      pcm,
    }),
  ).toBe(false);
  expect(mockPlay).not.toHaveBeenCalled();
  emit({
    type: 'call-state',
    state: 'active',
    callGeneration: call.callGeneration,
  });
  expect(mockEnable).toHaveBeenCalledWith(true);
  emit({ type: 'audio-reset', audioGeneration: 2 });
  let handled: boolean | undefined;
  act(() => {
    handled = tools.handle({
      type: 'audio-frame',
      generation: 1,
      audioGeneration: 1,
      pcm,
    });
  });
  expect(handled).toBe(true);
  expect(mockPlay).not.toHaveBeenCalled();
  emit({ type: 'audio-frame', audioGeneration: 2, pcm });
  expect(mockPlay).toHaveBeenCalledTimes(1);
  act(() => tools.endCall());
  expect(mockMicDispose).toHaveBeenCalled();
  emit({
    type: 'call-state',
    state: 'active',
    callGeneration: call.callGeneration,
  });
  expect(tools.callState).toBe('ended');
});
test('保存选择期间撤销录制权限，必须abort新句柄且不启动录制', async () => {
  const selected = sink();
  let resolve:
    | ((value: {
        sink: RecordingSink;
        maxBytes: number;
        streaming: boolean;
      }) => void)
    | undefined;
  mockChoose.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  let start: Promise<void> | undefined;
  act(() => {
    start = tools.startRecord();
  });
  recordingAllowed = false;
  await act(async () => {
    resolve?.({ sink: selected, maxBytes: 16000000, streaming: true });
    await start;
  });
  expect(selected.abort).toHaveBeenCalledTimes(1);
  expect(post.mock.calls.some(([c]) => c.type === 'record-start')).toBe(false);
  expect(tools.recording).toBe(false);
});
test('只有保存close成功后显示已保存；收尾挂起五秒中止，晚到块不污染新会话', async () => {
  jest.useFakeTimers();
  const selected = sink();
  let close: (() => void) | undefined;
  selected.close.mockImplementation(
    () =>
      new Promise<void>((r) => {
        close = r;
      }),
  );
  mockChoose.mockResolvedValue({
    sink: selected,
    maxBytes: 16000000,
    streaming: true,
  });
  await act(async () => tools.startRecord());
  const start = post.mock.calls
    .map(([c]) => c)
    .find((c) => c.type === 'record-start');
  if (start?.type !== 'record-start') throw new Error('Missing recording');
  emit({
    type: 'record-done',
    recordingGeneration: start.recordingGeneration,
    reason: 'user',
    duration: 800,
  });
  expect(tools.recordNotice).toBe('recordSaving');
  await act(async () => {
    await Promise.resolve();
    jest.advanceTimersByTime(5000);
    await Promise.resolve();
  });
  expect(selected.abort).toHaveBeenCalledTimes(1);
  expect(tools.recordNotice).toBe('recordFailed');
  await act(async () => {
    close?.();
    await Promise.resolve();
  });
  expect(tools.recordNotice).toBe('recordFailed');
  expect(selected.duration).toHaveBeenCalledWith(800);
});
test('手动断开只允许旧录制继续保存确认，其余功能和旧会话不能重启', async () => {
  const selected = sink();
  mockChoose.mockResolvedValue({
    sink: selected,
    maxBytes: 16000000,
    streaming: true,
  });
  await act(async () => tools.startRecord());
  const start = post.mock.calls
    .map(([c]) => c)
    .find((c) => c.type === 'record-start');
  if (start?.type !== 'record-start') throw new Error('Missing recording');
  act(() => {
    tools.reset();
    identity = 2;
    connected = false;
  });
  await act(async () => {
    tools.handle({
      type: 'record-chunk',
      generation: 1,
      recordingGeneration: start.recordingGeneration,
      sequence: 1,
      bytes: new Uint8Array([1]),
    });
    await Promise.resolve();
  });
  expect(post).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'record-consumed', ok: true }),
    1,
  );
  await act(async () => {
    tools.handle({
      type: 'record-done',
      generation: 1,
      recordingGeneration: start.recordingGeneration,
      reason: 'disconnected',
      duration: 800,
    });
    await Promise.resolve();
  });
  expect(selected.close).toHaveBeenCalledTimes(1);
  expect(selected.duration).toHaveBeenCalledWith(800);
  expect(tools.entries).toHaveLength(0);
});
test('聊天会话列表最多200条，未知实际格式不会随偏好变成444', () => {
  act(() => {
    for (let i = 0; i < 225; i++)
      tools.handle({
        type: 'chat',
        text: `msg${i}`,
        incoming: true,
        generation: 1,
      });
  });
  expect(tools.entries).toHaveLength(200);
  expect(tools.entries[0].text).toBe('msg25');
  expect(tools.unread).toBe(99);
  act(() => tools.updateCodec('auto', true));
  expect(tools.prefer).toBe('auto');
  expect(tools.trueColor).toBe(false);
  expect(post).toHaveBeenCalledWith({
    type: 'codec',
    prefer: 'auto',
    trueColor: false,
  });
  expect(tools.format).toBeUndefined();
  act(() => tools.reset());
  expect(tools.entries).toHaveLength(0);
});

test('没有收到有效视频的录制必须中止空文件，不显示已保存', async () => {
  const selected = sink();
  mockChoose.mockResolvedValue({
    sink: selected,
    maxBytes: 16000000,
    streaming: true,
  });
  await act(async () => tools.startRecord());
  const start = post.mock.calls
    .map(([c]) => c)
    .find((c) => c.type === 'record-start');
  if (start?.type !== 'record-start') throw new Error('Missing recording');
  await act(async () => {
    tools.handle({
      type: 'record-done',
      generation: 1,
      recordingGeneration: start.recordingGeneration,
      reason: 'user',
      duration: 0,
    });
    await Promise.resolve();
  });
  expect(selected.close).not.toHaveBeenCalled();
  expect(selected.abort).toHaveBeenCalledTimes(1);
  expect(tools.recordNotice).toBe('recordSaveCancelled');
});

test('聊天ACK只清除已发送的草稿，等待期间新输入的文字保留', () => {
  act(() => tools.setDraft('first'));
  act(() => tools.sendChat());
  const command = post.mock.calls
    .map(([value]) => value)
    .find((value) => value.type === 'chat');
  if (command?.type !== 'chat') throw new Error('Missing chat');
  act(() => tools.setDraft('next'));
  emit({
    type: 'chat',
    incoming: false,
    text: 'first',
    request: command.request,
    ok: true,
  });
  expect(tools.draft).toBe('next');
  expect(tools.entries[0]?.text).toBe('first');
});

test('发送在途忽略重复提交，下一草稿即便重新输入相同文字也不会被旧回执清掉', () => {
  act(() => tools.setDraft('same'));
  act(() => {
    tools.sendChat();
    tools.sendChat();
  });
  expect(
    post.mock.calls.filter(([command]) => command.type === 'chat'),
  ).toHaveLength(1);
  expect(tools.chatPending).toBe(true);
  expect(tools.chatError).toBe(false);
  const command = post.mock.calls
    .map(([value]) => value)
    .find((value) => value.type === 'chat');
  if (command?.type !== 'chat') throw new Error('Missing chat');
  act(() => tools.setDraft(''));
  act(() => tools.setDraft('same'));
  emit({
    type: 'chat',
    incoming: false,
    text: 'same',
    request: command.request,
    ok: true,
  });
  expect(tools.chatPending).toBe(false);
  expect(tools.draft).toBe('same');
});

test('失败回执保留下一稿并释放发送门禁；旧会话回执不能清除当前在途', () => {
  act(() => tools.setDraft('first'));
  act(() => tools.sendChat());
  const command = post.mock.calls
    .map(([value]) => value)
    .find((value) => value.type === 'chat');
  if (command?.type !== 'chat') throw new Error('Missing chat');
  act(() => tools.setDraft('next'));
  emit({
    type: 'chat',
    generation: 0,
    incoming: false,
    text: 'first',
    request: command.request,
    ok: true,
  });
  expect(tools.chatPending).toBe(true);
  emit({
    type: 'chat',
    incoming: false,
    text: 'first',
    request: command.request,
    ok: false,
  });
  expect(tools.chatPending).toBe(false);
  expect(tools.draft).toBe('next');
  expect(tools.entries).toHaveLength(0);
  expect(tools.chatError).toBe(true);
});

test('新消息不抢其它工具焦点，也不将正在阅读的历史滚动到底', () => {
  cleanup();
  render(React.createElement(Harness, { dialogs: true }));
  act(() => tools.openChat());
  expect(document.activeElement).toBe(screen.getByLabelText('Message'));
  const list = screen.getByRole('log');
  Object.defineProperties(list, {
    scrollHeight: { configurable: true, value: 1200 },
    clientHeight: { configurable: true, value: 300 },
  });
  list.scrollTop = 200;
  fireEvent.scroll(list);
  const other = screen.getByLabelText('Other tool');
  other.focus();
  emit({ type: 'chat', incoming: true, text: 'new message' });
  expect(document.activeElement).toBe(other);
  expect(list.scrollTop).toBe(200);
  expect(screen.getByRole('button', { name: 'New messages' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'New messages' }));
  expect(list.scrollTop).toBe(1200);
  expect(screen.queryByRole('button', { name: 'New messages' })).toBeNull();
});

test('聊天只有位于底部才随新消息滚动，关闭回调区分焦点归属', () => {
  cleanup();
  render(React.createElement(Harness, { dialogs: true }));
  act(() => tools.openChat());
  const list = screen.getByRole('log');
  Object.defineProperties(list, {
    scrollHeight: { configurable: true, value: 1200 },
    clientHeight: { configurable: true, value: 300 },
  });
  list.scrollTop = 880;
  fireEvent.scroll(list);
  emit({ type: 'chat', incoming: true, text: 'latest' });
  expect(list.scrollTop).toBe(1200);
  screen.getByLabelText('Other tool').focus();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClose).toHaveBeenLastCalledWith('chat', false);
  act(() => tools.openChat());
  fireEvent.keyDown(screen.getByLabelText('Message'), { key: 'Escape' });
  expect(onClose).toHaveBeenLastCalledWith('chat', true);
});

test('通话收起不会结束采集，结束动作才释放麦克风', async () => {
  cleanup();
  render(React.createElement(Harness, { dialogs: true }));
  emit({ type: 'ready', voiceEncoder: true, audioDecoder: true });
  await act(async () => tools.startCall());
  const command = post.mock.calls
    .map(([value]) => value)
    .filter((value) => value.type === 'call-start')
    .pop();
  if (command?.type !== 'call-start') throw new Error('Missing call');
  emit({
    type: 'call-state',
    state: 'active',
    callGeneration: command.callGeneration,
  });
  mockMicDispose.mockClear();
  fireEvent.click(screen.getByRole('button', { name: 'Minimize call window' }));
  expect(tools.callOpen).toBe(false);
  expect(tools.callState).toBe('active');
  expect(mockMicDispose).not.toHaveBeenCalled();
  act(() => tools.setCallOpen(true));
  fireEvent.click(screen.getByRole('button', { name: 'End call' }));
  expect(tools.callState).toBe('ended');
  expect(mockMicDispose).toHaveBeenCalledTimes(1);
});

test('录制选择可取消，迟到保存目标必须中止；停止后不可重复发送停止命令', async () => {
  const selected = sink();
  let resolve:
    | ((value: {
        sink: RecordingSink;
        streaming: boolean;
        maxBytes: number;
      }) => void)
    | undefined;
  mockChoose.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  let start: Promise<void> | undefined;
  act(() => {
    start = tools.startRecord();
  });
  expect(tools.recordPhase).toBe('choosing');
  act(() => tools.cancelRecord());
  expect(tools.recordPhase).toBe('idle');
  await act(async () => {
    resolve?.({ sink: selected, streaming: true, maxBytes: 16000000 });
    await start;
  });
  expect(selected.abort).toHaveBeenCalledTimes(1);
  expect(
    post.mock.calls.some(([command]) => command.type === 'record-start'),
  ).toBe(false);
  mockChoose.mockResolvedValue({
    sink: sink(),
    streaming: true,
    maxBytes: 16000000,
  });
  await act(async () => tools.startRecord());
  expect(tools.recordPhase).toBe('recording');
  const stops = post.mock.calls.filter(
    ([command]) => command.type === 'record-stop',
  ).length;
  act(() => {
    tools.stopRecord();
    tools.stopRecord();
  });
  expect(tools.recordPhase).toBe('stopping');
  expect(
    post.mock.calls.filter(([command]) => command.type === 'record-stop'),
  ).toHaveLength(stops + 1);
});

test('AV1真彩仅按浏览器能力和远端编码允许开启，偏好不冒充实际格式', () => {
  emit({
    type: 'ready',
    videoCapabilities: {
      vp8: true,
      vp9: true,
      av1: true,
      vp9_444: false,
      av1_444: true,
    },
  });
  act(() => tools.updateCodec('av1', true));
  expect(tools.trueColor).toBe(true);
  expect(tools.format).toBeUndefined();
  emit({
    type: 'encoding',
    encoding: { av1: false, i444: { vp9: true, av1: false } },
  });
  act(() => tools.updateCodec('av1', true));
  expect(tools.trueColor).toBe(false);
  act(() => tools.updateCodec('vp8', true));
  expect(tools.trueColor).toBe(false);
});

test('远端动态撤销编码或444后同步菜单资格，恢复能力不会自动重新开启真彩色', () => {
  emit({
    type: 'ready',
    videoCapabilities: {
      vp8: true,
      vp9: true,
      av1: true,
      vp9_444: true,
      av1_444: true,
    },
  });
  emit({
    type: 'encoding',
    encoding: { av1: true, vp8: true, i444: { av1: true, vp9: true } },
  });
  act(() => tools.updateCodec('av1', true));
  expect(tools.trueColor).toBe(true);
  emit({
    type: 'encoding',
    encoding: { av1: true, i444: { av1: false, vp9: true } },
  });
  expect(tools.prefer).toBe('av1');
  expect(tools.trueColor).toBe(false);
  emit({
    type: 'encoding',
    encoding: { av1: true, i444: { av1: true, vp9: true } },
  });
  expect(tools.trueColor).toBe(false);
  act(() => tools.updateCodec('av1', true));
  emit({
    type: 'encoding',
    encoding: { av1: false, i444: { av1: false, vp9: false } },
  });
  expect(tools.prefer).toBe('auto');
  expect(tools.trueColor).toBe(false);
  expect(tools.format).toBeUndefined();
});

test('保存等待写入期间取消，迟到写入不能close被取消文件或覆盖新录制状态', async () => {
  const selected = sink();
  let finishWrite: (() => void) | undefined;
  selected.write.mockImplementation(
    () =>
      new Promise<void>((done) => {
        finishWrite = done;
      }),
  );
  mockChoose.mockResolvedValue({
    sink: selected,
    streaming: true,
    maxBytes: 16000000,
  });
  await act(async () => tools.startRecord());
  const first = post.mock.calls
    .map(([command]) => command)
    .find((command) => command.type === 'record-start');
  if (first?.type !== 'record-start') throw new Error('Missing recording');
  emit({
    type: 'record-chunk',
    recordingGeneration: first.recordingGeneration,
    sequence: 1,
    bytes: new Uint8Array([1]),
  });
  emit({
    type: 'record-done',
    recordingGeneration: first.recordingGeneration,
    reason: 'user',
    duration: 800,
  });
  expect(tools.recordPhase).toBe('saving');
  act(() => tools.cancelRecord());
  mockChoose.mockResolvedValue({
    sink: sink(),
    streaming: true,
    maxBytes: 16000000,
  });
  await act(async () => tools.startRecord());
  expect(tools.recordPhase).toBe('recording');
  await act(async () => {
    finishWrite?.();
    await Promise.resolve();
  });
  expect(selected.close).not.toHaveBeenCalled();
  expect(tools.recordPhase).toBe('recording');
});
