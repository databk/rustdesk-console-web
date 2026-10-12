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
import React, { createRef } from 'react';
import { FilePanel } from './files';
import { LocalFileConflict } from '@/features/web-client/files/local-directory';
type RenderResult = import('@testing-library/react').RenderResult;
type FilePanelHandle = import('./files').FilePanelHandle;
type FilePanelStatus = import('./files').FilePanelStatus;
type LocalDirectoryHandle =
  import('@/features/web-client/files/local-directory').LocalDirectoryHandle;
type DownloadSink = import('@/features/web-client/files/download').DownloadSink;
type SessionCommand =
  import('@/features/web-client/worker/contract').SessionCommand;
type WorkerEvent = import('@/features/web-client/worker/contract').WorkerEvent;

const mockChooseDownload =
  jest.fn<(name: string, size: number) => Promise<DownloadSink>>();
const mockDirectoryDownload =
  jest.fn<
    (
      target: LocalDirectoryHandle,
      name: string,
      size: number,
      overwrite: boolean,
    ) => Promise<DownloadSink>
  >();
jest.mock('@/features/web-client/files/download', () => ({
  ...jest.requireActual<typeof import('@/features/web-client/files/download')>(
    '@/features/web-client/files/download',
  ),
  chooseDownload: (name: string, size: number) =>
    mockChooseDownload(name, size),
}));
jest.mock('@/features/web-client/files/local-directory', () => ({
  ...jest.requireActual<
    typeof import('@/features/web-client/files/local-directory')
  >('@/features/web-client/files/local-directory'),
  directoryDownload: (
    target: LocalDirectoryHandle,
    name: string,
    size: number,
    overwrite: boolean,
  ) => mockDirectoryDownload(target, name, size, overwrite),
}));
const post = jest.fn<(command: SessionCommand) => void>();
const status = jest.fn<(value: FilePanelStatus) => void>();
let ref = createRef<FilePanelHandle>();
let view: RenderResult;
let fileGeneration = 0;
const remoteFile = {
  name: 'remote.txt',
  path: 'C:/Loaded/remote.txt',
  size: 5,
  directory: false,
};
function downloadSink() {
  return {
    write: jest.fn<(bytes: Uint8Array) => Promise<void>>().mockResolvedValue(),
    close: jest.fn<() => Promise<void>>().mockResolvedValue(),
    abort: jest.fn<() => Promise<void>>().mockResolvedValue(),
  };
}
function emit(message: object) {
  act(() =>
    ref.current?.handle({
      generation: 1,
      fileGeneration,
      ...message,
    } as Extract<WorkerEvent, { fileGeneration: number }>),
  );
}
function directory(path = 'C:/Loaded') {
  emit({
    type: 'files-event',
    event: { type: 'directory', path, entries: [remoteFile] },
  });
}
function ready() {
  emit({ type: 'files-state', state: 'connected' });
  directory();
}
function progress(phase: 'waiting' | 'done' | 'conflict') {
  emit({
    type: 'files-event',
    event: {
      type: 'progress',
      progress: {
        id: 1,
        name: 'remote.txt',
        direction: 'download',
        phase,
        transferred: 0,
        total: 5,
      },
    },
  });
}
const root: LocalDirectoryHandle = {
  kind: 'directory',
  name: 'Chosen',
  async *entries() {},
  async getDirectoryHandle() {
    return root;
  },
  async getFileHandle() {
    throw new Error('Unused');
  },
  async queryPermission() {
    return 'granted';
  },
};

const mockAuthorizeFile = jest.fn<() => Promise<unknown>>();
const mockEndFile = jest.fn<() => Promise<unknown>>();
jest.mock('@/services/rustdesk-console/webClient', () => ({
  createWebClientFileSession: () => mockAuthorizeFile(),
  endWebClientSession: () => mockEndFile(),
  reportWebClientEvent: async () => ({ accepted: true }),
  webClientHttpStatus: (error: { response?: { status?: number } }) =>
    error?.response?.status,
  handleWebClientAuthError: jest.fn(),
}));

