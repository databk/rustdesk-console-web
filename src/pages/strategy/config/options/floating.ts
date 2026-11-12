import type { ConfigOption } from '../types';

export const options: ConfigOption[] = [
  {
    key: 'disable-floating-window',
    label: 'disable-floating-window',
    category: 'floating',
    type: 'switch',
    defaultValue: 'N',
    options: ['Y', 'N'],
  },
  {
    key: 'floating-window-size',
    label: 'floating-window-size',
    category: 'floating',
    type: 'number',
    defaultValue: '120',
    min: 32,
    max: 320,
  },
  {
    key: 'floating-window-untouchable',
    label: 'floating-window-untouchable',
    category: 'floating',
    type: 'switch',
    defaultValue: 'N',
    options: ['Y', 'N'],
  },
  {
    key: 'floating-window-transparency',
    label: 'floating-window-transparency',
    category: 'floating',
    type: 'number',
    defaultValue: '10',
    min: 0,
    max: 10,
  },
];
