import type { ConfigOption } from '../types';

export const options: ConfigOption[] = [
  {
    key: 'enable-record-session',
    label: 'enable-record-session',
    category: 'privacy',
    type: 'switch',
    defaultValue: 'Y',
    options: ['Y', 'N'],
  },
  {
    key: 'allow-auto-record-incoming',
    label: 'allow-auto-record-incoming',
    category: 'privacy',
    type: 'switch',
    defaultValue: 'N',
    options: ['Y', 'N'],
  },
  {
    key: 'allow-auto-record-outgoing',
    label: 'allow-auto-record-outgoing',
    category: 'privacy',
    type: 'switch',
    defaultValue: 'N',
    options: ['Y', 'N'],
  },
  {
    key: 'privacy-mode',
    label: 'privacy-mode',
    category: 'privacy',
    type: 'switch',
    defaultValue: 'N',
    options: ['Y', 'N'],
  },
];
