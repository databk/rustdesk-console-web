import { expect, test } from '@jest/globals';
import { getUsernameWatermark, toFrontendSettings } from './generalSettings';

test('includes the username watermark only when enabled', () => {
  expect(getUsernameWatermark({ watermarkEnabled: true }, 'alice')).toEqual({
    content: 'alice',
  });
  expect(
    getUsernameWatermark({ watermarkEnabled: false }, 'alice'),
  ).toBeUndefined();
  expect(
    getUsernameWatermark({ watermarkEnabled: true }, undefined),
  ).toBeUndefined();
});

test('maps general settings to frontend settings', () => {
  const general: API.GeneralSettings = {
    watermarkEnabled: true,
    defaultLanguage: 'zh-CN',
    site: { frontendUrl: 'https://a.example.com', backendUrl: 'https://b.example.com' },
    webauthn: { enabled: true, rpName: 'RustDesk Console' },
  };
  expect(toFrontendSettings(general)).toEqual({
    watermarkEnabled: true,
    defaultLanguage: 'zh-CN',
    webauthnEnabled: true,
  });
});
