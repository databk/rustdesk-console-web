import '../../features/web-client/input/dom-test-encoding';
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import { hbb } from '@/features/web-client/protocol';

type WebClientConfiguration =
  import('@/services/rustdesk-console/webClient').WebClientConfiguration;
type Children = import('react').PropsWithChildren;
type InputProps = import('react').InputHTMLAttributes<HTMLInputElement>;
type TextAreaProps =
  import('react').TextareaHTMLAttributes<HTMLTextAreaElement>;
type ButtonProps = import('react').ButtonHTMLAttributes<HTMLButtonElement>;
type KeyboardEvent = import('react').KeyboardEvent;

const profile = {
  enabled: true as const,
  idServerUrl: 'wss://example.test/id',
  relayServerUrl: 'wss://example.test/relay',
  serverPublicKey: 'test-public-key',
};
let mockConfiguration: WebClientConfiguration | undefined = profile;
const mockCreateWorker = jest.fn<() => Promise<Worker>>();
const mockDraw = jest.fn();
const mockClear = jest.fn();
jest.mock('@umijs/max', () => ({
  useIntl: () => ({
    formatMessage: ({ defaultMessage }: { defaultMessage: string }) =>
      defaultMessage,
  }),
  useLocation: () => ({ search: '?id=123456789' }),
  useModel: () => ({
    configuration: mockConfiguration,
    loading: false,
    unavailable: false,
    reload: jest.fn(),
  }),
}));
jest.mock('@ant-design/pro-components', () => ({
  PageContainer: ({ children }: Children) => children,
}));
jest.mock('antd', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const Box = ({ children }: Children) =>
    React.createElement('div', null, children);
  const Field = ({
    onPressEnter,
    ...props
  }: InputProps & { onPressEnter?: () => void }) =>
    React.createElement('input', {
      ...props,
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === 'Enter') onPressEnter?.();
      },
    });
  const TextArea = ({
    autoSize: _autoSize,
    ...props
  }: TextAreaProps & { autoSize?: unknown }) =>
    React.createElement('textarea', props);
  return {
    theme: { useToken: () => ({ token: {} }) },
    Card: Box,
    Space: Box,
    Tag: Box,
    Spin: Box,
    Typography: { Paragraph: Box, Text: Box },
    Button: ({
      children,
      type: _type,
      danger: _danger,
      icon: _icon,
      ...props
    }: ButtonProps & { danger?: boolean; icon?: unknown }) =>
      React.createElement('button', props, children),
    Alert: ({ message }: { message: string }) =>
      React.createElement('div', null, message),
    Input: Object.assign(Field, { Password: Field, TextArea }),
  };
});
jest.mock('@/features/web-client/worker/create-worker', () => ({
  createSessionWorker: () => mockCreateWorker(),
}));
jest.mock('@/features/web-client/input/input', () => ({
  RemoteInput: class {
    release() {}
    dispose() {}
  },
}));

import WebClientPage from './index';

class TestWorker {
  onmessage?: (event: MessageEvent) => void;
  onerror?: () => void;
  postMessage = jest.fn<
    (message: {
      type: string;
      generation: number;
      [key: string]: unknown;
    }) => void
  >((message) => {
    if (message.type === 'shutdown')
      queueMicrotask(() => {
        this.onmessage?.({
          data: { type: 'shutdown-complete', generation: message.generation },
        } as MessageEvent);
      });
  });
  terminate = jest.fn();
  emit(message: object) {
    act(() => this.onmessage?.({ data: message } as MessageEvent));
  }
  get generation() {
    return this.postMessage.mock.calls.at(-1)?.[0].generation || 0;
  }
}
let worker: TestWorker;
beforeEach(() => {
  mockConfiguration = profile;
  worker = new TestWorker();
  mockCreateWorker.mockReset().mockResolvedValue(worker as unknown as Worker);
  mockDraw.mockClear();
  mockClear.mockClear();
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    clearRect: mockClear,
    drawImage: mockDraw,
  } as unknown as CanvasRenderingContext2D);
});
afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});
async function start() {
  const view = render(React.createElement(WebClientPage));
  await waitFor(() => expect(worker.onmessage).toBeDefined());
  worker.emit({
    type: 'ready',
    secureContext: true,
    videoDecoder: true,
    generation: 0,
  });
  fireEvent.click(screen.getByText('Connect'));
  worker.emit({
    type: 'state',
    state: 'connected',
    generation: worker.generation,
  });
  return view;
}
function value(label: string) {
  return (screen.getByLabelText(label) as HTMLInputElement).value;
}

