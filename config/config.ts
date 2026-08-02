import { join } from 'node:path';
import { defineConfig } from '@umijs/max';
import defaultSettings from './defaultSettings';
import proxy from './proxy';
import routes from './routes';
import { version } from '../package.json';

const { REACT_APP_ENV = 'dev' } = process.env;

const PUBLIC_PATH: string = '/';

export default defineConfig({
  hash: true,
  publicPath: PUBLIC_PATH,
  routes,
  ignoreMomentLocale: true,
  proxy: proxy[REACT_APP_ENV as keyof typeof proxy],
  fastRefresh: true,
  model: {},
  initialState: {},
  title: 'RustDesk Console',
  favicons: ['/logo.svg'],
  layout: {
    locale: true,
    ...defaultSettings,
  },
  moment2dayjs: {
    preset: 'antd',
    plugins: ['duration'],
  },
  locale: {
    default: 'zh-CN',
    antd: true,
    baseNavigator: true,
  },
  antd: {
    appConfig: {},
    configProvider: {
      theme: {
        cssVar: true,
        token: {
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
      },
    },
  },
  request: {},
  access: {},
  links: [{ rel: 'manifest', href: join(PUBLIC_PATH, 'manifest.json') }],
  metas: [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black' },
    { name: 'apple-mobile-web-app-title', content: 'RustDesk Console' },
    { name: 'theme-color', content: '#002140' },
  ],
  headScripts: [
    { src: join(PUBLIC_PATH, 'scripts/loading.js'), async: true },
    { src: join(PUBLIC_PATH, 'scripts/register-sw.js'), defer: true },
  ],
  presets: ['umi-presets-pro'],
  mock: false,

  mako: {},
  esbuildMinifyIIFE: true,
  requestRecord: {},
  define: {
    'process.env.CI': process.env.CI,
    FRONTEND_VERSION: version,
  },
});
