import { beforeEach, expect, jest, test } from '@jest/globals';
import { request } from '@umijs/max';
import { getGeneralSettings, updateGeneralSettings } from './settings';

jest.mock('@umijs/max', () => ({ request: jest.fn() }));

const requestMock = jest.mocked(request);

beforeEach(() => {
  requestMock.mockReset();
  requestMock.mockResolvedValue({});
});

test('uses the narrow general-settings API contract', async () => {
  const options = { skipErrorHandler: true };
  const settings = { siteName: 'Operations', watermarkEnabled: false };

  await getGeneralSettings(options);
  await updateGeneralSettings(settings);

  expect(requestMock).toHaveBeenNthCalledWith(1, '/api/settings/general', {
    method: 'GET',
    ...options,
  });
  expect(requestMock).toHaveBeenNthCalledWith(2, '/api/settings/general', {
    method: 'PUT',
    data: settings,
  });
});