async function readyDesktop() {
  await start();
  worker.emit({
    type: 'peer',
    peer: { displays: [{ width: 800, height: 600 }], currentDisplay: 0 },
    generation: worker.generation,
  });
  worker.emit({
    type: 'frame',
    frame: { displayWidth: 800, displayHeight: 600, close: jest.fn() },
    displayGeneration: 0,
    generation: worker.generation,
  });
  return screen.getByLabelText(
    'Remote desktop. Focus to send keyboard and mouse input.',
  );
}

test('无需打开面板即可从远程画面粘贴文字；不会截获文本框粘贴', async () => {
  const desktop = await readyDesktop();
  const clipboardData = { items: [], getData: () => '直接粘贴的文字' };
  fireEvent.paste(desktop, { clipboardData });
  expect(worker.postMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'paste',
      content: { text: '直接粘贴的文字' },
      displayGeneration: 0,
    }),
  );
  const count = worker.postMessage.mock.calls.length;
  fireEvent.paste(screen.getByLabelText('Remote ID'), { clipboardData });
  expect(worker.postMessage.mock.calls).toHaveLength(count);
});

test('截图粘贴优先使用 PNG；断开后丢弃尚未读完的图片', async () => {
  const desktop = await readyDesktop();
  let finish!: (value: ArrayBuffer) => void;
  const bytes = new Uint8Array([1, 2, 3]);
  const clipboardData = {
    getData: () => 'image alt text',
    items: [
      {
        kind: 'file',
        type: 'image/png',
        getAsFile: () => ({
          size: 3,
          arrayBuffer: () =>
            new Promise<ArrayBuffer>((resolve) => {
              finish = resolve;
            }),
        }),
      },
    ],
  };
  fireEvent.paste(desktop, { clipboardData });
  await act(async () => finish(bytes.buffer));
  expect(worker.postMessage).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'paste', content: { bytes } }),
  );
  const count = worker.postMessage.mock.calls.filter(
    ([m]) => m.type === 'paste',
  ).length;
  fireEvent.paste(desktop, { clipboardData });
  fireEvent.click(screen.getByText('Disconnect'));
  await act(async () => finish(bytes.buffer));
  expect(
    worker.postMessage.mock.calls.filter(([m]) => m.type === 'paste'),
  ).toHaveLength(count);
});

test('权限撤销与离开画面会取消粘贴，超限图片不读入内存', async () => {
  const desktop = await readyDesktop();
  const arrayBuffer = jest.fn();
  fireEvent.paste(desktop, {
    clipboardData: {
      items: [
        {
          kind: 'file',
          type: 'image/png',
          getAsFile: () => ({ size: 5 * 1024 * 1024, arrayBuffer }),
        },
      ],
    },
  });
  expect(arrayBuffer).not.toHaveBeenCalled();
  expect(
    screen.getByText('Paste failed. Use clipboard tools to retry.'),
  ).toBeDefined();
  fireEvent.blur(desktop);
  expect(worker.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: 'cancel-paste' }),
  );
  worker.emit({
    type: 'permissions',
    permissions: { keyboard: true, clipboard: false, audio: true, file: true },
    generation: worker.generation,
  });
  const count = worker.postMessage.mock.calls.filter(
    ([m]) => m.type === 'paste',
  ).length;
  fireEvent.paste(desktop, {
    clipboardData: { items: [], getData: () => 'no access' },
  });
  expect(
    worker.postMessage.mock.calls.filter(([m]) => m.type === 'paste'),
  ).toHaveLength(count);
});

