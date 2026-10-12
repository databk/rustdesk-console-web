const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const INPUT_DIRECTORIES = ['config', 'src', 'public', 'vendor'];
const INPUT_FILES = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'scripts/build-identity.cjs',
  'scripts/write-web-client-manifest.cjs',
];

function buildIdentity(root, environment = process.env) {
  const hash = createHash('sha256');
  // 页面编译和 postbuild 使用相同的默认值，只绑定影响编译的公开配置。
  hash.update(
    JSON.stringify({
      publicPath: (environment.REACT_APP_PUBLIC_PATH || '/').replace(
        /\/?$/,
        '/',
      ),
      history: environment.REACT_APP_HISTORY_TYPE || 'browser',
      appEnvironment: environment.REACT_APP_ENV || 'dev',
      umiEnvironment: environment.UMI_ENV || '',
      ci: environment.CI || '',
    }),
  );
  const files = [];
  const collect = (relative) => {
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) return;
    const info = fs.lstatSync(absolute);
    if (info.isSymbolicLink())
      throw new Error(`Build input cannot be a symlink: ${relative}`);
    if (info.isDirectory()) {
      if (/^(?:\.umi.*|__tests__|node_modules)$/.test(path.basename(relative)))
        return;
      for (const name of fs.readdirSync(absolute).sort())
        collect(`${relative}/${name}`);
    } else if (info.isFile() && !/\.(?:test|spec)\.[^.]+$/.test(relative)) {
      files.push(relative);
    }
  };
  for (const relative of [...INPUT_DIRECTORIES, ...INPUT_FILES])
    collect(relative);
  for (const relative of files.sort()) {
    const bytes = fs.readFileSync(path.join(root, relative));
    hash.update(`${relative}\0${bytes.length}\0`);
    hash.update(bytes);
  }
  return hash.digest('hex');
}

module.exports = { buildIdentity };
