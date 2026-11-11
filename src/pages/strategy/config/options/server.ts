import type { ConfigOption } from '../types';

export const options: ConfigOption[] = [
  {
    key: 'custom-rendezvous-server',
    label: 'custom-rendezvous-server',
    category: 'server',
    type: 'text',
    defaultValue: '',
  },
  {
    key: 'api-server',
    label: 'api-server',
    category: 'server',
    type: 'text',
    defaultValue: '',
  },
  {
    key: 'key',
    label: 'key',
    category: 'server',
    type: 'text',
    defaultValue: '',
  },
  {
    key: 'relay-server',
    label: 'relay-server',
    category: 'server',
    type: 'text',
    defaultValue: '',
  },
  {
    key: 'ice-servers',
    label: 'ice-servers',
    category: 'server',
    type: 'text',
    defaultValue: '',
    description: 'Comma-separated ICE server URLs',
  },
];