test('disconnect immediately discards queued old clipboard and frames, including after reconnect', async () => {
  await start();
  const previous = worker.generation;
  worker.emit({ type: 'clipboard', text: 'old secret', generation: previous });
  fireEvent.click(screen.getByText('Disconnect'));
  expect(value('Remote clipboard text')).toBe('');
  const closed = jest.fn();
  worker.emit({
    type: 'frame',
    displayGeneration: 0,
    frame: { close: closed, displayWidth: 1920, displayHeight: 1080 },
    generation: previous,
  });
  worker.emit({ type: 'clipboard', text: 'late secret', generation: previous });
  expect(closed).toHaveBeenCalledTimes(1);
  expect(mockDraw).not.toHaveBeenCalled();
  expect(value('Remote clipboard text')).toBe('');
  fireEvent.click(screen.getByText('Connect'));
  worker.emit({
    type: 'clipboard',
    text: 'still obsolete',
    generation: previous,
  });
  expect(value('Remote clipboard text')).toBe('');
  worker.emit({
    type: 'clipboard',
    text: 'current text',
    generation: worker.generation,
  });
  expect(value('Remote clipboard text')).toBe('current text');
});

test('a failed session rejects a subsequent frame even with the same generation', async () => {
  await start();
  worker.emit({
    type: 'state',
    state: 'failed',
    generation: worker.generation,
  });
  const close = jest.fn();
  worker.emit({
    type: 'frame',
    displayGeneration: 0,
    generation: worker.generation,
    frame: { close },
  });
  expect(close).toHaveBeenCalledTimes(1);
  expect(mockDraw).not.toHaveBeenCalled();
});

test('replacing configuration terminates the old worker and clears all session text', async () => {
  const view = await start();
  worker.emit({
    type: 'state',
    state: 'awaitingApproval',
    generation: worker.generation,
  });
  fireEvent.change(screen.getByLabelText('Remote device password'), {
    target: { value: 'private password' },
  });
  fireEvent.change(screen.getByLabelText('Local text'), {
    target: { value: 'private local text' },
  });
  worker.emit({
    type: 'clipboard',
    text: 'private remote text',
    generation: worker.generation,
  });
  const old = worker;
  mockConfiguration = undefined;
  view.rerender(React.createElement(WebClientPage));
  await waitFor(() => expect(old.terminate).toHaveBeenCalledTimes(1));
  worker = new TestWorker();
  mockCreateWorker.mockResolvedValue(worker as unknown as Worker);
  mockConfiguration = { ...profile };
  view.rerender(React.createElement(WebClientPage));
  await waitFor(() => expect(worker.onmessage).toBeDefined());
  expect(value('Local text')).toBe('');
  expect(value('Remote clipboard text')).toBe('');
  worker.emit({
    type: 'state',
    state: 'awaitingApproval',
    generation: old.generation,
  });
  expect(value('Remote device password')).toBe('');
});

test('worker crashes and clipboard permission revocation clear retained remote text', async () => {
  await start();
  worker.emit({
    type: 'clipboard',
    text: 'private remote text',
    generation: worker.generation,
  });
  worker.emit({
    type: 'permissions',
    permissions: { keyboard: true, clipboard: false },
    generation: worker.generation,
  });
  expect(value('Remote clipboard text')).toBe('');
  fireEvent.change(screen.getByLabelText('Local text'), {
    target: { value: 'private local text' },
  });
  act(() => worker.onerror?.());
  expect(value('Local text')).toBe('');
  expect(value('Remote clipboard text')).toBe('');
  expect(worker.terminate).toHaveBeenCalledTimes(1);
});

test('worker connection receives only the public profile, never future API extras', async () => {
  mockConfiguration = {
    ...profile,
    unexpectedToken: 'never-forward',
  } as WebClientConfiguration;
  await start();
  const sent = worker.postMessage.mock.calls.find(
    ([m]) => m.type === 'connect',
  )?.[0];
  expect(sent?.profile).toEqual({
    idServerUrl: profile.idServerUrl,
    relayServerUrl: profile.relayServerUrl,
    serverPublicKey: profile.serverPublicKey,
  });
});

