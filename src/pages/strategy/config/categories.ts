import type { ConfigCategory } from './types';

export const configCategories: ConfigCategory[] = [
  {
    key: 'connection',
    label: '连接与访问控制',
    labelEn: 'Connection & Access',
  },
  { key: 'security', label: '安全与认证', labelEn: 'Security & Auth' },
  { key: 'display', label: '显示与界面', labelEn: 'Display & UI' },
  { key: 'av', label: '音视频与编解码', labelEn: 'Audio/Video & Codec' },
  { key: 'file', label: '文件与剪贴板', labelEn: 'File & Clipboard' },
  { key: 'advanced', label: '高级设置', labelEn: 'Advanced' },
  { key: 'floating', label: '浮动窗口', labelEn: 'Floating Window' },
  { key: 'privacy', label: '隐私与录制', labelEn: 'Privacy & Recording' },
  { key: 'hide', label: '界面隐藏', labelEn: 'UI Hiding' },
];
