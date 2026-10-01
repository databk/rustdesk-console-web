import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
let sourceCommit = process.env.SOURCE_COMMIT;
if (!sourceCommit) {
  try { sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { sourceCommit = 'unknown'; }
}
if (process.env.SOURCE_COMMIT && !/^[a-f0-9]{40}$/.test(sourceCommit)) throw new Error('SOURCE_COMMIT must be a full Git commit');
const health = { component: 'web', version, sourceCommit, ready: /^[a-f0-9]{40}$/.test(sourceCommit), maintenanceProtocol: 1 };
writeFileSync(new URL('../dist/system-update-health.json', import.meta.url), JSON.stringify(health) + '\n');
writeFileSync(new URL('../dist/release-metadata.json', import.meta.url), JSON.stringify({ version, sourceCommit }) + '\n');