test('input revocation explains held-key recovery and blocks text until permission returns', async () => {
  await start();
  fireEvent.change(screen.getByLabelText('Local text'), {
    target: { value: 'Do not send while revoked' },
  });
  const input = screen.getByText('Send text as input') as HTMLButtonElement;
  expect(input.disabled).toBe(false);
  worker.emit({
    type: 'permissions',
    permissions: { keyboard: false, clipboard: true },
    generation: worker.generation,
  });
  expect(
    screen.getByText(/Previously held keys or buttons may remain pressed/),
  ).toBeDefined();
  expect(input.disabled).toBe(true);
  const canvas = screen.getByLabelText(
    'Remote desktop. Focus to send keyboard and mouse input.',
  );
  expect(canvas.tabIndex).toBe(-1);
  const surface = canvas.closest('section');
  if (!surface) throw new Error('Missing fullscreen surface');
  surface.requestFullscreen = jest
    .fn<() => Promise<void>>()
    .mockResolvedValue();
  fireEvent.click(screen.getByText('Fullscreen'));
  expect(surface.requestFullscreen).toHaveBeenCalledTimes(1);
  expect(
    surface.contains(
      screen.getByText(/Previously held keys or buttons may remain pressed/),
    ),
  ).toBe(true);
  const count = worker.postMessage.mock.calls.length;
  fireEvent.click(input);
  expect(worker.postMessage).toHaveBeenCalledTimes(count);
  worker.emit({
    type: 'permissions',
    permissions: { keyboard: true, clipboard: true },
    generation: worker.generation,
  });
  expect(
    screen.queryByText(/Previously held keys or buttons may remain pressed/),
  ).toBeNull();
  expect(input.disabled).toBe(false);
  expect(worker.postMessage).toHaveBeenCalledTimes(count);
});

const legacyNotice =
  'The remote device uses a legacy encryption protocol with known security risks. Upgrade the remote client when possible.';
test('legacy warning survives password submission and login without blocking either', async () => {
  await start();
  worker.emit({
    type: 'state',
    state: 'authenticating',
    generation: worker.generation,
  });
  worker.emit({
    type: 'security',
    kxVersion: 0,
    generation: worker.generation,
  });
  expect(screen.getByText(legacyNotice)).toBeDefined();
  fireEvent.change(screen.getByLabelText('Remote device password'), {
    target: { value: 'synthetic' },
  });
  fireEvent.click(screen.getByText('Send password'));
  expect(worker.postMessage).toHaveBeenLastCalledWith({
    displayGeneration: 0,
    type: 'password',
    password: 'synthetic',
    generation: worker.generation,
  });
  worker.emit({
    type: 'state',
    state: 'connected',
    generation: worker.generation,
  });
  worker.emit({
    type: 'peer',
    peer: { currentDisplay: 0, displays: [{ width: 1920, height: 1080 }] },
    generation: worker.generation,
  });
  expect(screen.getByText(legacyNotice)).toBeDefined();
  const fullscreenSurface = screen
    .getByLabelText('Remote desktop. Focus to send keyboard and mouse input.')
    .closest('section');
  expect(fullscreenSurface?.contains(screen.getByText(legacyNotice))).toBe(
    true,
  );
});

test('disconnect and reconnect suppress old legacy notices and KX 1 has no legacy notice', async () => {
  await start();
  const previous = worker.generation;
  worker.emit({ type: 'security', kxVersion: 0, generation: previous });
  expect(screen.getByText(legacyNotice)).toBeDefined();
  fireEvent.click(screen.getByText('Disconnect'));
  expect(screen.queryByText(legacyNotice)).toBeNull();
  fireEvent.click(screen.getByText('Connect'));
  worker.emit({ type: 'security', kxVersion: 0, generation: previous });
  expect(screen.queryByText(legacyNotice)).toBeNull();
  worker.emit({
    type: 'security',
    kxVersion: 1,
    generation: worker.generation,
  });
  worker.emit({
    type: 'state',
    state: 'connected',
    generation: worker.generation,
  });
  expect(screen.queryByText(legacyNotice)).toBeNull();
});

test.each(['configuration', 'crash', 'failed'] as const)(
  '%s clears the old protocol notice',
  async (reason) => {
    const view = await start();
    const previous = worker;
    const generation = worker.generation;
    worker.emit({ type: 'security', kxVersion: 0, generation });
    expect(screen.getByText(legacyNotice)).toBeDefined();
    if (reason === 'configuration') {
      mockConfiguration = {
        ...profile,
        relayServerUrl: 'wss://example.test/another-relay',
      };
      view.rerender(React.createElement(WebClientPage));
      previous.emit({ type: 'security', kxVersion: 0, generation });
    } else if (reason === 'crash') act(() => worker.onerror?.());
    else worker.emit({ type: 'state', state: 'failed', generation });
    expect(screen.queryByText(legacyNotice)).toBeNull();
  },
);

