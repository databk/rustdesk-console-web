import type { ConfigCategory } from './types';

export const configCategories: ConfigCategory[] = [
  { key: 'connection', label: 'Connection & Access' },
  { key: 'security', label: 'Security & Auth' },
  { key: 'display', label: 'Display & UI' },
  { key: 'av', label: 'Audio/Video & Codec' },
  { key: 'file', label: 'File & Clipboard' },
  { key: 'advanced', label: 'Advanced' },
  { key: 'floating', label: 'Floating Window' },
  { key: 'privacy', label: 'Privacy & Recording' },
  { key: 'hide', label: 'UI Hiding' },
];
