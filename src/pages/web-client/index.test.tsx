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
import { AudioPlayer } from '@/features/web-client/media/audio-player';
import { Microphone } from '@/features/web-client/media/microphone';

type WebClientConfiguration =
  import('@/services/rustdesk-console/webClient').WebClientConfiguration;
type Children = import('react').PropsWithChildren;
type ReactNode = import('react').ReactNode;
type InputMessage = Parameters<
  ConstructorParameters<
    typeof import('@/features/web-client/input/input').RemoteInput
  >[2]
>[0];
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
let mockAccount: string | undefined;
let mockOwner: { guid: string } | undefined;
function mockCurrentUser() {
  if (!mockAccount) return undefined;
  if (mockOwner?.guid !== mockAccount) mockOwner = { guid: mockAccount };
  return mockOwner;
}
let mockPermissions = ['web_client.connect', 'web_client.file_transfer'];
const mockGrant = () => ({
  sessionGuid: 'desktop-grant',
  gatewayPath: '/api/web-client/socket',
  tickets: { rendezvous: 'ticket-r', relay: 'ticket-l' },
  expiresAt: new Date(Date.now() + 60000).toISOString(),
});
const mockAuthorize =
  jest.fn<(...args: unknown[]) => Promise<ReturnType<typeof mockGrant>>>();
const mockFileAuthorize =
  jest.fn<(...args: unknown[]) => Promise<ReturnType<typeof mockGrant>>>();
const mockEnd = jest.fn<(...args: unknown[]) => Promise<unknown>>();
jest.mock('@/services/rustdesk-console/webClient', () => ({
  getWebClientDevices: async () => ({ data: [], total: 0 }),
  createWebClientSession: (...args: unknown[]) => mockAuthorize(...args),
  createWebClientFileSession: (...args: unknown[]) =>
    mockFileAuthorize(...args),
  endWebClientSession: (...args: unknown[]) => mockEnd(...args),
  reportWebClientEvent: async () => ({ accepted: true }),
  webClientHttpStatus: (error: { response?: { status?: number } }) =>
    error?.response?.status,
  handleWebClientAuthError: jest.fn(),
}));
const mockCreateWorker = jest.fn<() => Promise<Worker>>();
const mockDraw = jest.fn();
const mockClear = jest.fn();
const mockRemoteInputRelease = jest.fn<() => void>();
let mockDelayModalClose = false;
let mockFinishModalClose: (() => void) | undefined;
let mockTranslations: Record<string, string> = {};
jest.mock('@umijs/max', () => ({
  useIntl: () => ({
    formatMessage: ({
      id,
      defaultMessage,
    }: {
      id: string;
      defaultMessage: string;
    }) => mockTranslations[id] ?? defaultMessage,
  }),
  useLocation: () => ({ search: '?id=123456789' }),
  useModel: (name: string) =>
    name === '@@initialState'
      ? {
          initialState: {
            currentUser: mockCurrentUser(),
            permissions: { permissions: mockPermissions, scopes: {} },
          },
        }
      : {
          configuration: mockConfiguration,
          loading: false,
          unavailable: false,
          reload: jest.fn(),
        },
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
  const Modal = ({
    open,
    title,
    children,
    footer,
    onCancel,
    afterClose,
    afterOpenChange,
  }: Children & {
    open: boolean;
    title: ReactNode;
    footer: ReactNode;
    onCancel?: () => void;
    afterClose?: () => void;
    afterOpenChange?: (open: boolean) => void;
  }) => {
    const opened = React.useRef(false);
    React.useEffect(() => {
      if (open) {
        opened.current = true;
        afterOpenChange?.(true);
      } else if (opened.current) {
        opened.current = false;
        if (mockDelayModalClose) mockFinishModalClose = afterClose;
        else afterClose?.();
      }
    }, [open]);
    return open
      ? React.createElement(
          'div',
          {
            role: 'dialog',
            'aria-modal': true,
            'aria-label': title,
            onKeyDown: (event: KeyboardEvent) => {
              if (event.key === 'Escape') onCancel?.();
            },
          },
          children,
          footer,
        )
      : null;
  };
  return {
    theme: { useToken: () => ({ token: {} }) },
    Card: Box,
    Space: Box,
    Tag: Box,
    Spin: Box,
    Popover: Box,
    Modal,
    Checkbox: ({ children, ...props }: InputProps & Children) =>
      React.createElement(
        'label',
        null,
        React.createElement('input', { ...props, type: 'checkbox' }),
        children,
      ),
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
    release() {
      mockRemoteInputRelease();
    }
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

test('没有专用角色权限时不创建Worker或申请连接，即使已有profile', async () => {
  mockPermissions = ['devices.view'];
  render(React.createElement(WebClientPage));
  await act(async () => {});
  expect(
    screen.getByText('Ask an administrator for Web Client permission.'),
  ).toBeTruthy();
  expect(mockAuthorize).not.toHaveBeenCalled();
  expect(mockCreateWorker).not.toHaveBeenCalled();
});

test('授权等待期间取消，迟到grant结束服务器会话而不启动Worker连接', async () => {
  let resolve!: (value: ReturnType<typeof mockGrant>) => void;
  mockAuthorize.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  render(React.createElement(WebClientPage));
  await waitFor(() => expect(worker.onmessage).toBeDefined());
  worker.emit({
    type: 'ready',
    secureContext: true,
    videoDecoder: true,
    generation: 0,
  });
  fireEvent.click(screen.getByText('Connect'));
  expect(mockAuthorize).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel connection' }));
  await act(async () => resolve(mockGrant()));
  expect(mockEnd).toHaveBeenCalledWith('desktop-grant');
  expect(
    worker.postMessage.mock.calls.some(
      ([message]) => message.type === 'connect',
    ),
  ).toBe(false);
});

test('同一授权申请期间重复连接只申请一次，账号切换后迟到grant不可连接', async () => {
  let resolve!: (value: ReturnType<typeof mockGrant>) => void;
  mockAuthorize.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const view = render(React.createElement(WebClientPage));
  await waitFor(() => expect(worker.onmessage).toBeDefined());
  worker.emit({
    type: 'ready',
    secureContext: true,
    videoDecoder: true,
    generation: 0,
  });
  const connect = screen.getByText('Connect');
  act(() => {
    fireEvent.click(connect);
    fireEvent.click(connect);
  });
  expect(mockAuthorize).toHaveBeenCalledTimes(1);
  mockAccount = 'second-account';
  view.rerender(React.createElement(WebClientPage));
  await act(async () => resolve(mockGrant()));
  expect(mockEnd).toHaveBeenCalledWith('desktop-grant');
  expect(
    worker.postMessage.mock.calls.some(
      ([message]) => message.type === 'connect',
    ),
  ).toBe(false);
});

test('服务端拒绝目标时显示授权错误，不打开原生连接', async () => {
  mockAuthorize.mockRejectedValueOnce({ response: { status: 403 } });
  render(React.createElement(WebClientPage));
  await waitFor(() => expect(worker.onmessage).toBeDefined());
  worker.emit({
    type: 'ready',
    secureContext: true,
    videoDecoder: true,
    generation: 0,
  });
  await act(async () => {
    fireEvent.click(screen.getByText('Connect'));
  });
  expect(
    worker.postMessage.mock.calls.some(
      ([message]) => message.type === 'connect',
    ),
  ).toBe(false);
  expect(document.querySelector('[data-session-state="failed"]')).toBeTruthy();
});
beforeEach(() => {
  mockConfiguration = profile;
  mockAccount = 'fixture-account';
  mockPermissions = ['web_client.connect', 'web_client.file_transfer'];
  mockAuthorize.mockReset().mockResolvedValue(mockGrant());
  mockFileAuthorize
    .mockReset()
    .mockResolvedValue({ ...mockGrant(), sessionGuid: 'file-grant' });
  mockEnd.mockReset().mockResolvedValue({ ended: true });
  worker = new TestWorker();
  mockCreateWorker.mockReset().mockResolvedValue(worker as unknown as Worker);
  mockDraw.mockClear();
  mockClear.mockClear();
  mockRemoteInputRelease.mockReset();
  mockDelayModalClose = false;
  mockFinishModalClose = undefined;
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
  mockTranslations = {};
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
  await act(async () => {
    fireEvent.click(screen.getByText('Connect'));
  });
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
      name: ['Input controls', 'Keyboard'].includes(name)
        ? 'Keyboard and mouse'
        : name,
    }),
  );
}
async function openFileTool() {
  openTool('File transfer');
  await act(async () => {});
}
function openKeyboard(tab: 'keys' | 'text' = 'keys') {
  if (!screen.queryByRole('button', { name: 'Screen keyboard' }))
    openTool('Keyboard');
  fireEvent.click(screen.getByRole('button', { name: 'Screen keyboard' }));
  if (tab === 'text')
    fireEvent.click(screen.getByRole('tab', { name: 'Text input' }));
}
function mode(viewOnly: boolean) {
  const session = screen.getByRole('button', { name: 'Session' });
  if (session.getAttribute('aria-pressed') !== 'true') openTool('Session');
  fireEvent.click(
    screen.getByRole('button', { name: viewOnly ? 'View only' : 'Control' }),
  );
}
function hideFiles() {
  fireEvent.click(screen.getByRole('button', { name: 'Minimize file window' }));
}
function downloadFile(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Save to this computer' }),
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

function guideKey(
  desktop: HTMLElement,
  keys: KeyboardEventInit = { code: 'KeyT', key: 't', ctrlKey: true },
) {
  act(() => desktop.focus());
  const event = new window.KeyboardEvent('keydown', {
    ...keys,
    bubbles: true,
    cancelable: true,
  });
  fireEvent(desktop, event);
  return event;
}
test('非全屏快捷键引导只提示一次、消费触发组合并释放已发修饰和待粘贴；关闭后不重放', async () => {
  const desktop = (await readyDesktop()) as HTMLCanvasElement;
  const actual = jest.requireActual<
    typeof import('@/features/web-client/input/input')
  >('@/features/web-client/input/input');
  const sent: InputMessage[] = [];
  const native = new actual.RemoteInput(
    desktop,
    { x: 0, y: 0, width: 800, height: 600 },
    (message) => sent.push(message),
  );
  mockRemoteInputRelease.mockImplementation(native.release);
  try {
    guideKey(desktop, { code: 'ControlLeft', key: 'Control', ctrlKey: true });
    const event = guideKey(desktop);
    expect(event.defaultPrevented).toBe(true);
    const dialog = screen.getByRole('dialog', {
      name: 'Use shortcuts in fullscreen',
    });
    expect(screen.getByLabelText('Web Client').contains(dialog)).toBe(true);
    expect(screen.getByText('Shown once per connection.')).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Close' }),
    );
    expect(sent.map((message) => message.keyEvent)).toMatchObject([
      { controlKey: hbb.ControlKey.Control, down: true },
      { controlKey: hbb.ControlKey.Control, down: false },
    ]);
    expect(worker.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'cancel-paste' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(desktop);
    // 被消费的T松开不发送；下一次明确按下正常转发，而非自动补放。
    fireEvent.keyUp(desktop, { code: 'KeyT', key: 't', ctrlKey: true });
    expect(sent).toHaveLength(2);
    guideKey(desktop);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(sent.at(-1)?.keyEvent).toMatchObject({ chr: 116, down: true });
  } finally {
    native.dispose();
  }
});

test('引导关闭后切屏和权限/输入实例重建不重置，新连接才再次提示', async () => {
  let desktop = await readyDesktop();
  guideKey(desktop, { code: 'F5', key: 'F5' });
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  worker.emit({
    type: 'peer',
    peer: { displays: [{ width: 1024, height: 768 }], currentDisplay: 0 },
    generation: worker.generation,
  });
  worker.emit({
    type: 'permissions',
    permissions: { keyboard: false, clipboard: true, audio: true, file: true },
    generation: worker.generation,
  });
  worker.emit({
    type: 'permissions',
    permissions: { keyboard: true, clipboard: true, audio: true, file: true },
    generation: worker.generation,
  });
  guideKey(desktop, { code: 'F5', key: 'F5' });
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
  });
  worker.emit({
    type: 'state',
    state: 'connected',
    generation: worker.generation,
  });
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
  desktop = screen.getByLabelText(
    'Remote desktop. Focus to send keyboard and mouse input.',
  );
  guideKey(desktop, { code: 'F5', key: 'F5' });
  expect(
    screen.getByRole('dialog', { name: 'Use shortcuts in fullscreen' }),
  ).toBeTruthy();
});

test('只读、未就绪和已工作区全屏不提示；表单、输入法和普通剪贴板不受引导影响', async () => {
  await start();
  const desktop = screen.getByLabelText(
    'Remote desktop. Focus to send keyboard and mouse input.',
  );
  guideKey(desktop);
  expect(screen.queryByRole('dialog')).toBeNull();
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
  for (const keys of [
    { code: 'KeyC', key: 'c', ctrlKey: true },
    { code: 'KeyX', key: 'x', ctrlKey: true },
    { code: 'KeyV', key: 'v', ctrlKey: true },
    { code: 'Insert', key: 'Insert', shiftKey: true },
    { code: 'KeyA', key: 'A', shiftKey: true },
    { code: 'KeyT', key: 't', ctrlKey: true, isComposing: true },
    { code: 'KeyT', key: 't', ctrlKey: true, repeat: true },
  ])
    expect(guideKey(desktop, keys).defaultPrevented).toBe(false);
  const altGraph = new window.KeyboardEvent('keydown', {
    code: 'KeyS',
    key: 'ß',
    ctrlKey: true,
    altKey: true,
    bubbles: true,
  });
  Object.defineProperty(altGraph, 'getModifierState', {
    value: (name: string) => name === 'AltGraph',
  });
  fireEvent(desktop, altGraph);
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.paste(desktop, {
    clipboardData: { items: [], getData: () => 'clipboard preserved' },
  });
  expect(worker.postMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'paste',
      content: { text: 'clipboard preserved' },
    }),
  );
  for (const name of ['password', 'remote path', 'chat', 'quality']) {
    const field = document.createElement('input');
    field.setAttribute('aria-label', name);
    document.body.append(field);
    act(() => field.focus());
    fireEvent.keyDown(field, { code: 'KeyT', key: 't', ctrlKey: true });
    expect(screen.queryByRole('dialog')).toBeNull();
    field.remove();
  }
  worker.emit({
    type: 'permissions',
    permissions: { keyboard: false, clipboard: true, audio: true, file: true },
    generation: worker.generation,
  });
  guideKey(desktop);
  expect(screen.queryByRole('dialog')).toBeNull();
  worker.emit({
    type: 'permissions',
    permissions: { keyboard: true, clipboard: true, audio: true, file: true },
    generation: worker.generation,
  });
  const original = Object.getOwnPropertyDescriptor(
    document,
    'fullscreenElement',
  );
  try {
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: screen.getByLabelText('Web Client'),
    });
    guideKey(desktop);
    expect(screen.queryByRole('dialog')).toBeNull();
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: null,
    });
    guideKey(desktop);
    expect(screen.getByRole('dialog')).toBeTruthy();
  } finally {
    if (original)
      Object.defineProperty(document, 'fullscreenElement', original);
    else Reflect.deleteProperty(document, 'fullscreenElement');
  }
});