test('文件会话单独认证并拒绝断开后的目录事件', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'File transfer' }));
  fireEvent.click(screen.getByText('Connect files'));
  const fileGeneration =
    worker.postMessage.mock.calls.at(-1)?.[0].fileGeneration;
  expect(fileGeneration).toBe(1);
  const generation = worker.generation;
  worker.emit({
    type: 'files-state',
    state: 'awaitingApproval',
    fileGeneration,
    generation,
  });
  fireEvent.change(screen.getByLabelText('File session password'), {
    target: { value: 'file-only' },
  });
  fireEvent.click(screen.getByText('Send password'));
  expect(worker.postMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'files-password',
      password: 'file-only',
      fileGeneration,
    }),
  );
  worker.emit({
    type: 'files-state',
    state: 'connected',
    fileGeneration,
    generation,
  });
  worker.emit({
    type: 'files-event',
    event: { type: 'directory', path: 'C:/资料', entries: [] },
    fileGeneration,
    generation,
  });
  expect(value('Remote directory')).toBe('C:/资料');
  fireEvent.click(screen.getByText('Disconnect files'));
  worker.emit({
    type: 'files-state',
    state: 'connected',
    fileGeneration,
    generation,
  });
  worker.emit({
    type: 'files-event',
    event: { type: 'directory', path: 'C:/迟到内容', entries: [] },
    fileGeneration,
    generation,
  });
  expect(screen.queryByLabelText('Remote directory')).toBeNull();
});

test('软键盘显式发送组合文本，并携带当前显示代次', async () => {
  await start();
  worker.emit({
    type: 'peer',
    peer: { displays: [{ width: 800, height: 600 }], currentDisplay: 0 },
    generation: worker.generation,
  });
  worker.emit({
    type: 'frame',
    frame: { displayWidth: 800, displayHeight: 600, close: jest.fn() },
    displayGeneration: 0,
    generation: worker.generation,
  });
  fireEvent.click(screen.getByText('Keyboard'));
  fireEvent.change(screen.getByLabelText('Keyboard text'), {
    target: { value: '中文输入' },
  });
  expect(
    worker.postMessage.mock.calls.some(([message]) => message.type === 'text'),
  ).toBe(false);
  fireEvent.click(screen.getAllByText('Send text')[0]);
  expect(worker.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({
      type: 'text',
      text: '中文输入',
      displayGeneration: 0,
    }),
  );
  expect(value('Keyboard text')).toBe('');
});

test('独立审查：取消旧下载后其迟到写入失败不能取消新下载', async () => {
  let rejectOld: (error: Error) => void = () => {};
  const oldWrite = new Promise<void>((_resolve, reject) => {
    rejectOld = reject;
  });
  const writer = (write: () => Promise<void>) => ({
    write,
    close: async () => {},
    abort: async () => {},
  });
  const oldWriter = writer(() => oldWrite);
  const newWriter = writer(async () => {});
  let picks = 0;
  Object.assign(window, {
    showSaveFilePicker: async () => ({
      createWritable: async () => (++picks === 1 ? oldWriter : newWriter),
    }),
  });
  try {
    await start();
    fireEvent.click(screen.getByRole('button', { name: 'File transfer' }));
    fireEvent.click(screen.getByText('Connect files'));
    const generation = worker.generation;
    const fileGeneration =
      worker.postMessage.mock.calls.at(-1)?.[0].fileGeneration;
    const emit = (event: object) =>
      worker.emit({
        type: 'files-event',
        generation,
        fileGeneration,
        event,
      });
    const progress = (id: number, name: string, phase: string) =>
      emit({
        type: 'progress',
        progress: {
          id,
          name,
          phase,
          total: 1,
          transferred: 0,
          direction: 'download',
        },
      });
    worker.emit({
      type: 'files-state',
      state: 'connected',
      generation,
      fileGeneration,
    });
    emit({
      type: 'directory',
      path: 'C:/',
      entries: ['a.bin', 'b.bin'].map((name) => ({
        name,
        path: `C:/${name}`,
        size: 1,
        directory: false,
      })),
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Download file: a.bin' }),
    );
    await waitFor(() =>
      expect(worker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: expect.objectContaining({ type: 'download', name: 'a.bin' }),
        }),
      ),
    );
    progress(1, 'a.bin', 'waiting');
    emit({ type: 'chunk', id: 1, sequence: 1, bytes: new Uint8Array([1]) });
    fireEvent.click(screen.getByText('Cancel transfer'));
    progress(1, 'a.bin', 'cancelled');
    fireEvent.click(
      screen.getByRole('button', { name: 'Download file: b.bin' }),
    );
    await waitFor(() =>
      expect(worker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: expect.objectContaining({ type: 'download', name: 'b.bin' }),
        }),
      ),
    );
    progress(2, 'b.bin', 'waiting');
    const count = worker.postMessage.mock.calls.length;
    await act(async () => {
      rejectOld(new Error('Old writer rejected after abort'));
      await Promise.resolve();
    });
    expect(worker.postMessage.mock.calls.slice(count)).toEqual([]);
  } finally {
    Reflect.deleteProperty(window, 'showSaveFilePicker');
  }
});

