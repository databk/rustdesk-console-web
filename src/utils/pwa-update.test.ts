import { afterEach, expect, jest, test } from '@jest/globals';
import {
  activateWaitingWorker,
  clearAppCaches,
  createPageUpdater,
  registerAppServiceWorker,
} from './pwa-update';

class WorkerStub extends EventTarget {
  state: ServiceWorkerState = 'installed';
  postMessage = jest.fn<(data: unknown, ports: MessagePort[]) => void>();
  asWorker() {
    return this as unknown as ServiceWorker;
  }
  transition(state: ServiceWorkerState) {
    this.state = state;
    this.dispatchEvent(new Event('statechange'));
  }
}

function setup(waiting?: WorkerStub) {
  const registration = Object.assign(new EventTarget(), {
    scope: 'https://console.test/',
    waiting: waiting?.asWorker(),
    installing: undefined as ServiceWorker | undefined,
  });
  const serviceWorker = Object.assign(new EventTarget(), {
    controller: {} as ServiceWorker,
    getRegistration: jest.fn(async () => registration),
    register: jest.fn(
      async (_script: string | URL, _options?: RegistrationOptions) =>
        registration,
    ),
  });
  const storage = {
    keys: jest.fn(async () => ['rustdesk-console:%2F:old', 'other-app']),
    delete: jest.fn(async (_key: string) => true),
  };
  const fetchPage = jest.fn(
    async (_input: RequestInfo | URL, _options?: RequestInit) => ({
      ok: true,
      headers: { get: (_name: string): string => 'text/html; charset=utf-8' },
      text: async () => '<!doctype html><html><body>new page</body></html>',
    }),
  );
  const reload = jest.fn();
  const refresh = createPageUpdater({
    scope: registration.scope,
    serviceWorker: serviceWorker as unknown as ServiceWorkerContainer,
    caches: storage as unknown as CacheStorage,
    fetch: fetchPage as unknown as typeof fetch,
    reload,
  });
  return { registration, serviceWorker, storage, fetchPage, reload, refresh };
}

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('等待应用缓存删除后才刷新一次，无 waiting 也能刷新；重复点击合并', async () => {
  const value = setup();
  let release!: (value: boolean) => void;
  value.storage.delete.mockImplementation(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const first = value.refresh();
  expect(value.refresh()).toBe(first);
  for (let index = 0; index < 12; index++) await Promise.resolve();
  expect(value.storage.delete).toHaveBeenCalledWith('rustdesk-console:%2F:old');
  expect(value.reload).not.toHaveBeenCalled();
  release(true);
  await first;
  await value.refresh();
  expect(value.reload).toHaveBeenCalledTimes(1);
  expect(value.fetchPage).toHaveBeenCalledWith(
    'https://console.test/index.html',
    expect.objectContaining({ cache: 'no-store' }),
  );
});

test('只删除同应用 scope 缓存与根路径的历史缓存', async () => {
  const storage = {
    keys: async () => [
      'rustdesk-console-v1',
      'rustdesk-console:%2F:old',
      'rustdesk-console:%2Fapp%2F:old',
      'other-app',
    ],
    delete: jest.fn(async () => true),
  };
  await clearAppCaches(
    'https://console.test/app/',
    storage as unknown as CacheStorage,
  );
  expect(storage.delete.mock.calls).toEqual([
    ['rustdesk-console:%2Fapp%2F:old'],
  ]);
  storage.delete.mockClear();
  await clearAppCaches(
    'https://console.test/',
    storage as unknown as CacheStorage,
  );
  expect(storage.delete.mock.calls).toEqual([
    ['rustdesk-console-v1'],
    ['rustdesk-console:%2F:old'],
  ]);
});

test('离线不切换 Worker、不删除缓存且可重试', async () => {
  const worker = new WorkerStub();
  const value = setup(worker);
  value.fetchPage.mockRejectedValueOnce(new Error('offline'));
  await expect(value.refresh()).rejects.toThrow('offline');
  expect(worker.postMessage).not.toHaveBeenCalled();
  expect(value.storage.delete).not.toHaveBeenCalled();
  expect(value.reload).not.toHaveBeenCalled();
  value.registration.waiting = undefined;
  await value.refresh();
  expect(value.reload).toHaveBeenCalledTimes(1);
});

test.each([
  { ok: false, type: 'text/html', body: '<html>maintenance</html>' },
  { ok: true, type: 'application/json', body: '{}' },
  { ok: true, type: 'text/html', body: 'not html' },
])('不可用或非 HTML 响应不清理缓存和刷新：%j', async (response) => {
  const value = setup();
  value.fetchPage.mockResolvedValueOnce({
    ok: response.ok,
    headers: { get: (_name: string) => response.type },
    text: async () => response.body,
  });
  await expect(value.refresh()).rejects.toThrow();
  expect(value.storage.delete).not.toHaveBeenCalled();
  expect(value.reload).not.toHaveBeenCalled();
});

test('在线检查挂起有截止，终止请求且不重载', async () => {
  jest.useFakeTimers();
  const value = setup();
  value.fetchPage.mockImplementation(() => new Promise(() => {}));
  const result = expect(value.refresh()).rejects.toThrow('timed out');
  await jest.advanceTimersByTimeAsync(10000);
  await result;
  const options = value.fetchPage.mock.calls[0][1] as RequestInit;
  expect(options.signal?.aborted).toBe(true);
  expect(value.storage.delete).not.toHaveBeenCalled();
  expect(value.reload).not.toHaveBeenCalled();
});

test('当前 registration 重新查询，不使用通知产生时的旧 waiting', async () => {
  const value = setup();
  const installing = new WorkerStub();
  installing.state = 'installing';
  value.registration.installing = installing.asWorker();
  const current = new WorkerStub();
  current.postMessage.mockImplementation(() => current.transition('activated'));
  const result = value.refresh();
  for (let index = 0; index < 12; index++) await Promise.resolve();
  value.registration.waiting = current.asWorker();
  value.registration.installing = undefined;
  installing.transition('installed');
  await result;
  expect(current.postMessage).toHaveBeenCalledTimes(1);
  expect(value.serviceWorker.getRegistration).toHaveBeenCalledTimes(2);
  expect(value.reload).toHaveBeenCalledTimes(1);
});

test('ACK 本身不代表激活完成，等 activated 后关闭 channel/监听', async () => {
  const worker = new WorkerStub();
  const remove = jest.spyOn(worker, 'removeEventListener');
  const Constructor = globalThis.MessageChannel;
  const channel = new Constructor();
  const close = jest.spyOn(channel.port1, 'close');
  jest.spyOn(globalThis, 'MessageChannel').mockImplementation(() => channel);
  let settled = false;
  const operation = activateWaitingWorker(worker.asWorker()).then(() => {
    settled = true;
  });
  channel.port1.onmessage?.(
    new MessageEvent('message', { data: { error: null } }),
  );
  await Promise.resolve();
  expect(settled).toBe(false);
  worker.transition('activated');
  await operation;
  expect(remove).toHaveBeenCalledWith('statechange', expect.any(Function));
  expect(close).toHaveBeenCalledTimes(1);
  expect(channel.port1.onmessage).toBe(null);
});

test('旧 SW 没 ACK 但已激活也可完成；原本已激活无需发消息', async () => {
  const worker = new WorkerStub();
  worker.postMessage.mockImplementation(() => worker.transition('activated'));
  await activateWaitingWorker(worker.asWorker());
  const active = new WorkerStub();
  active.state = 'activated';
  await activateWaitingWorker(active.asWorker());
  expect(active.postMessage).not.toHaveBeenCalled();
});

test('无 ACK/未激活超时不永久挂起，清理 channel 和 statechange', async () => {
  jest.useFakeTimers();
  const worker = new WorkerStub();
  const remove = jest.spyOn(worker, 'removeEventListener');
  const result = expect(
    activateWaitingWorker(worker.asWorker()),
  ).rejects.toThrow('timed out');
  await jest.advanceTimersByTimeAsync(10000);
  await result;
  expect(remove).toHaveBeenCalledWith('statechange', expect.any(Function));
  expect(jest.getTimerCount()).toBe(0);
});

test('postMessage 异常与失败 ACK 不继续清缓存/刷新', async () => {
  const thrown = new WorkerStub();
  thrown.postMessage.mockImplementation(() => {
    throw new Error('closed');
  });
  await expect(activateWaitingWorker(thrown.asWorker())).rejects.toThrow(
    'Unable to request',
  );
  const worker = new WorkerStub();
  worker.postMessage.mockImplementation(
    (_data: unknown, ports: MessagePort[]) => {
      ports[0].postMessage({ error: 'activation-failed' });
    },
  );
  const value = setup(worker);
  await expect(value.refresh()).rejects.toThrow('rejected');
  expect(value.storage.delete).not.toHaveBeenCalled();
  expect(value.reload).not.toHaveBeenCalled();
});

test('缓存删除失败保留更新入口重试，不能刷新后才发现删除未完成', async () => {
  const value = setup();
  value.storage.delete.mockRejectedValueOnce(new Error('cache failure'));
  await expect(value.refresh()).rejects.toThrow('cache failure');
  expect(value.reload).not.toHaveBeenCalled();
  await value.refresh();
  expect(value.reload).toHaveBeenCalledTimes(1);
});

test('其它应用的父级 registration 不激活或注销', async () => {
  const worker = new WorkerStub();
  const value = setup(worker);
  value.registration.scope = 'https://console.test/other/';
  await value.refresh();
  expect(worker.postMessage).not.toHaveBeenCalled();
  expect(value.reload).toHaveBeenCalledTimes(1);
});

test('注册时已有 waiting 和后续 installed 均只通知，不自动激活', async () => {
  const waiting = new WorkerStub();
  const value = setup(waiting);
  const notify = jest.fn();
  await registerAppServiceWorker(
    value.serviceWorker as unknown as ServiceWorkerContainer,
    value.registration.scope,
    notify,
  );
  expect(notify).toHaveBeenCalledTimes(1);
  expect(value.serviceWorker.register).toHaveBeenCalledWith(
    'https://console.test/sw.js',
    { scope: value.registration.scope, updateViaCache: 'none' },
  );
  const next = new WorkerStub();
  next.state = 'installing';
  value.registration.installing = next.asWorker();
  value.registration.dispatchEvent(new Event('updatefound'));
  next.transition('installed');
  value.serviceWorker.dispatchEvent(new Event('controllerchange'));
  expect(notify).toHaveBeenCalledTimes(2);
  expect(waiting.postMessage).not.toHaveBeenCalled();
  expect(next.postMessage).not.toHaveBeenCalled();
  expect(value.reload).not.toHaveBeenCalled();
});