beforeEach(async () => {
  mockAuthorizeFile.mockReset().mockResolvedValue({
    sessionGuid: 'files-grant',
    gatewayPath: '/api/web-client/socket',
    tickets: { rendezvous: 'r', relay: 'l' },
    expiresAt: new Date(Date.now() + 60000).toISOString(),
  });
  mockEndFile.mockReset().mockResolvedValue({ ended: true });
  jest.clearAllMocks();
  ref = createRef<FilePanelHandle>();
  Object.assign(window, {
    showDirectoryPicker: jest
      .fn<() => Promise<LocalDirectoryHandle>>()
      .mockResolvedValue(root),
  });
  mockChooseDownload.mockResolvedValue(downloadSink());
  mockDirectoryDownload.mockResolvedValue(downloadSink());
  view = render(
    React.createElement(FilePanel, {
      ref,
      enabled: true,
      parentGuid: 'parent-grant',
      open: true,
      post,
      onStatusChange: status,
      text: (_key, fallback) => fallback,
    }),
  );
  await act(async () => {});
  const connect = post.mock.calls
    .map(([command]) => command)
    .find((command) => command.type === 'files-connect');
  if (connect?.type !== 'files-connect')
    throw new Error('Missing file connection');
  fileGeneration = connect.fileGeneration;
});
afterEach(cleanup);

test.each([
  ['AbortError', ''],
  ['SecurityError', 'fileSaveBlocked'],
  ['NotAllowedError', 'fileSaveDenied'],
  ['Error', 'files'],
])('保存窗口 %s 与实际传输失败分别处理', async (name, expected) => {
  ready();
  mockChooseDownload.mockRejectedValueOnce(
    Object.assign(new Error('private details'), { name }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'remote.txt' }));
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Save to this computer' }),
    ),
  );
  expect(status).toHaveBeenLastCalledWith(
    expect.objectContaining({ error: expected, busy: false }),
  );
  expect(
    post.mock.calls.some(
      ([item]) =>
        item.type === 'files-command' && item.command.type === 'download',
    ),
  ).toBe(false);
  expect(screen.queryByText('private details')).toBeNull();
});

test('保存失败后重新选中保存位置，清除旧文件错误而不等待刷新目录', async () => {
  ready();
  mockChooseDownload.mockRejectedValueOnce(new Error('save failed'));
  fireEvent.click(screen.getByRole('button', { name: 'remote.txt' }));
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Save to this computer' }),
    ),
  );
  expect(status).toHaveBeenLastCalledWith(
    expect.objectContaining({ error: 'files' }),
  );
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Save to this computer' }),
    ),
  );
  expect(status).toHaveBeenLastCalledWith(
    expect.objectContaining({ error: '' }),
  );
  expect(
    post.mock.calls.some(
      ([item]) =>
        item.type === 'files-command' && item.command.type === 'download',
    ),
  ).toBe(true);
  progress('waiting');
  progress('done');
  expect(status).toHaveBeenLastCalledWith(
    expect.objectContaining({ error: '', busy: false }),
  );
});

test('成功事件只清除文件操作错误，旧代次和认证错误不会被掩盖', () => {
  ready();
  emit({ type: 'files-error', code: 'files' });
  emit({
    type: 'files-event',
    fileGeneration: fileGeneration - 1,
    event: {
      type: 'progress',
      progress: {
        id: 1,
        phase: 'done',
        direction: 'download',
        name: 'old.txt',
        total: 5,
        transferred: 5,
      },
    },
  });
  expect(status).toHaveBeenLastCalledWith(
    expect.objectContaining({ error: 'files' }),
  );
  progress('done');
  expect(status).toHaveBeenLastCalledWith(
    expect.objectContaining({ error: '' }),
  );
  emit({ type: 'files-error', code: 'authorization' });
  progress('done');
  expect(status).toHaveBeenLastCalledWith(
    expect.objectContaining({ error: 'authorization' }),
  );
});

