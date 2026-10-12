const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function serviceWorker({ pathName = '/', skipError = false } = {}) {
  const scope = `https://console.test${pathName}`;
  const handlers = {};
  const log = {
    deleted: [],
    puts: [],
    precache: [],
    skip: 0,
    claimed: 0,
    opened: [],
  };
  const stored = new Map();
  const cached = {
    addAll: async (requests) => {
      log.precache.push(...requests);
    },
    put: async (request, value) => {
      log.puts.push(request.url);
      stored.set(request.url, value);
    },
    match: async (request) =>
      stored.get(
        typeof request === 'string'
          ? new URL(request, scope).href
          : request.url,
      ),
  };
  const context = {
    URL,
    Request: class extends Request {
      constructor(url, options) {
        super(new URL(url, scope), options);
      }
    },
    Promise,
    fetch: async () =>
      new Response('<html>page</html>', {
        headers: { 'content-type': 'text/html' },
      }),
    caches: {
      keys: async () => [
        'rustdesk-console-v1',
        'rustdesk-console:%2F:old',
        'rustdesk-console:%2Fapp%2F:old',
        'other-app',
      ],
      open: async (name) => {
        log.opened.push(name);
        return cached;
      },
      delete: async (name) => {
        log.deleted.push(name);
        return true;
      },
    },
    self: {
      registration: { scope },
      location: { origin: 'https://console.test' },
      addEventListener: (kind, callback) => {
        handlers[kind] = callback;
      },
      skipWaiting: async () => {
        log.skip++;
        if (skipError) throw new Error('private internal error');
      },
      clients: {
        claim: async () => {
          log.claimed++;
        },
      },
    },
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '../public/sw.js'), 'utf8'),
    context,
  );
  async function emit(kind, values = {}) {
    const pending = [];
    let response;
    handlers[kind]({
      ...values,
      waitUntil: (promise) => pending.push(promise),
      respondWith: (promise) => {
        response = promise;
      },
    });
    const value = await response;
    await Promise.all(pending);
    return value;
  }
  return { emit, log, context, stored };
}

test('安装只缓存应用外壳，不自动跳过 waiting；主动更新对 ACK 成功/失败回复', async () => {
  const instance = serviceWorker();
  await instance.emit('install');
  assert.equal(instance.log.skip, 0);
  assert.equal(instance.log.precache.length, 3);
  assert.ok(
    instance.log.precache.every((request) => request.cache === 'reload'),
  );
  const replies = [];
  await instance.emit('message', {
    data: { type: 'skip-waiting' },
    ports: [{ postMessage: (value) => replies.push(value) }],
  });
  assert.equal(instance.log.skip, 1);
  assert.equal(replies[0].error, null);
  const failed = serviceWorker({ skipError: true });
  await failed.emit('message', {
    data: { type: 'skip-waiting' },
    ports: [{ postMessage: (value) => replies.push(value) }],
  });
  assert.equal(replies[1].error, 'activation-failed');
});

test('activate 只清本应用 scope 的旧缓存，同源其它应用保留', async () => {
  const instance = serviceWorker({ pathName: '/app/' });
  await instance.emit('activate');
  assert.deepEqual(instance.log.deleted, ['rustdesk-console:%2Fapp%2F:old']);
  assert.equal(instance.log.claimed, 1);
});

test('导航仅缓存成功 HTML，离线只读本应用缓存', async () => {
  const instance = serviceWorker();
  const request = {
    method: 'GET',
    mode: 'navigate',
    url: 'https://console.test/web-client',
  };
  assert.equal((await instance.emit('fetch', { request })).status, 200);
  assert.deepEqual(instance.log.puts, [request.url]);
  instance.context.fetch = async () =>
    new Response('<html>error</html>', {
      status: 503,
      headers: { 'content-type': 'text/html' },
    });
  assert.equal((await instance.emit('fetch', { request })).status, 503);
  assert.equal(instance.log.puts.length, 1);
  instance.context.fetch = async () =>
    new Response('{}', { headers: { 'content-type': 'application/json' } });
  await instance.emit('fetch', { request });
  assert.equal(instance.log.puts.length, 1);
  instance.context.fetch = async () => {
    throw new Error('offline');
  };
  assert.equal(
    await (await instance.emit('fetch', { request })).text(),
    '<html>page</html>',
  );
  assert.ok(
    instance.log.opened.every((name) =>
      name.startsWith('rustdesk-console:%2F:'),
    ),
  );
});

test('静态内容哈希才缓存，API、SW、版本清单、稳定路径及跨 scope 不截获', async () => {
  const instance = serviceWorker({ pathName: '/app/' });
  for (const pathname of [
    '/app/umi.12345678.js',
    '/app/decoder.12345678.wasm',
  ]) {
    await instance.emit('fetch', {
      request: {
        method: 'GET',
        mode: 'cors',
        url: `https://console.test${pathname}`,
      },
    });
  }
  assert.equal(instance.log.puts.length, 2);
  for (const pathname of [
    '/app/api/currentUser',
    '/app/sw.js',
    '/app/web-client-worker.json',
    '/app/scripts/loading.js',
    '/other/umi.12345678.js',
  ]) {
    assert.equal(
      await instance.emit('fetch', {
        request: {
          method: 'GET',
          mode: 'cors',
          url: `https://console.test${pathname}`,
        },
      }),
      undefined,
    );
  }
  assert.equal(instance.log.puts.length, 2);
});

test('Nginx 的 SW 非 immutable，保留 index/manifest、静态缺失 404 和网关 Upgrade', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../nginx.conf.template'),
    'utf8',
  );
  for (const route of ['/sw.js', '/index.html', '/web-client-worker.json']) {
    const block = source.match(
      new RegExp(`location = ${route.replaceAll('.', '\\.')} \\{([^}]+)\\}`),
    );
    assert.ok(block, route);
    assert.match(block[1], /Cache-Control "no-store" always/);
    assert.doesNotMatch(block[1], /immutable|expires/);
  }
  assert.match(
    source,
    /location ~\* \\.\(js\|wasm[^}]+try_files \$uri =404;[^}]+immutable/s,
  );
  assert.match(source, /proxy_set_header Upgrade \$http_upgrade;/);
});
