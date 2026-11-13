import type { ConfigCategory } from './types';

export const configCategories: ConfigCategory[] = [
  { key: 'connection', label: 'Connection & Access' },
  { key: 'security', label: 'Security & Auth' },
  { key: 'display', label: 'Display' },
  { key: 'av', label: 'Audio/Video & Codec' },
  { key: 'file', label: 'File & Clipboard' },
  { key: 'network', label: 'Network' },
  { key: 'general', label: 'General' },
  { key: 'floating', label: 'Floating Window' },
  { key: 'privacy', label: 'Privacy & Recording' },
  { key: 'advanced', label: 'Advanced' },
  { key: 'preset', label: 'Preset & Address Book' },
  { key: 'printer', label: 'Printer' },
  { key: 'buildin', label: 'Built-in' },
];
