const UPDATE_TIMEOUT_MS = 10000;
const CACHE_PREFIX = 'rustdesk-console:';

function deadline<T>(operation: Promise<T>, cancel?: () => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cancel?.();
      reject(new Error('Page update timed out'));
    }, UPDATE_TIMEOUT_MS);
    operation.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

export async function clearAppCaches(
  scope: string,
  storage: CacheStorage | undefined,
): Promise<void> {
  if (!storage) return;
  const appPath = new URL(scope).pathname;
  const prefix = `${CACHE_PREFIX}${encodeURIComponent(appPath)}:`;
  const keys = await storage.keys();
  await Promise.all(
    keys
      .filter(
        (key) =>
          key.startsWith(prefix) ||
          (appPath === '/' && key === 'rustdesk-console-v1'),
      )
      .map((key) => storage.delete(key)),
  );
}

function waitForInstalled(worker: ServiceWorker): Promise<void> {
  return new Promise((resolve, reject) => {
    const check = () => {
      if (worker.state === 'redundant')
        finish(new Error('Service worker installation failed'));
      else if (worker.state !== 'installing') finish();
    };
    const finish = (error?: Error) => {
      clearTimeout(timer);
      worker.removeEventListener('statechange', check);
      if (error) reject(error);
      else resolve();
    };
    const timer = setTimeout(
      () => finish(new Error('Service worker installation timed out')),
      UPDATE_TIMEOUT_MS,
    );
    worker.addEventListener('statechange', check);
    check();
  });
}

export function activateWaitingWorker(worker: ServiceWorker): Promise<void> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const finish = (error?: Error) => {
      clearTimeout(timer);
      worker.removeEventListener('statechange', check);
      channel.port1.onmessage = null;
      channel.port1.onmessageerror = null;
      channel.port1.close();
      channel.port2.close();
      if (error) reject(error);
      else resolve();
    };
    const check = () => {
      // 兼容已经激活、但旧实现没有回复 ACK 的 Worker；激活才可刷新。
      if (worker.state === 'activated') finish();
      else if (worker.state === 'redundant')
        finish(new Error('Service worker activation failed'));
    };
    const timer = setTimeout(
      () => finish(new Error('Service worker activation timed out')),
      UPDATE_TIMEOUT_MS,
    );
    worker.addEventListener('statechange', check);
    channel.port1.onmessage = (event) => {
      if (event.data?.error)
        finish(new Error('Service worker rejected the update'));
      else check();
    };
    channel.port1.onmessageerror = () =>
      finish(new Error('Invalid service worker acknowledgement'));
    if (worker.state === 'activated') {
      finish();
      return;
    }
    try {
      worker.postMessage({ type: 'skip-waiting' }, [channel.port2]);
    } catch {
      finish(new Error('Unable to request service worker activation'));
    }
  });
}

interface PageUpdateEnvironment {
  scope: string;
  serviceWorker?: ServiceWorkerContainer;
  caches?: CacheStorage;
  fetch: typeof fetch;
  reload: () => void;
}

export function createPageUpdater(environment: PageUpdateEnvironment) {
  let pending: Promise<void> | undefined;
  let reloaded = false;
  return (): Promise<void> => {
    if (pending) return pending;
    if (reloaded) return Promise.resolve();
    const update = async () => {
      // 清缓存和切换控制器之前确认新页面在线，离线不破坏现有会话。
      const controller = new AbortController();
      await deadline(
        (async () => {
          const response = await environment.fetch(
            new URL('index.html', environment.scope).href,
            {
              cache: 'no-store',
              signal: controller.signal,
              headers: { Accept: 'text/html' },
            },
          );
          if (
            !response.ok ||
            !response.headers.get('content-type')?.includes('text/html')
          )
            throw new Error('Updated page unavailable');
          if (!/<!doctype html|<html[\s>]/i.test(await response.text()))
            throw new Error('Invalid updated page');
        })(),
        () => controller.abort(),
      );
      const currentRegistration = async () => {
        const value = await deadline(
          environment.serviceWorker?.getRegistration(environment.scope) ||
            Promise.resolve(undefined),
        );
        return value?.scope === environment.scope ? value : undefined;
      };
      let registration = await currentRegistration();
      if (registration?.installing) {
        await waitForInstalled(registration.installing);
        registration = await currentRegistration();
      }
      if (registration?.waiting)
        await activateWaitingWorker(registration.waiting);
      await deadline(clearAppCaches(environment.scope, environment.caches));
      reloaded = true;
      environment.reload();
    };
    pending = update().finally(() => {
      pending = undefined;
    });
    return pending;
  };
}

export async function registerAppServiceWorker(
  container: ServiceWorkerContainer,
  scope: string,
  notify: () => void,
): Promise<ServiceWorkerRegistration> {
  const registration = await container.register(new URL('sw.js', scope).href, {
    scope,
    updateViaCache: 'none',
  });
  const observe = () => {
    const worker = registration.installing;
    if (!worker) return;
    const check = () => {
      if (worker.state === 'installed') {
        worker.removeEventListener('statechange', check);
        if (container.controller) notify();
      } else if (worker.state === 'redundant')
        worker.removeEventListener('statechange', check);
    };
    worker.addEventListener('statechange', check);
    check();
  };
  registration.addEventListener('updatefound', observe);
  observe();
  if (registration.waiting) notify();
  return registration;
}
