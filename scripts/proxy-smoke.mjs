import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';

// Real Docker/Nginx DNS replacement smoke; fixture backend is deliberately identified as such.
const image = process.argv[2];
if (!image) throw new Error('Usage: node scripts/proxy-smoke.mjs <locally-built-web-image>');
const prefix = 'console-system-update-test-proxy-' + randomBytes(4).toString('hex');
const network = prefix + '-net';
const resources = [];
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const server = 'require("http").createServer((req,res)=>{res.setHeader("Content-Type","application/json");res.end(JSON.stringify({component:"backend-fixture",version:process.env.TEST_VERSION,path:req.url}));}).listen(3000,"0.0.0.0")';
async function until(check) {
  let failure;
  for (let i = 0; i < 30; i++) {
    try { return await check(); } catch (error) { failure = error; await setTimeout(1000); }
  }
  throw failure;
}
function backend(name, version) {
  resources.push(name);
  docker('run','-d','--name',name,'--network',network,'--network-alias','backend','-e','TEST_VERSION='+version,'node:24-alpine','node','-e',server);
}
try {
  docker('network','create',network);
  backend(prefix+'-old', 'first');
  resources.push(prefix+'-web');
  docker('run','-d','--name',prefix+'-web','--network',network,'-p','127.0.0.1::80','-e','BACKEND_URL=http://backend:3000',image);
  const web = JSON.parse(docker('inspect',prefix+'-web'))[0];
  const base = 'http://127.0.0.1:' + web.NetworkSettings.Ports['80/tcp'][0].HostPort;
  const health = await until(async () => { const r=await fetch(base+'/system-update-health.json'); assert.equal(r.status,200); assert.equal(r.headers.get('cache-control'),'no-store'); return r.json(); });
  assert.equal(health.component,'web'); assert.equal(health.ready,true); assert.match(health.sourceCommit,/^[a-f0-9]{40}$/);
  const page = await fetch(base+'/'); assert.equal(page.status,200); assert.match(page.headers.get('cache-control'),/no-store|no-cache/);
  assert.match(await page.text(), /<html/);
  assert.equal((await fetch(base+'/missing-old-chunk.js')).status,404);
  const probe = async version => { const r=await fetch(base+'/api/system-update/health?probe=ready'); assert.equal(r.status,200); const value=await r.json(); assert.equal(value.version,version); assert.equal(value.path,'/api/system-update/health?probe=ready'); };
  await until(() => probe('first'));
  const oldIp = JSON.parse(docker('inspect',prefix+'-old'))[0].NetworkSettings.Networks[network].IPAddress;
  docker('rm','-f',prefix+'-old');
  resources.push(prefix+'-occupy');
  docker('run','-d','--name',prefix+'-occupy','--network',network,'--ip',oldIp,'node:24-alpine','sleep','90');
  backend(prefix+'-new','second');
  const newIp = JSON.parse(docker('inspect',prefix+'-new'))[0].NetworkSettings.Networks[network].IPAddress;
  assert.notEqual(newIp,oldIp);
  await until(() => probe('second'));
  console.log(JSON.stringify({ result:'passed', webHealth:health, oldBackendIp:oldIp, newBackendIp:newIp, checks:['embedded build identity','no-store health','SPA no-cache','missing chunk 404','proxy path/query preserved','Docker DNS recovers after actual backend IP replacement'] },null,2));
} finally {
  for (const name of resources.reverse()) { try { docker('rm','-f',name); } catch { /* Already removed task resource. */ } }
  try { docker('network','rm',network); } catch { /* Reported by a failed smoke if it was never created. */ }
}
