import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = process.argv.find(arg => arg.startsWith('--target='))?.slice(9);
const targets = {
  'x86_64-unknown-linux-gnu': ['x64', 'glibc'],
  'aarch64-unknown-linux-gnu': ['arm64', 'glibc'],
  'x86_64-unknown-linux-musl': ['x64', 'musl'],
  'aarch64-unknown-linux-musl': ['arm64', 'musl'],
};
if (!targets[target]) throw new Error('Unsupported managed Linux target');
const [arch, libc] = targets[target];
const health = JSON.parse(readFileSync('dist/system-update-health.json', 'utf8'));
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
if (!health.ready || health.version !== version || !/^[a-f0-9]{40}$/.test(health.sourceCommit)) throw new Error('A verified static build is required');
const directory = join('server', 'target', target, 'bundle');
mkdirSync(directory, { recursive: true });
copyFileSync(join('server', 'target', target, 'release', 'rustdesk-console-web'), join(directory, 'rustdesk-console-web'));
copyFileSync('dist/release-metadata.json', join(directory, 'release-metadata.json'));
writeFileSync(join(directory, 'build-info.json'), JSON.stringify({ component: 'web', version, sourceCommit: health.sourceCommit, bundleFormat: 1, platform: 'linux', arch, libc }) + '\n');
const name = `rustdesk-console-web-linux-${arch}${libc === 'musl' ? '-musl' : ''}.tar.gz`;
execFileSync('tar', ['-czf', name, '-C', directory, '.'], { stdio: 'inherit' });