test('独立文件授权拒绝不会建立连接或显示假已连接', async () => {
  act(() => ref.current?.disconnect());
  const count = post.mock.calls.filter(
    ([command]) => command.type === 'files-connect',
  ).length;
  mockAuthorizeFile.mockRejectedValueOnce({ response: { status: 403 } });
  await act(async () => ref.current?.connect());
  expect(
    post.mock.calls.filter(([command]) => command.type === 'files-connect'),
  ).toHaveLength(count);
  expect(status).toHaveBeenLastCalledWith(
    expect.objectContaining({ state: 'failed', error: 'authorization' }),
  );
});
test('文件申请等待时取消，旧授权到达后结束，不能复活文件会话', async () => {
  act(() => ref.current?.disconnect());
  let resolve!: (value: unknown) => void;
  mockAuthorizeFile.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const count = post.mock.calls.filter(
    ([command]) => command.type === 'files-connect',
  ).length;
  act(() => {
    void ref.current?.connect();
  });
  act(() => ref.current?.disconnect());
  await act(async () =>
    resolve({
      sessionGuid: 'late-file',
      gatewayPath: '/api/web-client/socket',
      tickets: { rendezvous: 'r', relay: 'l' },
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    }),
  );
  expect(
    post.mock.calls.filter(([command]) => command.type === 'files-connect'),
  ).toHaveLength(count);
  expect(mockEndFile).toHaveBeenCalled();
});

test('上传与系统保存位于远端标题；空闲没有额外说明栏和状态栏', () => {
  ready();
  const upload = screen.getByRole('button', { name: 'Upload files' });
  const save = screen.getByRole('button', { name: 'Save to this computer' });
  expect(
    upload.closest('[data-file-pane]')?.getAttribute('data-file-pane'),
  ).toBe('remote');
  expect(save.closest('[data-file-pane]')?.getAttribute('data-file-pane')).toBe(
    'remote',
  );
  expect(document.querySelector('[data-file-fallback]')).toBeNull();
  expect(document.querySelector('[data-file-status]')).toBeNull();
  expect(
    screen.queryByText('Select a file and use the arrows to transfer it.'),
  ).toBeNull();
});