test('独立审查：页面隐藏时释放软键盘修饰键', async () => {
  await start();
  worker.emit({
    type: 'peer',
    peer: { displays: [{ width: 800, height: 600 }], currentDisplay: 0 },
    generation: worker.generation,
  });
  worker.emit({
    type: 'frame',
    frame: { displayWidth: 800, displayHeight: 600, close: jest.fn() },
    displayGeneration: 0,
    generation: worker.generation,
  });
  fireEvent.click(screen.getByRole('button', { name: 'Input controls' }));
  fireEvent.click(screen.getByRole('button', { name: 'Shift' }));
  const down = worker.postMessage.mock.calls.at(-1)?.[0];
  expect(down).toMatchObject({
    type: 'input',
    input: { keyEvent: { down: true } },
  });
  const count = worker.postMessage.mock.calls.length;
  jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  fireEvent(document, new Event('visibilitychange'));
  expect(worker.postMessage.mock.calls.slice(count)).toContainEqual([
    expect.objectContaining({
      type: 'input',
      input: {
        keyEvent: {
          controlKey: hbb.ControlKey.Shift,
          down: false,
        },
      },
    }),
  ]);
});

test('独立审查：旧音频启动失败不能关闭后来启动的播放器', async () => {
  const original = Reflect.get(globalThis, 'AudioContext');
  let rejectOld: (error: Error) => void = () => {};
  const pendingResume = new Promise<void>((_resolve, reject) => {
    rejectOld = reject;
  });
  const contexts: { state: string }[] = [];
  class Context {
    state = 'running';
    currentTime = 0;
    destination = {};
    first: boolean;
    constructor() {
      this.first = contexts.length === 0;
      contexts.push(this);
    }
    async resume() {
      if (this.first) await pendingResume;
    }
    async close() {
      this.state = 'closed';
    }
    createGain() {
      return { gain: { value: 1 }, connect() {}, disconnect() {} };
    }
  }
  Object.assign(globalThis, { AudioContext: Context });
  try {
    await start();
    worker.emit({
      type: 'ready',
      secureContext: true,
      videoDecoder: true,
      audioDecoder: true,
      generation: 0,
    });
    fireEvent.click(screen.getByText('Play audio'));
    fireEvent.click(screen.getByText('Play audio'));
    await waitFor(() => expect(screen.getByText('Stop audio')).toBeTruthy());
    expect(contexts).toHaveLength(2);
    expect(contexts[1].state).toBe('running');
    await act(async () => {
      rejectOld(new Error('Previous resume rejected'));
      await Promise.resolve();
    });
    expect(contexts[1].state).toBe('running');
  } finally {
    Object.assign(globalThis, { AudioContext: original });
  }
});

