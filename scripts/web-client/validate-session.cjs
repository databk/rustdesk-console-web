// Run against the private smoke entry, never against a user's existing tab.
// Node 24 supplies fetch/WebSocket; no additional browser driver is required.
const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let interrupted = false;
process.once('SIGINT', () => {
  interrupted = true;
});
process.once('SIGTERM', () => {
  interrupted = true;
});

function bounded(value, fallback, minimum, maximum) {
  const number = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(number) || number < minimum || number > maximum)
    throw new Error('Invalid numeric test option');
  return number;
}

class Debugger {
  constructor(socket) {
    this.socket = socket;
    this.next = 0;
    this.pending = new Map();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      const handler = this.pending.get(message.id);
      if (!handler) return;
      clearTimeout(handler.timer);
      this.pending.delete(message.id);
      if (message.error)
        handler.reject(new Error('Browser debugger command failed'));
      else handler.resolve(message.result);
    });
    socket.addEventListener('close', () => this.close());
    socket.addEventListener('error', () => this.close());
  }

  static async open(url) {
    const socket = new WebSocket(url);
    const debuggerClient = new Debugger(socket);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        debuggerClient.close();
        reject(new Error('Browser debugger unavailable'));
      }, 10000);
      socket.addEventListener(
        'open',
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
      socket.addEventListener(
        'error',
        () => {
          clearTimeout(timer);
          reject(new Error('Browser debugger unavailable'));
        },
        { once: true },
      );
    });
    return debuggerClient;
  }

  call(method, params = {}) {
    if (this.socket.readyState !== WebSocket.OPEN)
      return Promise.reject(new Error('Browser debugger disconnected'));
    return new Promise((resolve, reject) => {
      const id = ++this.next;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('Browser debugger timed out'));
      }, 15000);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.call('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    // Exception details may contain evaluated credentials. Never echo them.
    if (result.exceptionDetails)
      throw new Error('Validation page operation failed');
    return result.result.value;
  }

  close() {
    for (const { reject, timer } of this.pending.values()) {
      clearTimeout(timer);
      reject(new Error('Browser debugger disconnected'));
    }
    this.pending.clear();
    if (this.socket.readyState < WebSocket.CLOSING) this.socket.close();
  }
}

// Projection runs in the page: clipboard, cursor bytes, IDs and peer names never
// leave it through this runner's result channel.
const snapshotExpression =
  '(' +
  (() => {
    const harness = globalThis.webClientSmoke;
    if (!harness) return undefined;
    const events = harness.events;
    const latest = (type) =>
      events.filter((event) => event.type === type).at(-1);
    const peer = latest('peer')?.peer;
    const canvas = document.querySelector('canvas');
    return {
      ready: latest('ready')?.secureContext && latest('ready')?.videoDecoder,
      state: latest('state')?.state,
      kxVersion: latest('security')?.kxVersion,
      errors: events
        .filter((event) => event.type === 'error')
        .map((event) => event.code),
      frames: harness.frames,
      dimensions: { width: canvas?.width, height: canvas?.height },
      metrics: latest('metrics'),
      peer: peer
        ? { platform: peer.platform, version: peer.version }
        : undefined,
    };
  }).toString() +
  ')()';