test.each(['closed', 'failed', 'revoked', 'account', 'configuration'])(
  '引导遇到%s立即清理；旧全屏按钮不能作用于新会话',
  async (action) => {
    const view = await start();
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
    const desktop = screen.getByLabelText(
      'Remote desktop. Focus to send keyboard and mouse input.',
    );
    guideKey(desktop);
    const oldButton = screen.getByRole('button', { name: 'Go fullscreen' });
    const surface = screen.getByLabelText('Web Client');
    surface.requestFullscreen = jest
      .fn<() => Promise<void>>()
      .mockResolvedValue();
    if (action === 'revoked')
      worker.emit({
        type: 'permissions',
        permissions: {
          keyboard: false,
          clipboard: true,
          audio: true,
          file: true,
        },
        generation: worker.generation,
      });
    else if (action === 'account') {
      mockAccount = 'another-fixture-account';
      view.rerender(React.createElement(WebClientPage));
    } else if (action === 'configuration') {
      mockConfiguration = undefined;
      view.rerender(React.createElement(WebClientPage));
    } else
      worker.emit({
        type: 'state',
        state: action,
        generation: worker.generation,
      });
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(oldButton);
    expect(surface.requestFullscreen).not.toHaveBeenCalled();
  },
);

test.each([true, false])(
  '一键全屏真实请求全屏，Keyboard API可用=%s时状态如实，关闭动画后再锁键',
  async (supported) => {
    const originalKeyboard = Object.getOwnPropertyDescriptor(
      navigator,
      'keyboard',
    );
    const originalFullscreen = Object.getOwnPropertyDescriptor(
      document,
      'fullscreenElement',
    );
    const keyboard = {
      lock: jest.fn<() => Promise<void>>().mockResolvedValue(),
      unlock: jest.fn(),
    };
    Object.defineProperty(navigator, 'keyboard', {
      configurable: true,
      value: supported ? keyboard : undefined,
    });
    try {
      const desktop = await readyDesktop();
      const surface = screen.getByLabelText('Web Client');
      const request = jest
        .fn<() => Promise<void>>()
        .mockImplementation(async () => {
          Object.defineProperty(document, 'fullscreenElement', {
            configurable: true,
            value: surface,
          });
          document.dispatchEvent(new Event('fullscreenchange'));
        });
      surface.requestFullscreen = request;
      guideKey(desktop);
      fireEvent.click(screen.getByRole('button', { name: 'Go fullscreen' }));
      expect(request).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(document.activeElement).toBe(desktop));
      if (supported)
        await waitFor(() => expect(keyboard.lock).toHaveBeenCalledTimes(1));
      else expect(keyboard.lock).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).toBeNull();
      openTool('Keyboard');
      await waitFor(() =>
        expect(
          document.querySelector(
            supported
              ? '[data-keyboard-lock="idle"]'
              : '[data-keyboard-lock="unsupported"]',
          ),
        ).toBeTruthy(),
      );
    } finally {
      if (originalKeyboard)
        Object.defineProperty(navigator, 'keyboard', originalKeyboard);
      else Reflect.deleteProperty(navigator, 'keyboard');
      if (originalFullscreen)
        Object.defineProperty(
          document,
          'fullscreenElement',
          originalFullscreen,
        );
      else Reflect.deleteProperty(document, 'fullscreenElement');
    }
  },
);

