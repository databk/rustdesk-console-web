const fs = require('node:fs');
const path = require('node:path');
const { build } = require('@umijs/mako');

function writeWorkerManifest(directory) {
  // Mako 0.11.10 为输出 Worker 添加哈希，但 new URL 中的名称仍不带哈希。
  // 当前功能是应用唯一的 Worker 入口；如果这一前提改变，构建应失败，
  // 避免误选其他产物。
  const workers = fs
    .readdirSync(directory)
    .filter((name) => /-worker(?:\.[a-f0-9]+)?\.js$/.test(name));
  if (workers.length !== 1)
    throw new Error('Expected exactly one Web Client Worker asset');
  fs.writeFileSync(
    path.join(directory, 'web-client-worker.json'),
    JSON.stringify({ file: workers[0] }),
  );
}

async function buildProductionWorker() {
  const root = path.resolve(__dirname, '..');
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
  writeWorkerManifest(output);
  const manifest = JSON.parse(
    fs.readFileSync(path.join(output, 'web-client-worker.json'), 'utf8'),
  );
  for (const name of [manifest.file, 'web-client-worker.json']) {
    fs.copyFileSync(path.join(output, name), path.join(root, 'dist', name));
  }
  const notices = [
    `Console Web Client 对应源码：${process.env.WEB_CLIENT_SOURCE_URL || 'https://github.com/yardbirds0/rustdesk-console-web/tree/web-client-v2-acceptance'}\n`,
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

module.exports = { writeWorkerManifest, buildProductionWorker };
if (require.main === module)
  buildProductionWorker().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