async function main() {
  const { values } = parseArgs({
    options: {
      config: { type: 'string' },
      page: { type: 'string' },
      browser: { type: 'string', default: 'http://127.0.0.1:9222' },
      seconds: { type: 'string' },
      cycles: { type: 'string' },
      width: { type: 'string' },
      height: { type: 'string' },
      kx: { type: 'string' },
      output: { type: 'string' },
      help: { type: 'boolean' },
    },
  });
  if (values.help) {
    console.log(
      'node scripts/web-client/validate-session.cjs --config PRIVATE.json --page https://localhost:PORT/ --browser http://127.0.0.1:9222 --kx 1 [--seconds 1800 --cycles 10 --width 1920 --height 1080 --output REPORT.json]',
    );
    return;
  }
  if (!values.config || !values.page || values.kx === undefined)
    throw new Error('Required options: --config, --page, --kx. See --help.');
  const endpoint = new URL(values.browser);
  if (
    endpoint.protocol !== 'http:' ||
    !['127.0.0.1', '[::1]', 'localhost'].includes(endpoint.hostname) ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash ||
    endpoint.pathname !== '/'
  )
    throw new Error('Browser debugger must be a loopback HTTP endpoint');
  const page = new URL(values.page);
  if (
    page.protocol !== 'https:' ||
    page.username ||
    page.password ||
    page.search ||
    page.hash
  )
    throw new Error(
      'Use a secure private smoke page without credentials or query parameters',
    );
  const seconds = bounded(values.seconds, 1800, 1, 7200);
  const cycles = bounded(values.cycles, 10, 1, 100);
  const width = bounded(values.width, 1920, 1, 8192);
  const height = bounded(values.height, 1080, 1, 8192);
  const kxVersion = bounded(values.kx, undefined, 0, 1);
  let config;
  try {
    config = JSON.parse(fs.readFileSync(values.config, 'utf8'));
  } catch {
    throw new Error('Private test configuration could not be read');
  }
  if (
    typeof config.id !== 'string' ||
    !config.profile ||
    ['idServerUrl', 'relayServerUrl', 'serverPublicKey'].some(
      (key) => typeof config.profile[key] !== 'string',
    )
  )
    throw new Error(
      'Private test configuration needs id and the three public profile fields',
    );
  const profile = Object.fromEntries(
    ['idServerUrl', 'relayServerUrl', 'serverPublicKey'].map((key) => [
      key,
      config.profile[key],
    ]),
  );
  const password = process.env.WEB_CLIENT_TEST_PASSWORD ?? config.password;
  if (password !== undefined && typeof password !== 'string')
    throw new Error('Test password must be a string');
  const output = path.resolve(
    values.output ||
      path.join(
        'node_modules/.cache/web-client-validation',
        `${Date.now()}.json`,
      ),
  );
  fs.mkdirSync(path.dirname(output), { recursive: true });
  // Never overwrite an existing report or a supplied credential file.
  fs.writeFileSync(output, '{}\n', { flag: 'wx' });
  const report = {
    started: new Date().toISOString(),
    settings: { seconds, cycles, width, height, kxVersion },
    connections: [],
    samples: [],
    complete: false,
  };
  const save = () =>
    fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  let tab;
  let client;
  const getJson = async (route, method = 'GET') => {
    const response = await fetch(new URL(route, endpoint), {
      method,
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('Browser debugger HTTP request failed');
    return response.json();
  };
  try {
    report.browser = (await getJson('/json/version')).Browser;
    tab = await getJson('/json/new?about:blank', 'PUT');
    const socketUrl = new URL(tab.webSocketDebuggerUrl);
    if (
      socketUrl.protocol !== 'ws:' ||
      !['127.0.0.1', '[::1]', 'localhost'].includes(socketUrl.hostname)
    )
      throw new Error('Unexpected browser debugger socket');
    client = await Debugger.open(socketUrl);
    const snapshot = () => client.evaluate(snapshotExpression);
    const send = (command) =>
      client.evaluate(`webClientSmoke.send(${JSON.stringify(command)})`);
    const until = async (condition, timeout = 30000) => {
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        if (interrupted) throw new Error('Validation interrupted');
        const result = await condition();
        if (result) return result;
        await pause(150);
      }
      throw new Error('Validation condition timed out');
    };
    const disconnect = async () => {
      await send({ type: 'disconnect' });
      await until(async () => (await snapshot())?.state === 'closed');
    };
    await client.call('Page.navigate', { url: page.href });
    await until(async () => (await snapshot())?.ready);
    for (let cycle = 0; cycle < cycles; cycle++) {
      if (cycle) {
        await disconnect();
        await pause(2000);
        await client.evaluate('webClientSmoke.events.length=0');
      }
      const before = (await snapshot()).frames;
      const start = Date.now();
      let submitted = false;
      await send({ type: 'connect', profile, id: config.id });
      await until(async () => {
        const current = await snapshot();
        if (current.state === 'failed' || current.errors.length)
          throw new Error('Native authentication failed');
        if (
          !submitted &&
          password !== undefined &&
          current.state === 'awaitingApproval'
        ) {
          submitted = true;
          await send({ type: 'password', password });
        }
        return current.state === 'connected';
      }, 120000);
      const authenticatedMs = Date.now() - start;
      const current = await until(async () => {
        const value = await snapshot();
        return value.frames > before && value;
      });
      if (
        current.kxVersion !== kxVersion ||
        current.dimensions.width !== width ||
        current.dimensions.height !== height
      )
        throw new Error(
          'Negotiated protocol or actual frame dimensions differ from the requested test',
        );
      const connection = {
        cycle: cycle + 1,
        authenticatedMs,
        firstFrameMs: Date.now() - start,
        kxVersion: current.kxVersion,
        dimensions: current.dimensions,
        peer: current.peer,
      };
      report.connections.push(connection);
      save();
      console.log(JSON.stringify(connection));
    }
    const soakStart = Date.now();
    report.soakStarted = new Date(soakStart).toISOString();
    let lastFrame = -1;
    let lastProgress = soakStart;
    while (true) {
      if (interrupted) throw new Error('Validation interrupted');
      await send({ type: 'metrics' });
      await pause(50);
      const current = await snapshot();
      if (
        current.state !== 'connected' ||
        current.errors.length ||
        current.kxVersion !== kxVersion ||
        current.dimensions.width !== width ||
        current.dimensions.height !== height
      )
        throw new Error(
          'Session state, protocol or frame dimensions changed during the sustained test',
        );
      if (current.frames !== lastFrame) lastProgress = Date.now();
      if (Date.now() - lastProgress > 45000)
        throw new Error(
          'No frame progress for 45 seconds; use an animated synthetic desktop fixture',
        );
      lastFrame = current.frames;
      report.samples.push({
        time: new Date().toISOString(),
        frames: current.frames,
        dimensions: current.dimensions,
        decoded: current.metrics?.decoded,
        presenting: current.metrics?.presenting,
        pendingFrame: current.metrics?.pendingFrame,
      });
      save();
      const remaining = seconds * 1000 - (Date.now() - soakStart);
      if (remaining <= 0) break;
      await pause(Math.min(10000, remaining));
    }
    report.soakDurationSeconds = (Date.now() - soakStart) / 1000;
    await disconnect();
    const closed = await snapshot();
    if (closed.kxVersion !== undefined)
      throw new Error('Session security status retained after disconnect');
    report.complete = true;
  } catch (error) {
    report.failure = error.message;
    process.exitCode = 1;
  } finally {
    try {
      await client?.evaluate(
        'webClientSmoke?.send({type:"disconnect"});webClientSmoke?.dispose()',
      );
    } catch {
      /* The page or debugger may have closed. */
    }
    client?.close();
    if (tab?.id)
      await fetch(
        new URL(`/json/close/${encodeURIComponent(tab.id)}`, endpoint),
        { signal: AbortSignal.timeout(5000) },
      ).catch(() => {});
    report.finished = new Date().toISOString();
    save();
  }
  console.log(
    JSON.stringify({
      complete: report.complete,
      connections: report.connections.length,
      soakDurationSeconds: report.soakDurationSeconds,
      failure: report.failure,
      report: output,
    }),
  );
}

main().catch(() => {
  console.error(
    'Validation setup failed. Check the private configuration and options; existing report files are not overwritten.',
  );
  process.exitCode = 1;
});