test('引导全屏请求失败如实提示，迟到成功跨重连不抢焦点或锁键', async () => {
  const originalKeyboard = Object.getOwnPropertyDescriptor(
    navigator,
    'keyboard',
  );
  const originalFullscreen = Object.getOwnPropertyDescriptor(
    document,
    'fullscreenElement',
  );
  const keyboard = {
    lock: jest.fn<() => Promise<void>>().mockResolvedValue(),
    unlock: jest.fn(),
  };
  Object.defineProperty(navigator, 'keyboard', {
    configurable: true,
    value: keyboard,
  });
  try {
    const desktop = await readyDesktop();
    const surface = screen.getByLabelText('Web Client');
    surface.requestFullscreen = jest
      .fn<() => Promise<void>>()
      .mockRejectedValue(new Error('denied'));
    guideKey(desktop);
    fireEvent.click(screen.getByRole('button', { name: 'Go fullscreen' }));
    await waitFor(() =>
      expect(
        screen.getByText('The operation failed. Disconnect and try again.'),
      ).toBeTruthy(),
    );
    expect(keyboard.lock).not.toHaveBeenCalled();
    openTool('Disconnect');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    });
    worker.emit({
      type: 'state',
      state: 'connected',
      generation: worker.generation,
    });
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
    let complete!: () => void;
    surface.requestFullscreen = () =>
      new Promise((resolve) => {
        complete = resolve;
      });
    guideKey(desktop);
    fireEvent.click(screen.getByRole('button', { name: 'Go fullscreen' }));
    openTool('Keyboard');
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
    const field = screen.getByLabelText('Remote ID');
    act(() => field.focus());
    await act(async () => {
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        value: surface,
      });
      complete();
      await Promise.resolve();
    });
    expect(document.activeElement).toBe(field);
    expect(keyboard.lock).not.toHaveBeenCalled();
  } finally {
    if (originalKeyboard)
      Object.defineProperty(navigator, 'keyboard', originalKeyboard);
    else Reflect.deleteProperty(navigator, 'keyboard');
    if (originalFullscreen)
      Object.defineProperty(document, 'fullscreenElement', originalFullscreen);
    else Reflect.deleteProperty(document, 'fullscreenElement');
  }
});

test.each(['ready', 'new-focus', 'disconnect'])(
  '引导关闭动画延迟且%s，提前完成全屏不锁键，afterClose仍核对当前资格',
  async (boundary) => {
    const originalKeyboard = Object.getOwnPropertyDescriptor(
      navigator,
      'keyboard',
    );
    const originalFullscreen = Object.getOwnPropertyDescriptor(
      document,
      'fullscreenElement',
    );
    const keyboard = {
      lock: jest.fn<() => Promise<void>>().mockResolvedValue(),
      unlock: jest.fn(),
    };
    Object.defineProperty(navigator, 'keyboard', {
      configurable: true,
      value: keyboard,
    });
    mockDelayModalClose = true;
    try {
      const desktop = await readyDesktop();
      const surface = screen.getByLabelText('Web Client');
      surface.requestFullscreen = jest
        .fn<() => Promise<void>>()
        .mockImplementation(async () => {
          Object.defineProperty(document, 'fullscreenElement', {
            configurable: true,
            value: surface,
          });
          document.dispatchEvent(new Event('fullscreenchange'));
        });
      guideKey(desktop);
      fireEvent.click(screen.getByRole('button', { name: 'Go fullscreen' }));
      await act(async () => {
        await Promise.resolve();
      });
      expect(surface.requestFullscreen).toHaveBeenCalledTimes(1);
      expect(keyboard.lock).not.toHaveBeenCalled();
      expect(document.activeElement).not.toBe(desktop);
      const complete = mockFinishModalClose;
      if (!complete) throw new Error('Missing delayed afterClose');
      if (boundary === 'disconnect')
        fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
      if (boundary !== 'ready') {
        const field = document.createElement('input');
        surface.append(field);
        act(() => field.focus());
      }
      const active = document.activeElement;
      await act(async () => {
        complete();
        await Promise.resolve();
      });
      if (boundary === 'ready') {
        expect(document.activeElement).toBe(desktop);
        expect(keyboard.lock).toHaveBeenCalledTimes(1);
      } else {
        expect(document.activeElement).toBe(active);
        expect(keyboard.lock).not.toHaveBeenCalled();
      }
    } finally {
      if (originalKeyboard)
        Object.defineProperty(navigator, 'keyboard', originalKeyboard);
      else Reflect.deleteProperty(navigator, 'keyboard');
      if (originalFullscreen)
        Object.defineProperty(
          document,
          'fullscreenElement',
          originalFullscreen,
        );
      else Reflect.deleteProperty(document, 'fullscreenElement');
    }
  },
);

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

test('自定义画质拖动只更新草稿，提交一次；光标缩放不发送输入或协议选项', async () => {
  await readyDesktop();
  openTool('Display');
  fireEvent.change(screen.getByLabelText('Image quality'), {
    target: { value: 'custom' },
  });
  const slider = screen.getByRole('slider', { name: 'Bitrate ratio' });
  const count = worker.postMessage.mock.calls.filter(
    ([m]) => m.type === 'view-options',
  ).length;
  fireEvent.change(slider, { target: { value: '10' } });
  fireEvent.change(slider, { target: { value: '100' } });
  expect(
    worker.postMessage.mock.calls.filter(([m]) => m.type === 'view-options'),
  ).toHaveLength(count);
  fireEvent.pointerUp(slider);
  expect(worker.postMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'view-options',
      options: expect.objectContaining({
        quality: 'custom',
        customQuality: 100,
      }),
    }),
  );
  fireEvent.blur(slider);
  expect(
    worker.postMessage.mock.calls.filter(([m]) => m.type === 'view-options'),
  ).toHaveLength(count + 1);
  const sent = worker.postMessage.mock.calls.length;
  fireEvent.click(screen.getByRole('switch', { name: 'Zoom cursor' }));
  expect(worker.postMessage.mock.calls).toHaveLength(sent);
  fireEvent.change(screen.getByLabelText('Image quality'), {
    target: { value: 'balanced' },
  });
  expect(screen.queryByRole('slider', { name: 'Bitrate ratio' })).toBeNull();
});

test('连接与首个cursor在同批事件到达时保留形状，后续ID切换可恢复', async () => {
  render(React.createElement(WebClientPage));
  await waitFor(() => expect(worker.onmessage).toBeDefined());
  worker.emit({
    type: 'ready',
    secureContext: true,
    videoDecoder: true,
    generation: 0,
  });
  await act(async () => {
    fireEvent.click(screen.getByText('Connect'));
  });
  const originalImageData = globalThis.ImageData;
  Object.defineProperty(globalThis, 'ImageData', {
    configurable: true,
    value: class {
      constructor(
        readonly data: Uint8ClampedArray,
        readonly width: number,
        readonly height: number,
      ) {}
    },
  });
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    clearRect: mockClear,
    drawImage: mockDraw,
    putImageData: jest.fn(),
  } as unknown as CanvasRenderingContext2D);
  jest
    .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
    .mockReturnValue('data:image/png;base64,AA==');
  try {
    act(() => {
      worker.onmessage?.({
        data: {
          type: 'state',
          state: 'connected',
          generation: worker.generation,
        },
      } as MessageEvent);
      worker.onmessage?.({
        data: {
          type: 'cursor',
          generation: worker.generation,
          cursor: {
            id: 'first',
            width: 32,
            height: 32,
            hotx: 4,
            hoty: 8,
            colors: new Uint8Array(4096),
          },
        },
      } as MessageEvent);
    });
    const desktop = screen.getByLabelText(
      'Remote desktop. Focus to send keyboard and mouse input.',
    ) as HTMLCanvasElement;
    expect(desktop.style.cursor).toContain('4 8');
    worker.emit({
      type: 'cursor-id',
      id: 'unknown',
      generation: worker.generation,
    });
    expect(desktop.style.cursor).toBe('default');
    worker.emit({
      type: 'cursor-id',
      id: 'first',
      generation: worker.generation,
    });
    expect(desktop.style.cursor).toContain('4 8');
  } finally {
    Object.defineProperty(globalThis, 'ImageData', {
      configurable: true,
      value: originalImageData,
    });
  }
});

test('分辨率控件依赖本屏报告，发送后保留实际几何与canvas，旧状态不覆盖当前请求', async () => {
  const desktop = await readyDesktop();
  openTool('Display');
  const select = screen.getByLabelText(
    'Remote resolution',
  ) as HTMLSelectElement;
  expect(select.disabled).toBe(true);
  worker.emit({
    type: 'display-options',
    options: {
      display: 0,
      identity: '0:A',
      supported: true,
      resolutions: [
        { width: 800, height: 600 },
        { width: 1024, height: 768 },
      ],
      originalResolution: { width: 1024, height: 768 },
    },
    displayGeneration: 0,
    generation: worker.generation,
  });
  expect(select.disabled).toBe(false);
  fireEvent.change(select, { target: { value: '1024x768' } });
  const command = worker.postMessage.mock.calls
    .filter(([m]) => m.type === 'change-resolution')
    .at(-1)?.[0];
  expect(command).toMatchObject({
    display: 0,
    width: 1024,
    height: 768,
    displayGeneration: 0,
  });
  expect(select.value).toBe('800x600');
  expect(select.disabled).toBe(true);
  expect(
    screen.getByLabelText(
      'Remote desktop. Focus to send keyboard and mouse input.',
    ),
  ).toBe(desktop);
  worker.emit({
    type: 'resolution-status',
    request: Number(command?.request) - 1,
    status: 'confirmed',
    generation: worker.generation,
  });
  expect(screen.queryByText('Target resolution confirmed.')).toBeNull();
  worker.emit({
    type: 'resolution-status',
    request: command?.request,
    status: 'unconfirmed',
    generation: worker.generation,
  });
  expect(
    screen.getByText(
      'Resolution change unconfirmed. Check the picture and retry.',
    ),
  ).toBeTruthy();
  expect(select.disabled).toBe(false);
  worker.emit({
    type: 'permissions',
    permissions: { keyboard: false, clipboard: true, audio: true, file: true },
    generation: worker.generation,
  });
  expect(select.disabled).toBe(true);
});

