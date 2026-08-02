/* globals workbox */
workbox.core.setCacheNameDetails({
  prefix: 'rustdesk-console',
  suffix: 'v1',
});
workbox.clientsClaim();

workbox.precaching.precacheAndRoute(self.__precacheManifest || []);

workbox.routing.registerNavigationRoute('/index.html');

workbox.routing.registerRoute(/\/api\//, workbox.strategies.networkFirst());

workbox.routing.registerRoute(
  /^https:\/\/cdn\./,
  workbox.strategies.cacheFirst({
    cacheName: 'rustdesk-console-cdn',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
      new workbox.cacheableResponse.Plugin({
        statuses: [0, 200],
      }),
    ],
  }),
);

addEventListener('message', (event) => {
  const replyPort = event.ports[0];
  const message = event.data;
  if (replyPort && message && message.type === 'skip-waiting') {
    event.waitUntil(
      self.skipWaiting().then(
        () => {
          replyPort.postMessage({
            error: null,
          });
        },
        (error) => {
          replyPort.postMessage({
            error,
          });
        },
      ),
    );
  }
});
