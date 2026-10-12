const fs = require('node:fs');
const path = require('node:path');
const { build } = require('@umijs/mako');
const { buildIdentity } = require('./build-identity.cjs');

function sourceNotice() {
  const commit = process.env.SOURCE_COMMIT;
  if (commit && !/^[a-f0-9]{40}$/.test(commit))
    throw new Error('SOURCE_COMMIT must be a full Git commit');
  const sourceUrl =
    process.env.WEB_CLIENT_SOURCE_URL ||
    `https://github.com/databk/rustdesk-console-web/tree/${commit || 'main'}`;
  const revision = commit
    ? `构建源码提交：${commit}`
    : '未提供构建源码提交；仓库分支链接不代表当前未提交改动。';
  return `Console Web Client 源码：${sourceUrl}\n${revision}\n`;
}

function writeWorkerManifest(
  directory,
  buildId = buildIdentity(path.resolve(__dirname, '..')),
) {
  // Mako 0.11.10 为输出 Worker 添加哈希，但 new URL 中的名称仍不带哈希。
  // 当前功能是应用唯一的 Worker 入口；如果这一前提改变，构建应失败，
  // 避免误选其他产物。
  const workers = fs
    .readdirSync(directory)
    .filter((name) => /-worker(?:\.[a-f0-9]+)?\.js$/.test(name));
  if (workers.length !== 1)
    throw new Error('Expected exactly one Web Client Worker asset');
  if (!/^[a-f0-9]{64}$/.test(buildId))
    throw new Error('Invalid Web Client build identity');
  const file = workers[0];
  if (!/-worker\.[a-f0-9]{8,}\.js$/.test(file))
    throw new Error('Web Client Worker must have a content-hashed address');
  fs.writeFileSync(
    path.join(directory, 'web-client-worker.json'),
    JSON.stringify({ file, buildId }),
  );
  return { file, buildId };
}

function verifyPageBuildIdentity(directory, buildId) {
  const found = fs
    .readdirSync(directory)
    .some(
      (name) =>
        name.endsWith('.js') &&
        !name.includes('-worker') &&
        name !== 'sw.js' &&
        fs.readFileSync(path.join(directory, name), 'utf8').includes(buildId),
    );
  if (!found)
    throw new Error(
      'Page and Worker build identities differ; rebuild the page',
    );
}

function writeServiceWorkerIdentity(directory, buildId) {
  const filename = path.join(directory, 'sw.js');
  const source = fs.readFileSync(filename, 'utf8');
  if (
    !/^[a-f0-9]{64}$/.test(buildId) ||
    source.split('__CONSOLE_BUILD_ID__').length !== 2
  )
    throw new Error('Invalid service worker build identity template');
  fs.writeFileSync(filename, source.replace('__CONSOLE_BUILD_ID__', buildId));
}

async function buildProductionWorker() {
  const source = sourceNotice();
  const root = path.resolve(__dirname, '..');
  const buildId = buildIdentity(root);
  verifyPageBuildIdentity(path.join(root, 'dist'), buildId);
  const output = path.join(root, 'node_modules/.cache/web-client-worker');
  // Umi granularChunks 可能将 Worker 依赖移入只适用于 window 的分块。
  // 使用同一编译器，将同一源码构建为自包含入口。
  await build({
    root,
    watch: false,
    config: {
      entry: {
        'web-client-worker':
          './src/features/web-client/worker/session.worker.ts',
      },
      output: { path: output, mode: 'bundle' },
      mode: 'production',
      hash: true,
      publicPath: '/',
      clean: true,
      devtool: false,
    },
  });
  if (buildIdentity(root) !== buildId)
    throw new Error('Build inputs changed during Worker compilation');
  writeWorkerManifest(output, buildId);
  const manifest = JSON.parse(
    fs.readFileSync(path.join(output, 'web-client-worker.json'), 'utf8'),
  );
  for (const name of [manifest.file, 'web-client-worker.json']) {
    fs.copyFileSync(path.join(output, name), path.join(root, 'dist', name));
  }
  writeServiceWorkerIdentity(path.join(root, 'dist'), buildId);
  const notices = [
    source,
    fs.readFileSync(
      path.join(root, 'vendor/rustdesk-protocol/NOTICE.md'),
      'utf8',
    ),
    fs.readFileSync(
      path.join(root, 'vendor/rustdesk-protocol/source.json'),
      'utf8',
    ),
    fs.readFileSync(
      path.join(root, 'vendor/rustdesk-protocol/LICENCE.upstream'),
      'utf8',
    ),
    fs.readFileSync(
      path.join(root, 'docs/web-client/THIRD-PARTY-NOTICES.txt'),
      'utf8',
    ),
  ];
  fs.writeFileSync(
    path.join(root, 'dist/web-client-licenses.txt'),
    notices.join('\n\n'),
  );
}

module.exports = {
  sourceNotice,
  writeWorkerManifest,
  verifyPageBuildIdentity,
  writeServiceWorkerIdentity,
  buildProductionWorker,
};
if (require.main === module)
  buildProductionWorker().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
