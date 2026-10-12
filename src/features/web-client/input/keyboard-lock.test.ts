/** @jest-environment jsdom */
import { afterEach, expect, jest, test } from '@jest/globals';
import { RemoteKeyboardLock } from './keyboard-lock';

const cleanup: (() => void)[] = [];
afterEach(() => {
  cleanup.splice(0).forEach((stop) => {
    stop();
  });
  jest.restoreAllMocks();
  document.body.replaceChildren();
});
function setup() {
  const canvas = document.createElement('canvas'),
    workspace = document.createElement('div');
  workspace.append(canvas);
  document.body.append(workspace);
  canvas.tabIndex = 0;
  let fullscreen: Element | null = null;
  jest.spyOn(document, 'hasFocus').mockReturnValue(true);
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => fullscreen,
  });
  const keyboard = {
    lock: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    unlock: jest.fn(),
  };
  const status = jest.fn();
  let allowed = true;
  const lock = new RemoteKeyboardLock(
    canvas,
    workspace,
    () => allowed,
    status,
    keyboard,
  );
  cleanup.push(() => lock.dispose());
  return {
    canvas,
    workspace,
    keyboard,
    status,
    lock,
    full: (value: boolean) => {
      fullscreen = value ? workspace : null;
      document.dispatchEvent(new Event('fullscreenchange'));
    },
    revoke: () => {
      allowed = false;
      lock.release();
    },
  };
}
test('普通画面不请求，全屏画面焦点才锁定，表单焦点与退出释放', async () => {
  const f = setup();
  f.canvas.focus();
  expect(f.keyboard.lock).not.toHaveBeenCalled();
  f.full(true);
  await Promise.resolve();
  expect(f.status).toHaveBeenLastCalledWith('locked');
  const field = document.createElement('input');
  f.workspace.append(field);
  field.focus();
  expect(f.status).toHaveBeenLastCalledWith('idle');
  expect(f.keyboard.unlock).toHaveBeenCalled();
  f.full(false);
  expect(f.status).toHaveBeenLastCalledWith('idle');
});
test('拒绝不称锁定且不自动反复请求；不支持有真实状态', async () => {
  const f = setup();
  f.keyboard.lock.mockRejectedValue(new Error('denied'));
  f.full(true);
  f.canvas.focus();
  await Promise.resolve();
  await Promise.resolve();
  f.lock.activate();
  expect(f.status).toHaveBeenLastCalledWith('denied');
  expect(f.keyboard.lock).toHaveBeenCalledTimes(1);
  f.canvas.blur();
  expect(f.status).toHaveBeenLastCalledWith('denied');
  f.lock.dispose();
  expect(f.status).toHaveBeenLastCalledWith('idle');
  const unsupported = new RemoteKeyboardLock(
    f.canvas,
    f.workspace,
    () => true,
    f.status,
    {} as never,
  );
  cleanup.push(() => unsupported.dispose());
  f.canvas.focus();
  unsupported.activate();
  expect(f.status).toHaveBeenLastCalledWith('unsupported');
});
test('迟到授权在blur、撤权和退出后解锁，不恢复旧状态', async () => {
  const f = setup();
  let finish!: () => void;
  f.keyboard.lock.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  f.full(true);
  f.canvas.focus();
  expect(f.status).toHaveBeenLastCalledWith('requesting');
  f.revoke();
  f.full(false);
  window.dispatchEvent(new Event('blur'));
  finish();
  await Promise.resolve();
  expect(f.status).toHaveBeenLastCalledWith('idle');
  expect(f.keyboard.unlock).toHaveBeenCalled();
});

async function settle() {
  for (let index = 0; index < 5; index++) await Promise.resolve();
}

test('跨实例串行等待旧授权，旧实例的迟到结果或再次释放不解除新锁', async () => {
  const f = setup();
  const finishes: (() => void)[] = [];
  f.keyboard.lock.mockImplementation(
    () => new Promise((resolve) => finishes.push(resolve)),
  );
  f.full(true);
  f.canvas.focus();
  f.lock.dispose();
  const status = jest.fn();
  const next = new RemoteKeyboardLock(
    f.canvas,
    f.workspace,
    () => true,
    status,
    f.keyboard,
  );
  cleanup.push(() => next.dispose());
  next.activate();
  expect(f.keyboard.lock).toHaveBeenCalledTimes(1);
  expect(status).toHaveBeenLastCalledWith('requesting');
  finishes[0]();
  await settle();
  expect(f.keyboard.lock).toHaveBeenCalledTimes(2);
  expect(status).toHaveBeenLastCalledWith('requesting');
  finishes[1]();
  await settle();
  expect(status).toHaveBeenLastCalledWith('locked');
  const releases = f.keyboard.unlock.mock.calls.length;
  f.lock.release();
  f.lock.dispose();
  expect(f.keyboard.unlock).toHaveBeenCalledTimes(releases);
  expect(status).toHaveBeenLastCalledWith('locked');
  next.dispose();
  expect(f.keyboard.unlock).toHaveBeenCalledTimes(releases + 1);
});

test('排队的新实例退出全屏后不因旧授权完成而再次请求', async () => {
  const f = setup();
  let finish!: () => void;
  f.keyboard.lock.mockImplementation(
    () => new Promise((resolve) => (finish = resolve)),
  );
  f.full(true);
  f.canvas.focus();
  f.lock.dispose();
  const status = jest.fn();
  const next = new RemoteKeyboardLock(
    f.canvas,
    f.workspace,
    () => true,
    status,
    f.keyboard,
  );
  cleanup.push(() => next.dispose());
  next.activate();
  f.full(false);
  finish();
  await settle();
  expect(f.keyboard.lock).toHaveBeenCalledTimes(1);
  expect(status).toHaveBeenLastCalledWith('idle');
});

test('同实例授权在途时重新聚焦先清理旧请求再重试', async () => {
  const f = setup();
  let finish!: () => void;
  f.keyboard.lock.mockImplementationOnce(
    () => new Promise((resolve) => (finish = resolve)),
  );
  f.full(true);
  f.canvas.focus();
  f.canvas.blur();
  f.canvas.focus();
  expect(f.keyboard.lock).toHaveBeenCalledTimes(1);
  finish();
  await settle();
  expect(f.keyboard.lock).toHaveBeenCalledTimes(2);
  await settle();
  expect(f.status).toHaveBeenLastCalledWith('locked');
});

test('旧请求拒绝后仅继续仍有资格的排队实例', async () => {
  const f = setup();
  let reject!: (error: Error) => void;
  f.keyboard.lock.mockImplementationOnce(
    () => new Promise((_resolve, fail) => (reject = fail)),
  );
  f.full(true);
  f.canvas.focus();
  f.lock.dispose();
  const status = jest.fn();
  const next = new RemoteKeyboardLock(
    f.canvas,
    f.workspace,
    () => true,
    status,
    f.keyboard,
  );
  cleanup.push(() => next.dispose());
  next.activate();
  reject(new Error('denied'));
  await settle();
  await settle();
  expect(f.keyboard.lock).toHaveBeenCalledTimes(2);
  expect(status).toHaveBeenLastCalledWith('locked');
  expect(f.status).toHaveBeenLastCalledWith('idle');
});
