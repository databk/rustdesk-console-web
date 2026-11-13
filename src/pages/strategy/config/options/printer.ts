import type { ConfigOption } from '../types';

export const options: ConfigOption[] = [
  {
    key: 'printer-incomming-job-action',
    label: 'printer-incomming-job-action',
    category: 'printer',
    type: 'select',
    defaultValue: 'manual',
    options: ['manual', 'auto'],
  },
  {
    key: 'allow-printer-auto-print',
    label: 'allow-printer-auto-print',
    category: 'printer',
    type: 'switch',
    defaultValue: 'N',
    options: ['Y', 'N'],
  },
  {
    key: 'printer-selected-name',
    label: 'printer-selected-name',
    category: 'printer',
    type: 'text',
    defaultValue: '',
  },
];
