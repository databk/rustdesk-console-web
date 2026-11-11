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
    strategySupported: false,
  },
  {
    key: 'privacy_mode',
    label: 'privacy_mode',
    category: 'privacy',
    type: 'switch',
    defaultValue: 'N',
    options: ['Y', 'N'],
    strategySupported: false,
  },
  {
    key: 'windows-service-video-save-directory',
    label: 'windows-service-video-save-directory',
    category: 'privacy',
    type: 'text',
    defaultValue: '',
    description: 'Absolute path for service-mode recording storage',
  },
];
