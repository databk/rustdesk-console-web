const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const pbjs = require('protobufjs-cli/pbjs');
const pbts = require('protobufjs-cli/pbts');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'vendor/rustdesk-protocol');
const output = path.join(root, 'src/features/web-client/protocol/generated');
const manifest = JSON.parse(
  fs.readFileSync(path.join(source, 'source.json'), 'utf8'),
);
const license = manifest.license;
if (
  !license ||
  !manifest.sources[license.source] ||
  createHash('sha256')
    .update(fs.readFileSync(path.join(source, license.localFile)))
    .digest('hex') !== license.sha256
)
  throw new Error('Pinned protocol license checksum mismatch');
const files = Object.keys(manifest.files).map((name) => {
  const entry = manifest.files[name];
  const origin = manifest.sources[entry.source];
  if (!origin || !/^[a-f0-9]{40}$/.test(origin.revision) || !entry.path)
    throw new Error(`Missing immutable protocol source: ${name}`);
  const file = path.join(source, name);
  const digest = createHash('sha256')
    .update(fs.readFileSync(file))
    .digest('hex');
  if (digest !== entry.sha256)
    throw new Error(`Protocol checksum mismatch: ${name}`);
  return file;
});
fs.mkdirSync(output, { recursive: true });
const run = (tool, args) =>
  new Promise((resolve, reject) => {
    tool.main(args, (error, text) => (error ? reject(error) : resolve(text)));
  });
async function generate() {
  const js = await run(pbjs, [
    '-t',
    'static-module',
    '-w',
    'commonjs',
    '--no-delimited',
    '--no-convert',
    '--no-verify',
    '--no-create',
    ...files,
  ]);
  const jsFile = path.join(output, 'protocol.js');
  const checking = process.argv.includes('--check');
  if (checking && fs.readFileSync(jsFile, 'utf8') !== js)
    throw new Error('Generated protocol.js is stale');
  if (!checking) fs.writeFileSync(jsFile, js);
  const types = await run(pbts, ['--no-comments', jsFile]);
  const typesFile = path.join(output, 'protocol.d.ts');
  if (checking && fs.readFileSync(typesFile, 'utf8') !== types)
    throw new Error('Generated protocol.d.ts is stale');
  if (!checking) fs.writeFileSync(typesFile, types);
  console.log(
    `Protocol ${Object.values(manifest.sources)
      .map((origin) => origin.revision)
      .join(
        ' / ',
      )}: checksums and generated files ${checking ? 'verified' : 'written'}`,
  );
}
generate().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
