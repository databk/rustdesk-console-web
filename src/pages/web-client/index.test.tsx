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
    Switch: ({
      checked,
      onChange,
      size: _size,
      ...props
    }: {
      checked: boolean;
      onChange: (checked: boolean) => void;
      size?: string;
    }) =>
      React.createElement('button', {
        ...props,
        role: 'switch',
        'aria-checked': checked,
        onClick: () => onChange(!checked),
      }),
    Typography: { Paragraph: Box, Text: Box },
    Button: ({
      children,
      type: _type,
      danger: _danger,
      icon: _icon,
      block: _block,
      ...props
    }: ButtonProps & { danger?: boolean; icon?: unknown; block?: boolean }) =>
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
  emit(message: {
    type?: string;
    clipboardGeneration?: number;
    [key: string]: unknown;
  }) {
    if (
      (message.type === 'clipboard' || message.type === 'image') &&
      message.clipboardGeneration === undefined
    ) {
      message = {
        ...message,
        clipboardGeneration: Number(
          this.postMessage.mock.calls
            .filter(([m]) => m.type === 'clipboard-context')
            .at(-1)?.[0].clipboardGeneration ?? 0,
        ),
      };
    }
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
  jest.spyOn(document, 'hasFocus').mockReturnValue(true);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: jest.fn<() => Promise<void>>().mockResolvedValue(),
      write: jest.fn<() => Promise<void>>().mockResolvedValue(),
    },
  });
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
  fireEvent.click(screen.getByRole('button', { name: 'Show session menu' }));
  return view;
}
function openTool(name: string) {
  const launcher = screen.getByRole('button', { name: 'Show session menu' });
  if (launcher.getAttribute('aria-expanded') === 'false')
    fireEvent.click(launcher);
  fireEvent.click(
    screen.getByRole('button', {
      name: name === 'Input controls' ? 'Keyboard' : name,
    }),
  );
}
function hideFiles() {
  fireEvent.click(screen.getByRole('button', { name: 'Minimize file window' }));
}
function downloadFile(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Download selected file' }),
  );
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
  fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
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
    screen.getByText('Paste failed. Check the content and try again.'),
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

