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
    key: 'disable_clipboard',
    label: 'disable_clipboard',
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
  {
    key: 'allow-sync-clipboard-between-sessions',
    label: 'allow-sync-clipboard-between-sessions',
    category: 'file',
    type: 'switch',
    defaultValue: 'N',
    options: ['Y', 'N'],
  },
];
