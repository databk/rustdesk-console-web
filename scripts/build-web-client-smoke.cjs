const path = require('node:path');
const fs = require('node:fs');
const { build } = require('@umijs/mako');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'node_modules/.cache/web-client-smoke');
build({
  root,
  watch: false,
  config: {
    entry: {
      media: './scripts/web-client/media-smoke.ts',
    },
    output: { path: output, mode: 'bundle' },
    mode: 'production',
    hash: false,
    publicPath: '/',
    clean: false,
  },
})
  .then(() => {
    fs.writeFileSync(
      path.join(output, 'media.html'),
      '<!doctype html><html><meta charset="utf-8"><title>Synthetic media validation</title><script src="/media.js"></script></html>',
    );
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