test('断开和重连拒绝旧剪贴板与帧，并移除剪贴板中转界面', async () => {
  await start();
  const previous = worker.generation;
  fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
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
  expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Connect'));
  worker.emit({
    type: 'clipboard',
    text: 'still obsolete',
    generation: previous,
  });
  worker.emit({
    type: 'state',
    state: 'connected',
    generation: worker.generation,
  });
  worker.emit({
    type: 'clipboard',
    text: 'current text',
    generation: worker.generation,
  });
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('current text');
  expect(screen.queryByLabelText('Remote clipboard text')).toBeNull();
  expect(screen.queryByLabelText('Local text')).toBeNull();
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
  expect(screen.queryByLabelText('Local text')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Click to copy' })).toBeNull();
  worker.emit({
    type: 'state',
    state: 'awaitingApproval',
    generation: old.generation,
  });
  expect(value('Remote device password')).toBe('');
});

test('Worker失败和撤销剪贴板权限清理复制回退并拒绝迟到内容', async () => {
  await start();
  jest
    .mocked(navigator.clipboard.writeText)
    .mockRejectedValue(new Error('blocked'));
  worker.emit({
    type: 'clipboard',
    text: 'private remote text',
    generation: worker.generation,
  });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Click to copy' })).toBeTruthy(),
  );
  worker.emit({
    type: 'permissions',
    permissions: { keyboard: true, clipboard: false },
    generation: worker.generation,
  });
  expect(screen.queryByRole('button', { name: 'Click to copy' })).toBeNull();
  const count = jest.mocked(navigator.clipboard.writeText).mock.calls.length;
  worker.emit({
    type: 'clipboard',
    text: 'revoked',
    generation: worker.generation,
  });
  expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(count);
  act(() => worker.onerror?.());
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

test('输入撤权阻止软键盘，并在全屏容器保留卡键恢复说明', async () => {
  await readyDesktop();
  openTool('Input controls');
  fireEvent.click(screen.getByText('Keyboard', { selector: 'button' }));
  fireEvent.change(screen.getByLabelText('Keyboard text'), {
    target: { value: 'Do not send while revoked' },
  });
  const button = screen.getByText('Send text') as HTMLButtonElement;
  worker.emit({
    type: 'permissions',
    permissions: { keyboard: false, clipboard: true },
    generation: worker.generation,
  });
  expect(button.disabled).toBe(true);
  const canvas = screen.getByLabelText(
    'Remote desktop. Focus to send keyboard and mouse input.',
  );
  expect(canvas.tabIndex).toBe(-1);
  expect(
    canvas
      .closest('section')
      ?.contains(
        screen.getByText(/Previously held keys or buttons may remain pressed/),
      ),
  ).toBe(true);
  const count = worker.postMessage.mock.calls.length;
  fireEvent.click(button);
  expect(worker.postMessage).toHaveBeenCalledTimes(count);
  worker.emit({
    type: 'permissions',
    permissions: { keyboard: true, clipboard: true },
    generation: worker.generation,
  });
  expect(button.disabled).toBe(false);
});

const legacyNotice = 'Legacy encryption';
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
  fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
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
  openTool('File transfer');
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
  openTool('Input controls');
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
    openTool('File transfer');
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
    downloadFile('a.bin');
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
    downloadFile('b.bin');
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
  openTool('Input controls');
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
    openTool('Audio');
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

test('文件窗口收起保持文件会话、目录和画布；菜单切换不触发断开', async () => {
  const desktop = await readyDesktop();
  openTool('File transfer');
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
  hideFiles();
  expect(screen.queryByRole('button', { name: 'Disconnect files' })).toBeNull();
  expect(document.activeElement).toBe(desktop);
  worker.emit({
    type: 'files-event',
    event: { type: 'directory', path: 'C:/后台更新', entries: [] },
    generation: worker.generation,
    fileGeneration,
  });
  const count = worker.postMessage.mock.calls.length;
  openTool('Audio');
  openTool('File transfer');
  expect(value('Remote directory')).toBe('C:/后台更新');
  expect(
    screen.getByLabelText(
      'Remote desktop. Focus to send keyboard and mouse input.',
    ),
  ).toBe(desktop);
  expect(
    worker.postMessage.mock.calls
      .slice(count)
      .some(([m]) =>
        ['disconnect', 'files-disconnect', 'files-connect'].includes(m.type),
      ),
  ).toBe(false);
});

test('关闭键盘菜单释放修饰键且隐藏内容不能操作', async () => {
  const desktop = await readyDesktop();
  openTool('Input controls');
  fireEvent.click(screen.getByRole('button', { name: 'Control' }));
  const count = worker.postMessage.mock.calls.length;
  fireEvent.keyDown(screen.getByRole('button', { name: 'Control' }), {
    key: 'Escape',
  });
  expect(worker.postMessage.mock.calls.slice(count)).toContainEqual([
    expect.objectContaining({
      type: 'input',
      input: { keyEvent: { controlKey: hbb.ControlKey.Control, down: false } },
    }),
  ]);
  expect(screen.queryByRole('button', { name: 'Control' })).toBeNull();
  openTool('Input controls');
  expect(
    screen
      .getByRole('button', { name: 'Control' })
      .getAttribute('aria-pressed'),
  ).toBe('false');
  expect(desktop).toBeTruthy();
});

test('文件窗口隐藏后仍显示属于文件会话的旧协议与错误', async () => {
  await start();
  openTool('File transfer');
  fireEvent.click(screen.getByText('Connect files'));
  const fileGeneration =
    worker.postMessage.mock.calls.at(-1)?.[0].fileGeneration;
  worker.emit({
    type: 'files-security',
    kxVersion: 0,
    generation: worker.generation,
    fileGeneration,
  });
  hideFiles();
  const warning = screen.getByRole('button', {
    name: 'File connection: legacy encryption',
  });
  fireEvent.click(warning);
  expect(
    screen
      .getAllByText(/RustDesk 1.4.9 still uses this exchange/)
      .some((e) => !e.closest('[hidden]')),
  ).toBe(true);
  expect(
    screen.queryByRole('button', { name: 'Legacy encryption' }),
  ).toBeNull();
  worker.emit({
    type: 'files-error',
    code: 'files',
    generation: worker.generation,
    fileGeneration,
  });
  expect(screen.getByRole('button', { name: 'Session notices' })).toBeTruthy();
});

test('全屏目标包含顶部菜单和文件浮窗，打开浮窗不改变canvas节点', async () => {
  const desktop = await readyDesktop();
  const surface = screen.getByLabelText('Web Client');
  const requestFullscreen = jest.fn<() => Promise<void>>().mockResolvedValue();
  Object.assign(surface, { requestFullscreen });
  fireEvent.click(screen.getByRole('button', { name: 'Fullscreen' }));
  expect(requestFullscreen).toHaveBeenCalledTimes(1);
  openTool('File transfer');
  expect(surface.contains(screen.getByRole('dialog'))).toBe(true);
  expect(
    surface.contains(screen.getByRole('button', { name: 'Disconnect' })),
  ).toBe(true);
  expect(
    screen.getByLabelText(
      'Remote desktop. Focus to send keyboard and mouse input.',
    ),
  ).toBe(desktop);
});

test('未连接只显示两列设备选择，输入与设备列表独立', () => {
  render(React.createElement(WebClientPage));
  const selection = document.querySelector('[data-device-selection]');
  expect(selection?.hasAttribute('hidden')).toBe(false);
  expect(
    document.querySelector('[data-workspace]')?.hasAttribute('hidden'),
  ).toBe(true);
  expect(selection?.contains(screen.getByLabelText('Remote ID'))).toBe(true);
  expect(
    selection?.contains(
      screen.getByRole('region', { name: 'Accessible devices' }),
    ),
  ).toBe(true);
  fireEvent.change(screen.getByLabelText('Remote ID'), {
    target: { value: '987654321' },
  });
  expect(
    screen.getByRole('region', { name: 'Accessible devices' }),
  ).toBeTruthy();
  expect(
    screen.queryByRole('button', { name: 'Show session menu' }),
  ).toBeNull();
});

test('全屏中的会话断开后仍可通过按钮退出全屏', async () => {
  await start();
  const surface = screen.getByLabelText('Web Client');
  const original = Object.getOwnPropertyDescriptor(
    document,
    'fullscreenElement',
  );
  const exitFullscreen = jest.fn<() => Promise<void>>().mockResolvedValue();
  const originalExit = Object.getOwnPropertyDescriptor(
    document,
    'exitFullscreen',
  );
  try {
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: surface,
    });
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: exitFullscreen,
    });
    act(() => document.dispatchEvent(new Event('fullscreenchange')));
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
    const exit = screen.getByRole('button', { name: 'Exit fullscreen' });
    expect((exit as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(exit);
    expect(exitFullscreen).toHaveBeenCalledTimes(1);
  } finally {
    if (original)
      Object.defineProperty(document, 'fullscreenElement', original);
    else Reflect.deleteProperty(document, 'fullscreenElement');
    if (originalExit)
      Object.defineProperty(document, 'exitFullscreen', originalExit);
    else Reflect.deleteProperty(document, 'exitFullscreen');
  }
});

