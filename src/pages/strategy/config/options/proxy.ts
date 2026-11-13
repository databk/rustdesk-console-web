import type { ConfigOption } from '../types';

export const options: ConfigOption[] = [
  {
    key: 'proxy-url',
    label: 'proxy-url',
    category: 'proxy',
    type: 'text',
    defaultValue: '',
  },
  {
    key: 'proxy-username',
    label: 'proxy-username',
    category: 'proxy',
    type: 'text',
    defaultValue: '',
  },
  {
    key: 'proxy-password',
    label: 'proxy-password',
    category: 'proxy',
    type: 'text',
    defaultValue: '',
  },
];