test('稀疏PeerInfo保留SAS能力，键鼠撤权仍禁用CtrlAltDel', async () => {
  await readyDesktop();
  const emitPeer = (sasEnabled?: boolean) => {
    const peer = hbb.PeerInfo.decode(
      hbb.PeerInfo.encode({
        displays: [{ width: 800, height: 600 }],
        ...(sasEnabled === undefined ? {} : { sasEnabled }),
      }).finish(),
    );
    worker.emit({ type: 'peer', peer, generation: worker.generation });
    worker.emit({
      type: 'frame',
      frame: { displayWidth: 800, displayHeight: 600, close: jest.fn() },
      displayGeneration: 0,
      generation: worker.generation,
    });
  };
  emitPeer(true);
  openTool('Session');
  const button = screen.getByRole('button', {
    name: 'Ctrl+Alt+Del',
  }) as HTMLButtonElement;
  expect(button.disabled).toBe(false);
  emitPeer();
  expect(button.disabled).toBe(false);
  worker.emit({
    type: 'permissions',
    permissions: { keyboard: false, clipboard: true, audio: true, file: true },
    generation: worker.generation,
  });
  expect(button.disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Session' }).textContent).toBe(
    'View only',
  );
  expect(
    (screen.getByRole('button', { name: 'Control' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(
    screen
      .getByRole('button', { name: 'View only' })
      .getAttribute('aria-pressed'),
  ).toBe('true');
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
  await act(async () => {
    fireEvent.click(screen.getByText('Connect'));
  });
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
  await act(async () => {
    worker.emit({
      type: 'clipboard',
      text: 'current text',
      generation: worker.generation,
    });
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

test('自动凭据查询和认证不创建密码表单；无记录或失败才显示手动输入且可取消', async () => {
  await start();
  for (const state of [
    'checkingCredentials',
    'automaticAuthenticating',
    'connected',
  ]) {
    worker.emit({ type: 'state', state, generation: worker.generation });
    expect(screen.queryByLabelText('Remote device password')).toBeNull();
    expect(
      screen.queryByRole('checkbox', { name: 'Remember password' }),
    ).toBeNull();
    if (state !== 'connected')
      expect(
        screen.getByRole('button', { name: 'Cancel connection' }),
      ).toBeTruthy();
  }
  worker.emit({
    type: 'state',
    state: 'authenticating',
    generation: worker.generation,
  });
  expect(screen.getByLabelText('Remote device password')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel connection' }));
  const oldGeneration = worker.generation - 1;
  worker.emit({
    type: 'state',
    state: 'automaticAuthenticating',
    generation: oldGeneration,
  });
  expect(screen.queryByText('Connecting with your saved password.')).toBeNull();
});

test('捕获快捷键入口真实请求网页全屏和全部键，失焦释放；不支持则不进入全屏', async () => {
  const originalKeyboard = Object.getOwnPropertyDescriptor(
    navigator,
    'keyboard',
  );
  const originalFullscreen = Object.getOwnPropertyDescriptor(
    document,
    'fullscreenElement',
  );
  const keyboard = {
    lock: jest.fn<() => Promise<void>>().mockResolvedValue(),
    unlock: jest.fn(),
  };
  Object.defineProperty(navigator, 'keyboard', {
    configurable: true,
    value: keyboard,
  });
  jest.spyOn(document, 'hasFocus').mockReturnValue(true);
  try {
    const desktop = await readyDesktop();
    const surface = screen.getByLabelText('Web Client');
    const request = jest
      .fn<() => Promise<void>>()
      .mockImplementation(async () => {
        Object.defineProperty(document, 'fullscreenElement', {
          configurable: true,
          value: surface,
        });
        document.dispatchEvent(new Event('fullscreenchange'));
      });
    surface.requestFullscreen = request;
    openTool('Keyboard');
    fireEvent.click(
      screen.getByRole('button', { name: 'Fullscreen and enable' }),
    );
    await waitFor(() => expect(keyboard.lock).toHaveBeenCalledTimes(1));
    expect(request).toHaveBeenCalledTimes(1);
    expect(keyboard.lock.mock.calls[0]).toEqual([]);
    expect(document.activeElement).toBe(desktop);
    fireEvent.blur(desktop);
    expect(keyboard.unlock).toHaveBeenCalledTimes(1);
    // 打开键鼠暂停接管，返回画布不自动重锁；明确开启才恢复。
    openTool('Keyboard');
    fireEvent.click(screen.getByRole('button', { name: 'Show session menu' }));
    act(() => desktop.focus());
    await act(async () => {
      await Promise.resolve();
    });
    expect(keyboard.lock).toHaveBeenCalledTimes(1);
    openTool('Keyboard');
    fireEvent.click(screen.getByRole('button', { name: 'Enable capture' }));
    await waitFor(() => expect(keyboard.lock).toHaveBeenCalledTimes(2));
    expect(request).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(desktop);
    Object.defineProperty(navigator, 'keyboard', {
      configurable: true,
      value: undefined,
    });
    openTool('Keyboard');
    expect(
      screen.queryByRole('button', { name: 'Fullscreen and enable' }),
    ).toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText('This browser does not support shortcut capture'),
    ).toBeTruthy();
  } finally {
    if (originalKeyboard)
      Object.defineProperty(navigator, 'keyboard', originalKeyboard);
    else Reflect.deleteProperty(navigator, 'keyboard');
    if (originalFullscreen)
      Object.defineProperty(document, 'fullscreenElement', originalFullscreen);
    else Reflect.deleteProperty(document, 'fullscreenElement');
  }
});

test('锁键拒绝后菜单保留真实失败与重试，返回画布不自动重锁', async () => {
  const originalKeyboard = Object.getOwnPropertyDescriptor(
    navigator,
    'keyboard',
  );
  const originalFullscreen = Object.getOwnPropertyDescriptor(
    document,
    'fullscreenElement',
  );
  const keyboard = {
    lock: jest
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('denied'))
      .mockResolvedValue(),
    unlock: jest.fn(),
  };
  Object.defineProperty(navigator, 'keyboard', {
    configurable: true,
    value: keyboard,
  });
  jest.spyOn(document, 'hasFocus').mockReturnValue(true);
  try {
    const desktop = await readyDesktop();
    const workspace = screen.getByLabelText('Web Client');
    workspace.requestFullscreen = jest
      .fn<() => Promise<void>>()
      .mockImplementation(async () => {
        Object.defineProperty(document, 'fullscreenElement', {
          configurable: true,
          value: workspace,
        });
        document.dispatchEvent(new Event('fullscreenchange'));
      });
    openTool('Keyboard');
    fireEvent.click(
      screen.getByRole('button', { name: 'Fullscreen and enable' }),
    );
    await waitFor(() =>
      expect(
        document.querySelector('[data-keyboard-lock="denied"]'),
      ).toBeTruthy(),
    );
    act(() =>
      screen.getByRole('button', { name: 'Keyboard and mouse' }).focus(),
    );
    openTool('Keyboard');
    expect(
      screen.getByText('Shortcut capture could not be enabled'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show session menu' }));
    act(() => desktop.focus());
    await act(async () => {
      await Promise.resolve();
    });
    expect(keyboard.lock).toHaveBeenCalledTimes(1);
    openTool('Keyboard');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(keyboard.lock).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(
        document.querySelector('[data-keyboard-lock="locked"]'),
      ).toBeTruthy(),
    );
  } finally {
    if (originalKeyboard)
      Object.defineProperty(navigator, 'keyboard', originalKeyboard);
    else Reflect.deleteProperty(navigator, 'keyboard');
    if (originalFullscreen)
      Object.defineProperty(document, 'fullscreenElement', originalFullscreen);
    else Reflect.deleteProperty(document, 'fullscreenElement');
  }
});

test('捕获入口请求全屏尚未完成时取消连接，迟到完成不恢复画面焦点或锁', async () => {
  const originalKeyboard = Object.getOwnPropertyDescriptor(
    navigator,
    'keyboard',
  );
  const originalFullscreen = Object.getOwnPropertyDescriptor(
    document,
    'fullscreenElement',
  );
  const keyboard = {
    lock: jest.fn<() => Promise<void>>().mockResolvedValue(),
    unlock: jest.fn(),
  };
  Object.defineProperty(navigator, 'keyboard', {
    configurable: true,
    value: keyboard,
  });
  jest.spyOn(document, 'hasFocus').mockReturnValue(true);
  try {
    const desktop = await readyDesktop();
    const surface = screen.getByLabelText('Web Client');
    let complete!: () => void;
    surface.requestFullscreen = () =>
      new Promise((resolve) => {
        complete = resolve;
      });
    openTool('Keyboard');
    fireEvent.click(
      screen.getByRole('button', { name: 'Fullscreen and enable' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
    await act(async () => {
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        value: surface,
      });
      document.dispatchEvent(new Event('fullscreenchange'));
      complete();
      await Promise.resolve();
    });
    expect(keyboard.lock).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(desktop);
  } finally {
    if (originalKeyboard)
      Object.defineProperty(navigator, 'keyboard', originalKeyboard);
    else Reflect.deleteProperty(navigator, 'keyboard');
    if (originalFullscreen)
      Object.defineProperty(document, 'fullscreenElement', originalFullscreen);
    else Reflect.deleteProperty(document, 'fullscreenElement');
  }
});

test.each(['form', 'blur', 'hidden'])(
  '捕获入口等待全屏期间%s，迟到完成不抢新焦点或请求锁',
  async (boundary) => {
    const originalKeyboard = Object.getOwnPropertyDescriptor(
      navigator,
      'keyboard',
    );
    const originalFullscreen = Object.getOwnPropertyDescriptor(
      document,
      'fullscreenElement',
    );
    const keyboard = {
      lock: jest.fn<() => Promise<void>>().mockResolvedValue(),
      unlock: jest.fn(),
    };
    Object.defineProperty(navigator, 'keyboard', {
      configurable: true,
      value: keyboard,
    });
    try {
      const desktop = await readyDesktop();
      const surface = screen.getByLabelText('Web Client');
      let complete!: () => void;
      surface.requestFullscreen = () =>
        new Promise((resolve) => {
          complete = resolve;
        });
      openTool('Keyboard');
      fireEvent.click(
        screen.getByRole('button', { name: 'Fullscreen and enable' }),
      );
      if (boundary === 'form') {
        const field = document.createElement('input');
        surface.append(field);
        field.focus();
      }
      const active = document.activeElement;
      const focus = jest.spyOn(desktop, 'focus');
      if (boundary === 'blur')
        jest.spyOn(document, 'hasFocus').mockReturnValue(false);
      if (boundary === 'hidden')
        jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
      await act(async () => {
        Object.defineProperty(document, 'fullscreenElement', {
          configurable: true,
          value: surface,
        });
        document.dispatchEvent(new Event('fullscreenchange'));
        complete();
        await Promise.resolve();
      });
      expect(document.activeElement).toBe(active);
      expect(focus).not.toHaveBeenCalled();
      expect(keyboard.lock).not.toHaveBeenCalled();
    } finally {
      if (originalKeyboard)
        Object.defineProperty(navigator, 'keyboard', originalKeyboard);
      else Reflect.deleteProperty(navigator, 'keyboard');
      if (originalFullscreen)
        Object.defineProperty(
          document,
          'fullscreenElement',
          originalFullscreen,
        );
      else Reflect.deleteProperty(document, 'fullscreenElement');
    }
  },
);

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
  openKeyboard('text');
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
  expect(screen.getByRole('button', { name: legacyNotice })).toBeDefined();
  fireEvent.change(screen.getByLabelText('Remote device password'), {
    target: { value: 'synthetic' },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
  });
  expect(worker.postMessage).toHaveBeenLastCalledWith({
    displayGeneration: 0,
    type: 'password',
    password: 'synthetic',
    remember: false,
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
  expect(screen.getByRole('button', { name: legacyNotice })).toBeDefined();
  const fullscreenSurface = screen
    .getByLabelText('Remote desktop. Focus to send keyboard and mouse input.')
    .closest('section');
  expect(
    fullscreenSurface?.contains(
      screen.getByRole('button', { name: legacyNotice }),
    ),
  ).toBe(true);
});

test('disconnect and reconnect suppress old legacy notices and KX 1 has no legacy notice', async () => {
  await start();
  const previous = worker.generation;
  worker.emit({ type: 'security', kxVersion: 0, generation: previous });
  expect(screen.getByRole('button', { name: legacyNotice })).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
  expect(screen.queryByRole('button', { name: legacyNotice })).toBeNull();
  await act(async () => {
    fireEvent.click(screen.getByText('Connect'));
  });
  worker.emit({ type: 'security', kxVersion: 0, generation: previous });
  expect(screen.queryByRole('button', { name: legacyNotice })).toBeNull();
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
  expect(screen.queryByRole('button', { name: legacyNotice })).toBeNull();
});

test.each(['configuration', 'crash', 'failed'] as const)(
  '%s clears the old protocol notice',
  async (reason) => {
    const view = await start();
    const previous = worker;
    const generation = worker.generation;
    worker.emit({ type: 'security', kxVersion: 0, generation });
    expect(screen.getByRole('button', { name: legacyNotice })).toBeDefined();
    if (reason === 'configuration') {
      mockConfiguration = {
        ...profile,
        relayServerUrl: 'wss://example.test/another-relay',
      };
      view.rerender(React.createElement(WebClientPage));
      previous.emit({ type: 'security', kxVersion: 0, generation });
    } else if (reason === 'crash') act(() => worker.onerror?.());
    else worker.emit({ type: 'state', state: 'failed', generation });
    expect(screen.queryByRole('button', { name: legacyNotice })).toBeNull();
  },
);

test('文件会话单独认证并拒绝断开后的目录事件', async () => {
  await start();
  await openFileTool();
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
  expect(screen.queryByLabelText('File session password')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Use password' }));
  fireEvent.change(screen.getByLabelText('File session password'), {
    target: { value: 'file-only' },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
  });
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
  fireEvent.click(screen.getByRole('button', { name: 'Disconnect files' }));
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
  expect(value('Remote directory')).toBe('');
  expect(
    (screen.getByLabelText('Remote directory') as HTMLInputElement).disabled,
  ).toBe(true);
});

test('文件撤权清理后拒绝同代次迟到事件，恢复权限须重新连接', async () => {
  await start();
  await openFileTool();
  const fileGeneration = Number(
    worker.postMessage.mock.calls.find(([m]) => m.type === 'files-connect')?.[0]
      .fileGeneration,
  );
  const generation = worker.generation;
  const emit = (message: object) =>
    worker.emit({ ...message, generation, fileGeneration });
  emit({ type: 'files-state', state: 'connected' });
  emit({
    type: 'files-event',
    event: { type: 'directory', path: 'C:/Files', entries: [] },
  });
  worker.emit({
    type: 'permissions',
    permissions: { keyboard: true, clipboard: true, audio: true, file: false },
    generation,
  });
  expect(value('Remote directory')).toBe('');
  emit({ type: 'files-state', state: 'connected' });
  emit({
    type: 'files-event',
    event: { type: 'directory', path: 'C:/Late', entries: [] },
  });
  emit({ type: 'files-error', code: 'password' });
  expect(value('Remote directory')).toBe('');
  expect(screen.queryByLabelText('File session password')).toBeNull();
  expect(
    (screen.getByLabelText('Remote directory') as HTMLInputElement).disabled,
  ).toBe(true);
  worker.emit({
    type: 'permissions',
    permissions: { keyboard: true, clipboard: true, audio: true, file: true },
    generation,
  });
  await waitFor(() =>
    expect(
      worker.postMessage.mock.calls.filter(([m]) => m.type === 'files-connect'),
    ).toHaveLength(2),
  );
  expect(
    Number(worker.postMessage.mock.calls.at(-1)?.[0].fileGeneration),
  ).toBeGreaterThan(fileGeneration);
});

test('文件自动认证等待时不要求重输密码，认证失败后才展开输入', async () => {
  await start();
  await openFileTool();
  const fileGeneration =
    worker.postMessage.mock.calls.at(-1)?.[0].fileGeneration;
  const generation = worker.generation;
  worker.emit({
    type: 'files-state',
    state: 'authenticating',
    fileGeneration,
    generation,
  });
  expect(screen.queryByLabelText('File session password')).toBeNull();
  worker.emit({
    type: 'files-error',
    code: 'password',
    fileGeneration,
    generation,
  });
  worker.emit({
    type: 'files-state',
    state: 'awaitingApproval',
    fileGeneration,
    generation,
  });
  expect(screen.getByLabelText('File session password')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Use password' })).toBeNull();
  worker.emit({
    type: 'files-state',
    state: 'connected',
    fileGeneration,
    generation,
  });
  expect(screen.queryByLabelText('File session password')).toBeNull();
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
  openKeyboard('text');
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
    await openFileTool();
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
  openKeyboard();
  fireEvent.click(screen.getByRole('button', { name: 'Send Left Shift key' }));
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
          mode: hbb.KeyboardMode.Legacy,
          modifiers: undefined,
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
    fireEvent.click(screen.getByRole('switch', { name: 'Play audio' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Play audio' }));
    await waitFor(() =>
      expect(
        screen
          .getByRole('switch', { name: 'Play audio' })
          .getAttribute('aria-checked'),
      ).toBe('true'),
    );
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
  await openFileTool();
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
  await openFileTool();
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
  openKeyboard();
  fireEvent.click(screen.getByRole('button', { name: 'Send Left Ctrl key' }));
  const count = worker.postMessage.mock.calls.length;
  fireEvent.keyDown(
    screen.getByRole('button', { name: 'Send Left Ctrl key' }),
    {
      key: 'Escape',
    },
  );
  expect(worker.postMessage.mock.calls.slice(count)).toContainEqual([
    expect.objectContaining({
      type: 'input',
      input: {
        keyEvent: {
          controlKey: hbb.ControlKey.Control,
          down: false,
          mode: hbb.KeyboardMode.Legacy,
          modifiers: undefined,
        },
      },
    }),
  ]);
  expect(
    screen.queryByRole('button', { name: 'Send Left Ctrl key' }),
  ).toBeNull();
  openTool('Input controls');
  openKeyboard();
  expect(
    screen
      .getByRole('button', { name: 'Send Left Ctrl key' })
      .getAttribute('aria-pressed'),
  ).toBe('false');
  expect(desktop).toBeTruthy();
});

test('文件窗口隐藏后仍显示属于文件会话的旧协议与错误', async () => {
  await start();
  await openFileTool();
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
      .getAllByText(/RustDesk 1.4.9 uses the older method/)
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

test('文件成功后清除文件提示，保留独立音频错误', async () => {
  mockTranslations = {
    'webClient.error.audio': 'Audio failure remains',
    'webClient.error.files': 'File failure clears',
  };
  const view = await start();
  const currentWorker = worker;
  try {
    await waitFor(() =>
      expect(
        currentWorker.postMessage.mock.calls.some(
          ([item]) => item.type === 'connect',
        ),
      ).toBe(true),
    );
    const desktop = currentWorker.postMessage.mock.calls.find(
      ([item]) => item.type === 'connect',
    )?.[0];
    if (!desktop) throw new Error('Missing desktop connection');
    currentWorker.emit({
      type: 'state',
      state: 'connected',
      generation: desktop.generation,
    });
    await waitFor(() =>
      expect(
        document.querySelector('[data-session-state="connected"]'),
      ).toBeTruthy(),
    );
    await openFileTool();
    await waitFor(() =>
      expect(
        currentWorker.postMessage.mock.calls.some(
          ([item]) => item.type === 'files-connect',
        ),
      ).toBe(true),
    );
    const files = currentWorker.postMessage.mock.calls.find(
      ([item]) => item.type === 'files-connect',
    )?.[0];
    if (!files) throw new Error('Missing file connection');
    const emit = (event: object) =>
      currentWorker.emit({
        generation: desktop.generation,
        fileGeneration: files.fileGeneration,
        ...event,
      });
    emit({ type: 'files-state', state: 'connected' });
    emit({ type: 'files-error', code: 'files' });
    hideFiles();
    expect(screen.getAllByText('File failure clears').length).toBeGreaterThan(
      0,
    );
    currentWorker.emit({
      type: 'warning',
      code: 'audio',
      generation: desktop.generation,
    });
    emit({
      type: 'files-event',
      event: {
        type: 'progress',
        progress: {
          id: 1,
          name: 'test.txt',
          total: 5,
          transferred: 5,
          phase: 'done',
          direction: 'download',
        },
      },
    });
    expect(screen.queryAllByText('File failure clears')).toHaveLength(0);
    expect(screen.getByText('Audio failure remains')).toBeTruthy();
  } finally {
    view.unmount();
    await act(async () => {});
  }
});

test('全屏目标包含顶部菜单和文件浮窗，打开浮窗不改变canvas节点', async () => {
  const desktop = await readyDesktop();
  const surface = screen.getByLabelText('Web Client');
  const requestFullscreen = jest.fn<() => Promise<void>>().mockResolvedValue();
  Object.assign(surface, { requestFullscreen });
  fireEvent.click(screen.getByRole('button', { name: 'Fullscreen' }));
  expect(requestFullscreen).toHaveBeenCalledTimes(1);
  await openFileTool();
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

test('通话收起后的准备、等待、活动状态使用实际词典键，并仍能结束', async () => {
  const media = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
  const worklet = Object.getOwnPropertyDescriptor(
    globalThis,
    'AudioWorkletNode',
  );
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: jest.fn() },
  });
  Object.defineProperty(globalThis, 'AudioWorkletNode', {
    configurable: true,
    value: class {},
  });
  let resolveMicrophone!: (value: boolean) => void;
  jest.spyOn(Microphone.prototype, 'start').mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveMicrophone = resolve;
      }),
  );
  jest.spyOn(AudioPlayer.prototype, 'start').mockResolvedValue();
  mockTranslations = {
    'webClient.callPreparing': '准备麦克风',
    'webClient.callRequesting': '等待对方接受',
    'webClient.callActive': '通话进行中',
    'webClient.callStart': '拨打',
    'webClient.callMinimize': '收起通话窗口',
    'webClient.callHangup': '结束通话',
  };
  try {
    await readyDesktop();
    worker.emit({
      type: 'ready',
      secureContext: true,
      videoDecoder: true,
      audioDecoder: true,
      voiceEncoder: true,
      generation: worker.generation,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Voice call' }));
    fireEvent.click(screen.getByRole('button', { name: /拨打$/ }));
    fireEvent.click(screen.getByRole('button', { name: '收起通话窗口' }));
    expect(document.querySelector('[data-call-status]')?.textContent).toContain(
      '准备麦克风',
    );
    await act(async () => {
      resolveMicrophone(true);
    });
    const command = worker.postMessage.mock.calls
      .map(([message]) => message)
      .find((message) => message.type === 'call-start');
    if (!command) throw new Error('Call request missing');
    expect(document.querySelector('[data-call-status]')?.textContent).toContain(
      '等待对方接受',
    );
    worker.emit({
      type: 'call-state',
      state: 'active',
      callGeneration: command.callGeneration,
      generation: worker.generation,
    });
    expect(document.querySelector('[data-call-status]')?.textContent).toContain(
      '通话进行中',
    );
    fireEvent.click(screen.getByRole('button', { name: '结束通话' }));
    expect(document.querySelector('[data-call-status]')).toBeNull();
    expect(worker.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: 'call-stop',
        callGeneration: command.callGeneration,
      }),
    );
  } finally {
    if (media) Object.defineProperty(navigator, 'mediaDevices', media);
    else Reflect.deleteProperty(navigator, 'mediaDevices');
    if (worklet) Object.defineProperty(globalThis, 'AudioWorkletNode', worklet);
    else Reflect.deleteProperty(globalThis, 'AudioWorkletNode');
  }
});

test('顶部菜单按钮支持方向键、Home和End导航', async () => {
  await start();
  const pin = screen.getByRole('button', { name: 'Pin menu' });
  fireEvent.keyDown(pin, { key: 'ArrowRight' });
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Session' }),
  );
  fireEvent.keyDown(screen.getByRole('button', { name: 'Session' }), {
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
  expect(screen.getByRole('button', { name: 'Screen keyboard' })).toBeTruthy();
  fireEvent.keyDown(screen.getByRole('button', { name: 'Screen keyboard' }), {
    key: 'Escape',
  });
  expect(screen.queryByRole('button', { name: 'Screen keyboard' })).toBeNull();
  expect(desktop).toBeTruthy();
});

test('旧协议说明包含风险与nightly限制，不根据版本字符串隐藏或展示开发证据', async () => {
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
  const noticeId = badge.getAttribute('aria-controls');
  const notice = noticeId && document.getElementById(noticeId);
  if (!notice) throw new Error('Legacy notice missing');
  expect(notice.querySelector('p')?.closest('[hidden]')).toBeNull();
  expect(notice.textContent).toMatch(/known risk that can weaken/);
  expect(notice.textContent).toMatch(/specific official 1.5.0 nightly/);
  expect(notice.textContent).not.toMatch(/SHA|Verified 2026/);
  expect(notice.textContent).toContain('Remote client: 1.5.0');
});

test('目录编辑与已加载路径分离，失败时上传仍使用原目录', async () => {
  await start();
  await openFileTool();
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
  fireEvent.click(screen.getByRole('button', { name: 'Upload files' }));
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
  expect(worker.postMessage.mock.calls.length).toBe(before);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel transfer' }));
  fireEvent.doubleClick(screen.getByRole('button', { name: 'Folder' }));
  expect(worker.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({
      command: { type: 'list', path: 'C:/Valid/Folder' },
    }),
  );
});
test('单击文件只选中，下载必须通过明确按钮启动', async () => {
  await start();
  await openFileTool();
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
        name: 'Save to this computer',
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
  await act(async () => {
    worker.emit({
      type: 'clipboard',
      text: 'fresh',
      generation: worker.generation,
    });
  });
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('fresh');
});

test.each(['connecting', 'securing', 'authenticating', 'awaitingApproval'])(
  '连接中 %s 可以直接取消，并拒绝迟到的成功',
  async (state) => {
    const view = render(React.createElement(WebClientPage));
    await waitFor(() => expect(worker.onmessage).toBeDefined());
    worker.emit({
      type: 'ready',
      secureContext: true,
      videoDecoder: true,
      generation: 0,
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Connect'));
    });
    const generation = worker.generation;
    worker.emit({ type: 'state', state, generation });
    if (state === 'authenticating' || state === 'awaitingApproval')
      fireEvent.change(screen.getByLabelText('Remote device password'), {
        target: { value: 'discard-me' },
      });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel connection' }));
    expect(worker.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'disconnect',
        generation: generation + 1,
      }),
    );
    worker.emit({ type: 'state', state: 'connected', generation });
    expect(
      view.container
        .querySelector('[data-session-state]')
        ?.getAttribute('data-session-state'),
    ).toBe('closed');
    expect(
      screen.queryByRole('button', { name: 'Cancel connection' }),
    ).toBeNull();
    expect(
      view.container.querySelector('[data-workspace]')?.hasAttribute('hidden'),
    ).toBe(true);
  },
);

test('显示菜单实际发送选项；缩放不重建画布，只读禁用输入与粘贴', async () => {
  const desktop = await readyDesktop();
  openTool('Display');
  fireEvent.change(screen.getByLabelText('Image quality'), {
    target: { value: 'best' },
  });
  const fps = screen.getByRole('slider', { name: 'Frame rate limit' });
  const beforeFps = worker.postMessage.mock.calls.length;
  fireEvent.change(fps, {
    target: { value: '15' },
  });
  expect(worker.postMessage.mock.calls).toHaveLength(beforeFps);
  fireEvent.pointerUp(fps);
  expect(worker.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({
      type: 'view-options',
      options: expect.objectContaining({ fps: 15 }),
    }),
  );
  fireEvent.click(screen.getByRole('switch', { name: 'Remote cursor' }));
  expect(worker.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({
      type: 'view-options',
      options: {
        quality: 'best',
        customQuality: 50,
        fps: 15,
        remoteCursor: false,
      },
    }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Original size' }));
  expect(desktop.style.width).toBe('800px');
  expect(desktop.style.maxWidth).toBe('none');
  fireEvent.change(screen.getByLabelText('Zoom'), { target: { value: '1.5' } });
  expect(desktop.style.width).toBe('1200px');
  fireEvent.click(screen.getByRole('button', { name: 'Fit window' }));
  expect(desktop.style.maxWidth).toBe('100%');
  expect(
    screen.getByLabelText(
      'Remote desktop. Focus to send keyboard and mouse input.',
    ),
  ).toBe(desktop);
  openTool('Session');
  expect(
    (screen.getByRole('button', { name: 'Ctrl+Alt+Del' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  mode(true);
  expect(worker.postMessage).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'read-only', enabled: true }),
  );
  expect(desktop.tabIndex).toBe(-1);
  expect(
    (
      screen.getByRole('button', {
        name: 'Lock remote screen',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  const count = worker.postMessage.mock.calls.filter(
    ([m]) => m.type === 'paste',
  ).length;
  fireEvent.paste(desktop, {
    clipboardData: { items: [], getData: () => 'must-not-send' },
  });
  expect(
    worker.postMessage.mock.calls.filter(([m]) => m.type === 'paste'),
  ).toHaveLength(count);
  worker.emit({
    type: 'permissions',
    permissions: { keyboard: false, clipboard: true, audio: true, file: true },
    generation: worker.generation,
  });
  mode(false);
  expect(desktop.tabIndex).toBe(-1);
  expect(
    (
      screen.getByRole('button', {
        name: 'Lock remote screen',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});

test('双栏授权目录按需上传并直接接收，重名确认与收起不影响目录', async () => {
  const write = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const close = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const abort = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const getFile = jest
    .fn<() => Promise<File>>()
    .mockResolvedValue(new File(['local'], 'local.txt'));
  const localFile = { kind: 'file', name: 'local.txt', getFile };
  const received = {
    kind: 'file',
    name: 'remote.txt',
    createWritable: jest
      .fn<() => Promise<object>>()
      .mockResolvedValue({ write, close, abort }),
  };
  const root = {
    kind: 'directory',
    name: 'Chosen',
    async *entries() {
      yield ['local.txt', localFile];
    },
    queryPermission: async () => 'granted',
    getFileHandle: jest
      .fn<(name: string, options?: { create?: boolean }) => Promise<object>>()
      .mockResolvedValue(received),
  };
  Object.assign(window, {
    showDirectoryPicker: jest
      .fn<() => Promise<object>>()
      .mockResolvedValue(root),
  });
  try {
    await start();
    await openFileTool();
    const fileGeneration = Number(
      worker.postMessage.mock.calls.find(
        ([m]) => m.type === 'files-connect',
      )![0].fileGeneration,
    );
    worker.emit({
      type: 'files-state',
      state: 'connected',
      generation: worker.generation,
      fileGeneration,
    });
    const emit = (event: object) =>
      worker.emit({
        type: 'files-event',
        event,
        generation: worker.generation,
        fileGeneration,
      });
    emit({
      type: 'directory',
      path: 'C:/Files',
      entries: [
        {
          name: 'remote.txt',
          path: 'C:/Files/remote.txt',
          size: 1,
          directory: false,
        },
      ],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Choose folder' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'local.txt' })).toBeTruthy(),
    );
    expect(getFile).not.toHaveBeenCalled();
    expect(screen.queryByText('File upload and download')).toBeNull();
    expect(
      screen
        .getByRole('button', { name: 'Upload files' })
        .closest('[data-file-pane]')
        ?.getAttribute('data-file-pane'),
    ).toBe('remote');
    expect(
      screen.getByRole('button', { name: 'Save to this computer' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'local.txt' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Send to remote folder' }),
    );
    await waitFor(() =>
      expect(worker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: expect.objectContaining({
            type: 'upload',
            path: 'C:/Files',
          }),
        }),
      ),
    );
    expect(getFile).toHaveBeenCalledTimes(1);
    emit({
      type: 'progress',
      progress: {
        id: 1,
        name: 'local.txt',
        direction: 'upload',
        phase: 'done',
        total: 5,
        transferred: 5,
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'remote.txt' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Receive in local folder' }),
    );
    await waitFor(() =>
      expect(
        screen.getByText(/A local file with this name exists/),
      ).toBeTruthy(),
    );
    expect(received.createWritable).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Overwrite local file' }),
    );
    await waitFor(() =>
      expect(worker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: {
            type: 'download',
            name: 'remote.txt',
            size: 1,
            path: 'C:/Files/remote.txt',
          },
        }),
      ),
    );
    emit({
      type: 'progress',
      progress: {
        id: 2,
        name: 'remote.txt',
        direction: 'download',
        phase: 'waiting',
        total: 1,
        transferred: 0,
      },
    });
    emit({ type: 'chunk', id: 2, sequence: 1, bytes: new Uint8Array([7]) });
    await waitFor(() =>
      expect(worker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: { type: 'consumed', id: 2, sequence: 1, ok: true },
        }),
      ),
    );
    emit({ type: 'download-done', id: 2, sequence: 2 });
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(write).toHaveBeenCalledTimes(1);
    expect(abort).not.toHaveBeenCalled();
    const count = worker.postMessage.mock.calls.filter(
      ([m]) => m.type === 'files-connect',
    ).length;
    hideFiles();
    await openFileTool();
    expect(value('Path within the selected local folder')).toBe('/');
    expect(
      worker.postMessage.mock.calls.filter(([m]) => m.type === 'files-connect'),
    ).toHaveLength(count);
  } finally {
    Reflect.deleteProperty(window, 'showDirectoryPicker');
  }
});

test('密码输入与统一动作组分开；取消与主操作同组且空密码不能发送', async () => {
  const view = await start();
  worker.emit({
    type: 'state',
    state: 'authenticating',
    generation: worker.generation,
  });
  const password = screen.getByLabelText('Remote device password');
  const actions = view.container.querySelector('[data-stage-actions]');
  const connect = screen.getByRole('button', {
    name: 'Connect',
  }) as HTMLButtonElement;
  const cancel = screen.getByRole('button', { name: 'Cancel connection' });
  expect(actions?.contains(connect)).toBe(true);
  expect(actions?.contains(cancel)).toBe(true);
  expect(actions?.contains(password)).toBe(false);
  expect(connect.disabled).toBe(true);
  const count = worker.postMessage.mock.calls.length;
  fireEvent.click(connect);
  expect(worker.postMessage).toHaveBeenCalledTimes(count);
  fireEvent.keyDown(password, { key: 'Enter', code: 'Enter' });
  expect(worker.postMessage).toHaveBeenCalledTimes(count);
  fireEvent.change(password, { target: { value: 'test-password' } });
  expect(connect.disabled).toBe(false);
  fireEvent.keyDown(password, { key: 'Enter', code: 'Enter' });
  expect(worker.postMessage).toHaveBeenCalledTimes(count + 1);
  expect(worker.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: 'password', password: 'test-password' }),
  );
  expect((password as HTMLInputElement).value).toBe('');
  expect(connect.disabled).toBe(true);
  fireEvent.click(cancel);
  expect(screen.queryByLabelText('Remote device password')).toBeNull();
});

test('文件表头固定在条目滚动区之外；上传保存位于远端栏且目标仍使用已加载目录', async () => {
  const view = await start();
  await openFileTool();
  const fileConnect = worker.postMessage.mock.calls.find(
    ([m]) => m.type === 'files-connect',
  )?.[0];
  if (!fileConnect) throw new Error('Missing file connection');
  const fileGeneration = fileConnect.fileGeneration;
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
      path: 'C:/Loaded',
      entries: [
        {
          name: 'report.txt',
          path: 'C:/Loaded/report.txt',
          size: 100,
          directory: false,
        },
      ],
    },
  });
  for (const pane of ['local', 'remote']) {
    const header = view.container.querySelector(`[data-file-header="${pane}"]`);
    const list = view.container.querySelector(`[data-file-list="${pane}"]`);
    expect(header?.parentElement).toBe(list?.parentElement);
    expect(list?.contains(header)).toBe(false);
  }
  expect(view.container.querySelector('[data-file-fallback]')).toBeNull();
  expect(
    screen
      .getByRole('button', { name: 'Upload files' })
      .closest('[data-file-pane]')
      ?.getAttribute('data-file-pane'),
  ).toBe('remote');
  fireEvent.change(screen.getByLabelText('Remote directory'), {
    target: { value: 'C:/Unloaded' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Upload files' }));
  fireEvent.change(screen.getByLabelText('Upload to this folder'), {
    target: { files: [new File(['x'], 'x.txt')] },
  });
  expect(worker.postMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      command: expect.objectContaining({ type: 'upload', path: 'C:/Loaded' }),
    }),
  );
});

test('关闭剪贴板同步废弃读取中的PNG、远端重试和旧内容，恢复只接受新代次', async () => {
  const desktop = await readyDesktop();
  let finish!: (value: ArrayBuffer) => void;
  fireEvent.paste(desktop, {
    clipboardData: {
      items: [
        {
          kind: 'file',
          type: 'image/png',
          getAsFile: () => ({
            size: 2,
            arrayBuffer: () =>
              new Promise<ArrayBuffer>((resolve) => {
                finish = resolve;
              }),
          }),
        },
      ],
      getData: () => '',
    },
  });
  const oldEpoch = Number(
    worker.postMessage.mock.calls
      .filter(([m]) => m.type === 'clipboard-context')
      .at(-1)?.[0].clipboardGeneration,
  );
  openTool('Session');
  fireEvent.click(screen.getByRole('switch', { name: 'Clipboard sync' }));
  expect(worker.postMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'clipboard-context',
      enabled: false,
    }),
  );
  await act(async () => finish(new Uint8Array([1, 2]).buffer));
  expect(
    worker.postMessage.mock.calls.filter(([m]) => m.type === 'paste'),
  ).toHaveLength(0);
  worker.emit({
    type: 'clipboard',
    text: 'blocked',
    generation: worker.generation,
  });
  expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('switch', { name: 'Clipboard sync' }));
  worker.emit({
    type: 'clipboard',
    text: 'old',
    clipboardGeneration: oldEpoch,
    generation: worker.generation,
  });
  expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  worker.emit({
    type: 'clipboard',
    text: 'fresh',
    generation: worker.generation,
  });
  await waitFor(() =>
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('fresh'),
  );
  worker.emit({
    type: 'permissions',
    permissions: { keyboard: true, clipboard: false, audio: true, file: true },
    generation: worker.generation,
  });
  expect(
    (
      screen.getByRole('switch', {
        name: 'Clipboard sync',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});

test('键鼠映射切换先按原身份释放软修饰键，新按键映射且只读禁用设置', async () => {
  await readyDesktop();
  openTool('Keyboard');
  fireEvent.click(screen.getByRole('switch', { name: 'Swap Ctrl/Command' }));
  openKeyboard();
  fireEvent.click(screen.getByRole('button', { name: 'Send Left Ctrl key' }));
  expect(worker.postMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'input',
      input: {
        keyEvent: {
          controlKey: hbb.ControlKey.Meta,
          down: true,
          mode: hbb.KeyboardMode.Legacy,
          modifiers: undefined,
        },
      },
    }),
  );
  openTool('Keyboard');
  fireEvent.click(screen.getByRole('switch', { name: 'Swap Ctrl/Command' }));
  const keys = worker.postMessage.mock.calls.filter(
    ([m]) => m.type === 'input',
  );
  expect(keys.at(-1)?.[0].input).toEqual({
    keyEvent: {
      controlKey: hbb.ControlKey.Meta,
      down: false,
      mode: hbb.KeyboardMode.Legacy,
      modifiers: undefined,
    },
  });
  openKeyboard();
  fireEvent.click(screen.getByRole('button', { name: 'Send Left Ctrl key' }));
  expect(worker.postMessage.mock.calls.at(-1)?.[0].input).toEqual({
    keyEvent: {
      controlKey: hbb.ControlKey.Control,
      down: true,
      mode: hbb.KeyboardMode.Legacy,
      modifiers: undefined,
    },
  });
  mode(true);
  openTool('Keyboard');
  expect(
    (
      screen.getByRole('switch', {
        name: 'Reverse mouse wheel',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});

test('监测只在可见且连接时按秒请求，绘制数独立于解码数，关闭停止轮询', async () => {
  jest.useFakeTimers();
  try {
    await readyDesktop();
    openTool('Display');
    fireEvent.click(screen.getByRole('button', { name: 'Quality monitor' }));
    const request = () =>
      worker.postMessage.mock.calls
        .filter(([m]) => m.type === 'metrics')
        .at(-1)?.[0].request;
    const metrics = () =>
      worker.emit({
        type: 'metrics',
        generation: worker.generation,
        request: request(),
        displayGeneration: 0,
        decoded: 900,
        videoBytes: 1000,
        delay: 42,
      });
    metrics();
    expect(
      screen.getByRole('complementary', { name: 'Quality monitor' }),
    ).toBeDefined();
    expect(screen.getByText('42 ms')).toBeDefined();
    act(() => jest.advanceTimersByTime(1000));
    worker.emit({
      type: 'frame',
      generation: worker.generation,
      displayGeneration: 0,
      frame: { displayWidth: 800, displayHeight: 600, close: jest.fn() },
    });
    worker.emit({
      type: 'metrics',
      generation: worker.generation,
      request: request(),
      displayGeneration: 0,
      decoded: 9900,
      videoBytes: 126000,
      delay: 42,
    });
    expect(screen.getByText('1.0 FPS')).toBeDefined();
    expect(screen.getByText('1.00 Mbps')).toBeDefined();
    const count = worker.postMessage.mock.calls.filter(
      ([m]) => m.type === 'metrics',
    ).length;
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    fireEvent(document, new Event('visibilitychange'));
    act(() => jest.advanceTimersByTime(3000));
    expect(
      worker.postMessage.mock.calls.filter(([m]) => m.type === 'metrics'),
    ).toHaveLength(count);
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    fireEvent(document, new Event('visibilitychange'));
    metrics();
    expect(screen.queryByText('1.0 FPS')).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Close quality monitor' }),
    );
    const closed = worker.postMessage.mock.calls.filter(
      ([m]) => m.type === 'metrics',
    ).length;
    act(() => jest.advanceTimersByTime(3000));
    expect(
      worker.postMessage.mock.calls.filter(([m]) => m.type === 'metrics'),
    ).toHaveLength(closed);
    expect(
      screen.queryByRole('complementary', { name: 'Quality monitor' }),
    ).toBeNull();
  } finally {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    cleanup();
    jest.useRealTimers();
  }
});

test('配置清理Worker时同时停止质量轮询，不留下空计时器', async () => {
  jest.useFakeTimers();
  try {
    const view = await start();
    openTool('Display');
    fireEvent.click(screen.getByRole('button', { name: 'Quality monitor' }));
    expect(jest.getTimerCount()).toBeGreaterThan(0);
    mockConfiguration = { enabled: false };
    view.rerender(React.createElement(WebClientPage));
    act(() => jest.advanceTimersByTime(3000));
    expect(
      screen.queryByRole('complementary', { name: 'Quality monitor' }),
    ).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    cleanup();
    jest.useRealTimers();
  }
});

test('聊天纯文本、未读和浮窗关闭保留消息，断开清理历史', async () => {
  await readyDesktop();
  worker.emit({
    type: 'chat',
    text: '<script>hello</script>',
    incoming: true,
    generation: worker.generation,
  });
  const open = screen.getByRole('button', { name: 'Chat' });
  expect(open.textContent).toContain('1');
  fireEvent.click(open);
  expect(screen.getByText('<script>hello</script>')).toBeTruthy();
  expect(document.querySelector('[data-chat-dialog] script')).toBeNull();
  fireEvent.change(screen.getByLabelText('Message'), {
    target: { value: '网页消息' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  const command = worker.postMessage.mock.calls
    .map(([m]) => m as Record<string, unknown>)
    .find((m) => m.type === 'chat');
  expect(command).toMatchObject({ text: '网页消息' });
  worker.emit({
    type: 'chat',
    text: '网页消息',
    incoming: false,
    ok: true,
    request: command?.request,
    generation: worker.generation,
  });
  expect(screen.getByText('网页消息')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.queryByRole('dialog', { name: 'Chat' })).toBeNull();
  fireEvent.click(open);
  expect(screen.getByText('网页消息')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
  expect(screen.queryByText('网页消息')).toBeNull();
});

test('显示编码按双方能力提供，监测使用真实收到格式而非偏好', async () => {
  await readyDesktop();
  worker.emit({
    type: 'ready',
    secureContext: true,
    videoDecoder: true,
    videoCapabilities: {
      vp9: true,
      vp8: true,
      av1: false,
      vp9_444: true,
      av1_444: false,
    },
    generation: 0,
  });
  worker.emit({
    type: 'encoding',
    encoding: { vp8: true, av1: true, i444: { vp9: true } },
    generation: worker.generation,
  });
  worker.emit({
    type: 'video-format',
    format: { codec: 'vp8', chroma: '4:2:0' },
    displayGeneration: 0,
    generation: worker.generation,
  });
  openTool('Display');
  fireEvent.click(
    screen.getByText('Codec and true color', { selector: 'summary' }),
  );
  const selector = screen.getByLabelText('Codec');
  expect(
    (selector.querySelector('option[value="av1"]') as HTMLOptionElement)
      .disabled,
  ).toBe(true);
  fireEvent.change(selector, { target: { value: 'vp9' } });
  fireEvent.click(screen.getByRole('switch', { name: 'True color 4:4:4' }));
  expect(worker.postMessage).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'codec', prefer: 'vp9', trueColor: true }),
  );
  expect(screen.getByText(/VP8 4:2:0/)).toBeTruthy();
});

test('记住密码默认未勾选，账号范围随连接发Worker，主动勾选与清除各发真实命令', async () => {
  mockAccount = 'fixture-account';
  await start();
  expect(worker.postMessage).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'connect', account: 'fixture-account' }),
  );
  worker.emit({
    type: 'state',
    state: 'authenticating',
    generation: worker.generation,
  });
  const checkbox = screen.getByRole('checkbox', {
    name: 'Remember password',
  }) as HTMLInputElement;
  expect(checkbox.checked).toBe(false);
  expect(checkbox.disabled).toBe(false);
  fireEvent.click(checkbox);
  fireEvent.change(screen.getByLabelText('Remote device password'), {
    target: { value: 'fixture secret' },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
  });
  expect(worker.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({
      type: 'password',
      remember: true,
      password: 'fixture secret',
    }),
  );
  worker.emit({
    type: 'state',
    state: 'connected',
    generation: worker.generation,
  });
  worker.emit({
    type: 'credential-status',
    status: 'saved',
    generation: worker.generation,
  });
  openTool('Session');
  expect(
    screen.getByText('Device password saved in this browser'),
  ).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: 'Forget password' }));
  expect(
    worker.postMessage.mock.calls.filter(([m]) => m.type === 'forget-password'),
  ).toHaveLength(1);
  worker.emit({
    type: 'credential-status',
    status: 'forgotten',
    generation: worker.generation,
  });
  expect(screen.getByText('Saved password cleared.')).toBeDefined();
});