test('菜单切换与固定不重建canvas，不包含侧栏或剪贴板入口', async () => {
  const desktop = await readyDesktop();
  const count = worker.postMessage.mock.calls.length;
  openTool('Display');
  fireEvent.click(screen.getByRole('button', { name: 'Pin menu' }));
  expect(screen.getByRole('button', { name: 'Unpin menu' })).toBeTruthy();
  openTool('Audio');
  expect(
    screen.getByLabelText(
      'Remote desktop. Focus to send keyboard and mouse input.',
    ),
  ).toBe(desktop);
  expect(screen.queryByRole('button', { name: 'Clipboard' })).toBeNull();
  expect(document.querySelector('[data-sidebar-mode]')).toBeNull();
  expect(
    worker.postMessage.mock.calls
      .slice(count)
      .some(([m]) => m.type === 'disconnect'),
  ).toBe(false);
});

test('顶部菜单按钮支持方向键、Home和End导航', async () => {
  await start();
  const pin = screen.getByRole('button', { name: 'Pin menu' });
  fireEvent.keyDown(pin, { key: 'ArrowRight' });
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Display' }),
  );
  fireEvent.keyDown(screen.getByRole('button', { name: 'Display' }), {
    key: 'End',
  });
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Disconnect' }),
  );
  fireEvent.keyDown(screen.getByRole('button', { name: 'Disconnect' }), {
    key: 'Home',
  });
  expect(document.activeElement).toBe(pin);
});

test('连接时锁定页面滚动，断开恢复原滚动设置', async () => {
  const previous = document.body.style.overflow;
  document.body.style.overflow = 'auto';
  try {
    await start();
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
    expect(document.body.style.overflow).toBe('auto');
    expect(
      document.querySelector('[data-device-selection]')?.hasAttribute('hidden'),
    ).toBe(false);
  } finally {
    document.body.style.overflow = previous;
  }
});

test('Escape只关闭菜单，不劫持远端canvas的Escape', async () => {
  const desktop = await readyDesktop();
  openTool('Input controls');
  fireEvent.keyDown(desktop, { key: 'Escape' });
  expect(screen.getByRole('button', { name: 'Control' })).toBeTruthy();
  fireEvent.keyDown(screen.getByRole('button', { name: 'Control' }), {
    key: 'Escape',
  });
  expect(screen.queryByRole('button', { name: 'Control' })).toBeNull();
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Show session menu' }),
  );
});