test('远端地址草稿和浏览失败不会改变系统上传目标，选择事务冻结目录并禁导航', () => {
  ready();
  const path = screen.getByLabelText('Remote directory');
  fireEvent.change(path, { target: { value: 'C:/Missing' } });
  fireEvent.keyDown(path, { key: 'Enter' });
  emit({ type: 'files-error', code: 'files' });
  fireEvent.click(screen.getByRole('button', { name: 'Upload files' }));
  expect((path as HTMLInputElement).disabled).toBe(true);
  expect(
    (screen.getByRole('button', { name: 'Choose folder' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(
    (
      screen.getByRole('button', {
        name: 'Choose a local folder',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.change(screen.getByLabelText('Upload to this folder'), {
    target: { files: [new File(['content'], 'local.txt')] },
  });
  expect(post).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'files-command',
      command: expect.objectContaining({ type: 'upload', path: 'C:/Loaded' }),
    }),
  );
  expect((path as HTMLInputElement).disabled).toBe(true);
  progress('waiting');
  progress('done');
  expect((path as HTMLInputElement).disabled).toBe(false);
});

test('取消系统选文件释放目标事务，旧代次返回的文件不能上传', () => {
  ready();
  const input = screen.getByLabelText('Upload to this folder');
  fireEvent.click(screen.getByRole('button', { name: 'Upload files' }));
  fireEvent(input, new Event('cancel', { bubbles: true }));
  expect(
    (screen.getByLabelText('Remote directory') as HTMLInputElement).disabled,
  ).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Upload files' }));
  act(() => ref.current?.dispose());
  fireEvent.change(input, {
    target: { files: [new File(['old'], 'old.txt')] },
  });
  expect(
    post.mock.calls.some(
      ([command]) =>
        command.type === 'files-command' && command.command.type === 'upload',
    ),
  ).toBe(false);
});

test('接收到本机目录仅在授权后可用；系统保存保持独立目标', async () => {
  ready();
  fireEvent.click(screen.getByRole('button', { name: 'remote.txt' }));
  expect(
    (
      screen.getByRole('button', {
        name: 'Receive in local folder',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.click(
    screen.getByRole('button', { name: 'Save to this computer' }),
  );
  await waitFor(() =>
    expect(mockChooseDownload).toHaveBeenCalledWith('remote.txt', 5),
  );
  expect(mockDirectoryDownload).not.toHaveBeenCalled();
  progress('waiting');
  progress('done');
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Choose folder' })),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Receive in local folder' }),
  );
  await waitFor(() =>
    expect(mockDirectoryDownload).toHaveBeenCalledWith(
      root,
      'remote.txt',
      5,
      false,
    ),
  );
});

test('本机同名冲突确认保留原目标，保留和覆盖均不绕过busy门禁', async () => {
  ready();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Choose folder' })),
  );
  fireEvent.click(screen.getByRole('button', { name: 'remote.txt' }));
  mockDirectoryDownload.mockRejectedValueOnce(new LocalFileConflict());
  fireEvent.click(
    screen.getByRole('button', { name: 'Receive in local folder' }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Overwrite local file' }),
    ).toBeTruthy(),
  );
  expect(
    (screen.getByRole('button', { name: 'Change folder' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(
    (screen.getByLabelText('Remote directory') as HTMLInputElement).disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Keep local file' }));
  expect(mockDirectoryDownload).toHaveBeenCalledTimes(1);
  mockDirectoryDownload.mockRejectedValueOnce(new LocalFileConflict());
  fireEvent.click(
    screen.getByRole('button', { name: 'Receive in local folder' }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Overwrite local file' }),
    ).toBeTruthy(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Overwrite local file' }));
  await waitFor(() =>
    expect(mockDirectoryDownload).toHaveBeenLastCalledWith(
      root,
      'remote.txt',
      5,
      true,
    ),
  );
});

test('收起保留独立文件会话和目录，标题接口可断开并重新连接', async () => {
  ready();
  const count = post.mock.calls.filter(
    ([command]) => command.type === 'files-connect',
  ).length;
  view.rerender(
    React.createElement(FilePanel, {
      ref,
      enabled: true,
      parentGuid: 'parent-grant',
      open: false,
      post,
      onStatusChange: status,
      text: (_key, fallback) => fallback,
    }),
  );
  directory('C:/WhileHidden');
  view.rerender(
    React.createElement(FilePanel, {
      ref,
      enabled: true,
      parentGuid: 'parent-grant',
      open: true,
      post,
      onStatusChange: status,
      text: (_key, fallback) => fallback,
    }),
  );
  expect(
    (screen.getByLabelText('Remote directory') as HTMLInputElement).value,
  ).toBe('C:/WhileHidden');
  expect(
    post.mock.calls.filter(([command]) => command.type === 'files-connect'),
  ).toHaveLength(count);
  act(() => ref.current?.disconnect());
  expect(post).toHaveBeenCalledWith({
    type: 'files-disconnect',
    fileGeneration,
  });
  expect(
    (screen.getByLabelText('Remote directory') as HTMLInputElement).value,
  ).toBe('');
  await act(async () => ref.current?.connect());
  expect(
    post.mock.calls.filter(([command]) => command.type === 'files-connect'),
  ).toHaveLength(count + 1);
  directory('C:/Old');
  expect(
    (screen.getByLabelText('Remote directory') as HTMLInputElement).value,
  ).toBe('');
});

test('文件等待状态不提前显示密码表单，真实失败仍可回退输入并取消', () => {
  emit({ type: 'files-state', state: 'awaitingApproval' });
  expect(screen.queryByLabelText('File session password')).toBeNull();
  expect(screen.getByRole('button', { name: 'Use password' })).toBeTruthy();
  emit({ type: 'files-error', code: 'password' });
  expect(screen.getByLabelText('File session password')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel connection' }));
  expect(post).toHaveBeenCalledWith({
    type: 'files-disconnect',
    fileGeneration,
  });
});

test('保存目标迟到后若文件权限已撤销，只中止旧写流而不发送下载', async () => {
  ready();
  const sink = downloadSink();
  let resolve: ((next: DownloadSink) => void) | undefined;
  mockChooseDownload.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'remote.txt' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Save to this computer' }),
  );
  act(() => ref.current?.dispose());
  await act(async () => {
    resolve?.(sink);
    await Promise.resolve();
  });
  expect(sink.abort).toHaveBeenCalledTimes(1);
  expect(
    post.mock.calls.some(
      ([command]) =>
        command.type === 'files-command' && command.command.type === 'download',
    ),
  ).toBe(false);
});
