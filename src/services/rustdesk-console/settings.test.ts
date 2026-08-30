import { beforeEach, expect, jest, test } from '@jest/globals';
import { request } from '@umijs/max';
import {
  getFrontendSettings,
  getGeneralSettings,
  updateGeneralSettings,
} from './settings';

jest.mock('@umijs/max', () => ({ request: jest.fn() }));

const requestMock = jest.mocked(request);

beforeEach(() => {
  requestMock.mockReset();
  requestMock.mockResolvedValue({});
});

test('uses the public frontend-settings API contract', async () => {
  await getFrontendSettings();

  expect(requestMock).toHaveBeenCalledWith('/api/settings/frontend', {
    method: 'GET',
  });
});

test('uses the admin general-settings API contract', async () => {
  const options = { skipErrorHandler: true };
  const settings: API.GeneralSettings = {
    watermarkEnabled: false,
    defaultLanguage: 'en-US',
    site: { frontendUrl: 'https://console.example.com', backendUrl: '' },
    webauthn: { enabled: true, rpName: 'RustDesk Console' },
  };

  await getGeneralSettings(options);
  await updateGeneralSettings(settings);

  expect(requestMock).toHaveBeenNthCalledWith(1, '/api/settings/general', {
    method: 'GET',
    ...options,
  });
  expect(requestMock).toHaveBeenNthCalledWith(2, '/api/settings/general', {
    method: 'PUT',
    data: settings,
    skipErrorHandler: true,
  });
});
