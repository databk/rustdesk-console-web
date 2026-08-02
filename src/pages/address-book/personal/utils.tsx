import {
  WindowsFilled,
  AndroidFilled,
  AppleFilled,
  QqCircleFilled,
} from '@ant-design/icons';
import React from 'react';

export const argbToHex = (color: number | undefined): string => {
  if (!color) return '#1677ff';
  return `#${color.toString(16).padStart(8, '0').slice(-6)}`;
};

export const getOSIcon = (os: string): React.ReactNode => {
  const osLower = (os || '').toLowerCase();

  if (osLower.includes('windows')) {
    return <WindowsFilled />;
  }
  if (osLower.includes('android')) {
    return <AndroidFilled />;
  }
  if (
    osLower.includes('macos') ||
    osLower.includes('ios') ||
    osLower.includes('mac')
  ) {
    return <AppleFilled />;
  }
  if (osLower.includes('linux')) {
    return <QqCircleFilled />;
  }

  return null;
};

export const rgbToArgb = (rgb: { r: number; g: number; b: number }): number =>
  0xff000000 + (rgb.r << 16) + (rgb.g << 8) + rgb.b;