test('工具面板按需展开，切换和关闭时保留文件会话与画布', async () => {
  await start();
  const desktop = screen.getByLabelText(
    'Remote desktop. Focus to send keyboard and mouse input.',
  );
  expect(screen.queryByRole('button', { name: 'Connect files' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'File transfer' }));
  fireEvent.click(screen.getByRole('button', { name: 'Connect files' }));
  const fileGeneration =
    worker.postMessage.mock.calls.at(-1)?.[0].fileGeneration;
  worker.emit({
    type: 'files-state',
    state: 'connected',
    generation: worker.generation,
    fileGeneration,
  });
  worker.emit({
    type: 'files-event',
    event: { type: 'directory', path: 'C:/测试资料', entries: [] },
    generation: worker.generation,
    fileGeneration,
  });
  const count = worker.postMessage.mock.calls.length;
  fireEvent.click(screen.getByRole('button', { name: 'Clipboard' }));
  expect(screen.queryByRole('button', { name: 'Disconnect files' })).toBeNull();
  worker.emit({
    type: 'files-event',
    event: { type: 'directory', path: 'C:/后台更新', entries: [] },
    generation: worker.generation,
    fileGeneration,
  });
  fireEvent.click(screen.getByRole('button', { name: 'File transfer' }));
  expect(value('Remote directory')).toBe('C:/后台更新');
  expect(worker.postMessage.mock.calls.slice(count)).toEqual([]);
  expect(
    screen.getByLabelText(
      'Remote desktop. Focus to send keyboard and mouse input.',
    ),
  ).toBe(desktop);
  fireEvent.click(screen.getByRole('button', { name: 'Close tools' }));
  expect(screen.queryByRole('button', { name: 'Disconnect files' })).toBeNull();
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'File transfer' }),
  );
  expect(worker.postMessage.mock.calls.slice(count)).toEqual([]);
});

test('收起输入工具释放修饰键，隐藏区域不暴露可操作按钮', async () => {
  await start();
  worker.emit({
    type: 'peer',
    peer: { displays: [{ width: 800, height: 600 }], currentDisplay: 0 },
    generation: worker.generation,
  });
  worker.emit({
    type: 'frame',
    frame: { displayWidth: 800, displayHeight: 600, close: jest.fn() },
    displayGeneration: 0,
    generation: worker.generation,
  });
  fireEvent.click(screen.getByRole('button', { name: 'Input controls' }));
  fireEvent.click(screen.getByRole('button', { name: 'Control' }));
  const count = worker.postMessage.mock.calls.length;
  fireEvent.click(screen.getByRole('button', { name: 'Close tools' }));
  expect(worker.postMessage.mock.calls.slice(count)).toContainEqual([
    expect.objectContaining({
      type: 'input',
      input: { keyEvent: { controlKey: hbb.ControlKey.Control, down: false } },
    }),
  ]);
  expect(screen.queryByRole('button', { name: 'Control' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Input controls' }));
  expect(
    screen
      .getByRole('button', { name: 'Control' })
      .getAttribute('aria-pressed'),
  ).toBe('false');
});

test('文件面板隐藏时仍显示旧协议提醒和文件错误', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'File transfer' }));
  fireEvent.click(screen.getByRole('button', { name: 'Connect files' }));
  const fileGeneration =
    worker.postMessage.mock.calls.at(-1)?.[0].fileGeneration;
  worker.emit({
    type: 'files-security',
    kxVersion: 0,
    generation: worker.generation,
    fileGeneration,
  });
  fireEvent.click(screen.getByRole('button', { name: 'Close tools' }));
  const visibleNotices = screen
    .getAllByText(legacyNotice)
    .filter((element) => !element.closest('[hidden]'));
  expect(visibleNotices).toHaveLength(1);
  worker.emit({
    type: 'files-error',
    code: 'files',
    generation: worker.generation,
    fileGeneration,
  });
  expect(
    screen
      .getAllByText(
        'File operation failed or was denied. Retry the file session.',
      )
      .some((element) => !element.closest('[hidden]')),
  ).toBe(true);
});

test('全屏容器包括连接栏、工具面板与断开按钮', async () => {
  await start();
  const surface = screen.getByLabelText('Web Client');
  const requestFullscreen = jest.fn<() => Promise<void>>().mockResolvedValue();
  Object.assign(surface, { requestFullscreen });
  fireEvent.click(screen.getByRole('button', { name: 'Fullscreen' }));
  expect(requestFullscreen).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'File transfer' }));
  expect(
    surface.contains(screen.getByRole('button', { name: 'Close tools' })),
  ).toBe(true);
  expect(surface.contains(screen.getByText('Disconnect'))).toBe(true);
});