test('旧协议说明包含风险、已验证nightly与日期，不根据版本字符串隐藏', async () => {
  await start();
  worker.emit({
    type: 'security',
    kxVersion: 0,
    generation: worker.generation,
  });
  worker.emit({
    type: 'peer',
    peer: { version: '1.5.0', displays: [{ width: 800, height: 600 }] },
    generation: worker.generation,
  });
  const badge = screen.getByRole('button', { name: 'Legacy encryption' });
  fireEvent.focus(badge);
  expect(
    screen.getByText(/key and nonce reuse/).closest('[hidden]'),
  ).toBeNull();
  expect(screen.getByText(/specific official 1.5.0 nightly/)).toBeTruthy();
  expect(screen.getByText(/Verified 2026-09-30/)).toBeTruthy();
  expect(screen.getByText('Remote client: 1.5.0')).toBeTruthy();
});

test('目录编辑与已加载路径分离，失败时上传仍使用原目录', async () => {
  await start();
  openTool('File transfer');
  fireEvent.click(screen.getByText('Connect files'));
  const fileGeneration =
    worker.postMessage.mock.calls.at(-1)?.[0].fileGeneration;
  const emit = (event: object) =>
    worker.emit({
      type: 'files-event',
      generation: worker.generation,
      fileGeneration,
      event,
    });
  worker.emit({
    type: 'files-state',
    state: 'connected',
    generation: worker.generation,
    fileGeneration,
  });
  emit({
    type: 'directory',
    path: 'C:/Valid',
    entries: [
      { name: 'Folder', path: 'C:/Valid/Folder', directory: true, size: 0 },
    ],
  });
  fireEvent.change(screen.getByLabelText('Remote directory'), {
    target: { value: 'C:/Missing' },
  });
  fireEvent.keyDown(screen.getByLabelText('Remote directory'), {
    key: 'Enter',
  });
  expect(worker.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({ command: { type: 'list', path: 'C:/Missing' } }),
  );
  emit({ type: 'error', code: 'files' });
  expect(value('Remote directory')).toBe('C:/Missing');
  const file = new File(['upload'], 'a.txt');
  fireEvent.change(screen.getByLabelText('Upload to this folder'), {
    target: { files: [file] },
  });
  expect(worker.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({
      command: { type: 'upload', path: 'C:/Valid', files: [file] },
    }),
  );
  const before = worker.postMessage.mock.calls.length;
  fireEvent.click(screen.getByRole('button', { name: 'Folder' }));
  expect(worker.postMessage.mock.calls.length).toBe(before);
  fireEvent.doubleClick(screen.getByRole('button', { name: 'Folder' }));
  expect(worker.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({
      command: { type: 'list', path: 'C:/Valid/Folder' },
    }),
  );
});
test('单击文件只选中，下载必须通过明确按钮启动', async () => {
  await start();
  openTool('File transfer');
  fireEvent.click(screen.getByText('Connect files'));
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
    generation: worker.generation,
    fileGeneration,
    event: {
      type: 'directory',
      path: 'C:/',
      entries: [
        { name: 'file.bin', path: 'C:/file.bin', size: 1, directory: false },
      ],
    },
  });
  fireEvent.click(screen.getByRole('button', { name: 'file.bin' }));
  expect(
    worker.postMessage.mock.calls.some(
      ([m]) =>
        (m.command as { type?: string } | undefined)?.type === 'download',
    ),
  ).toBe(false);
  expect(
    (
      screen.getByRole('button', {
        name: 'Download selected file',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
});
test('窗口失焦后再聚焦也拒绝旧Worker剪贴板代次和图片', async () => {
  await start();
  const oldEpoch = worker.postMessage.mock.calls
    .filter(([m]) => m.type === 'clipboard-context')
    .at(-1)?.[0].clipboardGeneration as number;
  fireEvent(window, new Event('blur'));
  worker.emit({
    type: 'clipboard',
    text: 'old conversion',
    generation: worker.generation,
    clipboardGeneration: oldEpoch,
  });
  worker.emit({
    type: 'image',
    bytes: new Uint8Array([1, 2]),
    generation: worker.generation,
    clipboardGeneration: oldEpoch,
  });
  expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  expect(navigator.clipboard.write).not.toHaveBeenCalled();
  worker.emit({
    type: 'clipboard',
    text: 'fresh',
    generation: worker.generation,
  });
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('fresh');
});
