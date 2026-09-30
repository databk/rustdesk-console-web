// 校验实际 Nginx 镜像输出；远控协议的真机验收另见专项报告。
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');
const origin = process.argv[2] || 'http://127.0.0.1:18080';

async function request(path) {
  return fetch(new URL(path, origin), { signal: AbortSignal.timeout(5000) });
}

async function main() {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      if ((await request('/')).status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await delay(500);
  }
  assert.ok(ready, '前端容器没有就绪');
  const page = await request('/web-client');
  assert.equal(page.status, 200);
  assert.ok((page.headers.get('content-type') || '').includes('text/html'));
  assert.match(await page.text(), /<script/);
  const manifestResponse = await request('/web-client-worker.json');
  assert.equal(manifestResponse.status, 200);
  assert.match(manifestResponse.headers.get('cache-control') || '', /no-store/);
  const manifest = await manifestResponse.json();
  assert.match(manifest.file, /^web-client-worker[.][a-f0-9]+[.]js$/);
  const workerResponse = await request(`/${manifest.file}`);
  assert.equal(workerResponse.status, 200);
  assert.match(workerResponse.headers.get('content-type') || '', /javascript/);
  const worker = Buffer.from(await workerResponse.arrayBuffer());
  assert.ok(worker.length > 100_000, 'Worker 缺少预期的打包依赖');
  assert.equal((await request('/missing-web-client-smoke.js')).status, 404);
  assert.equal((await request('/missing-web-client-smoke.wasm')).status, 404);
  const license = await request('/web-client-licenses.txt');
  assert.equal(license.status, 200);
  assert.match(await license.text(), /GNU AFFERO GENERAL PUBLIC LICENSE/);
  console.log(JSON.stringify({
    checks: ['页面入口', 'Worker 清单与禁止缓存', '哈希 Worker 与 MIME', '缺失静态文件返回 404', '第三方许可'],
    passed: true,
    sourceRevision: process.env.GITHUB_SHA || null,
    worker: manifest.file,
    workerBytes: worker.length,
    workerSha256: createHash('sha256').update(worker).digest('hex'),
  }));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
