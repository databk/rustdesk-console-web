/* RustDesk Console Service Worker */
// 发布脚本用同次页面构建的内容身份替换此值，不能用基线提交代替。
const BUILD_ID = '__CONSOLE_BUILD_ID__';
const APP_SCOPE = self.registration.scope;
const APP_PATH = new URL(APP_SCOPE).pathname;
const CACHE_PREFIX = `rustdesk-console:${encodeURIComponent(APP_PATH)}:`;
const CACHE_VERSION = `${CACHE_PREFIX}${BUILD_ID}`;
const appUrl = (path = '') => new URL(path, APP_SCOPE).pathname;
const PRECACHE_URLS = [appUrl(), appUrl('logo.svg'), appUrl('manifest.json')];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) =>
        cache.addAll(
          PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' })),
        ),
      ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                (key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION) ||
                (APP_PATH === '/' && key === 'rustdesk-console-v1'),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'skip-waiting') {
    const port = event.ports?.[0];
    event.waitUntil(
      Promise.resolve()
        .then(() => self.skipWaiting())
        .then(
          () => port?.postMessage({ error: null }),
          () => port?.postMessage({ error: 'activation-failed' }),
        ),
    );
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_PATH))
    return;

  if (request.mode === 'navigate') {
    let cacheWrite = Promise.resolve();
    const navigation = fetch(request)
      .then((response) => {
        if (
          response.ok &&
          response.headers.get('content-type')?.includes('text/html')
        ) {
          const copy = response.clone();
          cacheWrite = caches
            .open(CACHE_VERSION)
            .then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches
          .open(CACHE_VERSION)
          .then(
            async (cache) =>
              (await cache.match(request)) || cache.match(appUrl()),
          ),
      );
    event.respondWith(navigation);
    event.waitUntil(navigation.then(() => cacheWrite).catch(() => {}));
    return;
  }

  // 只有内容哈希地址可用 cache-first；稳定路径脚本、API及版本清单直走网络。
  const isStaticAsset =
    /[.-][a-f0-9]{8,}\.(?:js|css|wasm|svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)$/.test(
      url.pathname,
    );

  if (isStaticAsset) {
    let cacheWrite = Promise.resolve();
    const asset = caches
      .open(CACHE_VERSION)
      .then((cache) => cache.match(request))
      .then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            cacheWrite = caches
              .open(CACHE_VERSION)
              .then((cache) => cache.put(request, copy));
          }
          return response;
        });
      });
    event.respondWith(asset);
    event.waitUntil(asset.then(() => cacheWrite).catch(() => {}));
    return;
  }
});
