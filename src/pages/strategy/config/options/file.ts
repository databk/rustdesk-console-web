import type { ConfigOption } from '../types';

export const options: ConfigOption[] = [
  {
    key: 'enable-file-copy-paste',
    label: 'enable-file-copy-paste',
    category: 'file',
    type: 'switch',
    defaultValue: 'N',
    options: ['Y', 'N'],
  },
  {
    key: 'disable-clipboard',
    label: 'disable-clipboard',
    category: 'file',
    type: 'switch',
    defaultValue: 'N',
    options: ['Y', 'N'],
  },
  {
    key: 'sync-init-clipboard',
    label: 'sync-init-clipboard',
    category: 'file',
    type: 'switch',
    defaultValue: 'N',
    options: ['Y', 'N'],
  },
];
