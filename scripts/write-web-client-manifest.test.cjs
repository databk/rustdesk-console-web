const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  sourceNotice,
  writeWorkerManifest,
  verifyPageBuildIdentity,
  writeServiceWorkerIdentity,
} = require('./write-web-client-manifest.cjs');
const { buildIdentity } = require('./build-identity.cjs');

function fixture() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'console-build-pair-'));
}

test('源码声明绑定完整提交，未提供提交时不声称已发布当前改动', () => {
  const previousCommit = process.env.SOURCE_COMMIT;
  const previousUrl = process.env.WEB_CLIENT_SOURCE_URL;
  try {
    delete process.env.SOURCE_COMMIT;
    delete process.env.WEB_CLIENT_SOURCE_URL;
    assert.match(sourceNotice(), /rustdesk-console-web\/tree\/main/);
    assert.match(sourceNotice(), /仓库分支链接不代表当前未提交改动/);
    process.env.SOURCE_COMMIT = 'a'.repeat(40);
    assert.ok(sourceNotice().includes(`/tree/${'a'.repeat(40)}`));
    process.env.WEB_CLIENT_SOURCE_URL = 'https://example.test/source.tar.gz';
    assert.match(sourceNotice(), /https:\/\/example.test\/source.tar.gz/);
    process.env.SOURCE_COMMIT = 'not-a-full-commit';
    assert.throws(sourceNotice, /full Git commit/);
  } finally {
    if (previousCommit === undefined) delete process.env.SOURCE_COMMIT;
    else process.env.SOURCE_COMMIT = previousCommit;
    if (previousUrl === undefined) delete process.env.WEB_CLIENT_SOURCE_URL;
    else process.env.WEB_CLIENT_SOURCE_URL = previousUrl;
  }
});

test('同次实际内容身份配对页面、清单、SW；没有页面身份就拒绝发布', () => {
  const directory = fixture();
  const identity = 'a'.repeat(64);
  fs.writeFileSync(
    path.join(directory, 'umi.12345678.js'),
    `const buildId = '${identity}'`,
  );
  fs.writeFileSync(
    path.join(directory, 'web-client-worker.12345678.js'),
    'worker',
  );
  fs.writeFileSync(
    path.join(directory, 'sw.js'),
    "const BUILD_ID = '__CONSOLE_BUILD_ID__';",
  );
  verifyPageBuildIdentity(directory, identity);
  writeWorkerManifest(directory, identity);
  writeServiceWorkerIdentity(directory, identity);
  assert.deepEqual(
    JSON.parse(
      fs.readFileSync(path.join(directory, 'web-client-worker.json'), 'utf8'),
    ),
    { file: 'web-client-worker.12345678.js', buildId: identity },
  );
  assert.match(
    fs.readFileSync(path.join(directory, 'sw.js'), 'utf8'),
    new RegExp(identity),
  );
  assert.throws(
    () => verifyPageBuildIdentity(directory, 'b'.repeat(64)),
    /identities differ/,
  );
  assert.throws(
    () => writeWorkerManifest(directory, 'a'.repeat(40)),
    /Invalid/,
  );
  assert.throws(
    () => writeServiceWorkerIdentity(directory, identity),
    /template/,
  );
});

test('源码和公开配置变化改变身份，缓存、测试、秘密环境和基线提交不改变身份', () => {
  const directory = fixture();
  fs.mkdirSync(path.join(directory, 'src'));
  fs.writeFileSync(path.join(directory, 'src/app.ts'), 'app A');
  const initial = buildIdentity(directory, {});
  fs.mkdirSync(path.join(directory, 'dist'));
  fs.mkdirSync(path.join(directory, 'src/.umi'));
  fs.writeFileSync(path.join(directory, 'dist/sw.js'), 'generated');
  fs.writeFileSync(path.join(directory, 'src/.umi/generated.ts'), 'generated');
  fs.writeFileSync(path.join(directory, 'src/app.test.ts'), 'tests');
  assert.equal(
    buildIdentity(directory, {
      SOURCE_COMMIT: 'a'.repeat(40),
      TOKEN: 'private',
    }),
    initial,
  );
  assert.equal(
    buildIdentity(directory, {
      REACT_APP_PUBLIC_PATH: '/',
      REACT_APP_ENV: 'dev',
      REACT_APP_HISTORY_TYPE: 'browser',
    }),
    initial,
  );
  assert.notEqual(
    buildIdentity(directory, { REACT_APP_PUBLIC_PATH: '/app/' }),
    initial,
  );
  fs.writeFileSync(path.join(directory, 'src/app.ts'), 'app B');
  assert.notEqual(buildIdentity(directory, {}), initial);
});
