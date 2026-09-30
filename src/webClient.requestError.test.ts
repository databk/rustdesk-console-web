import { expect, jest, test } from '@jest/globals';

jest.mock('@umijs/max', () => ({
  getIntl: () => ({
    formatMessage: ({ defaultMessage }: { defaultMessage: string }) =>
      defaultMessage,
  }),
  history: {
    location: { pathname: '/web-client', search: '?id=123456789' },
    push: jest.fn(),
  },
}));
jest.mock('antd', () => ({
  message: { error: jest.fn(), warning: jest.fn() },
  notification: { open: jest.fn() },
}));
jest.mock('@/utils/auth', () => ({
  ...jest.requireActual<typeof import('@/utils/auth')>('@/utils/auth'),
  getToken: jest.fn(),
  removeToken: jest.fn(),
}));

import { history } from '@umijs/max';
import { removeToken } from '@/utils/auth';
import { errorConfig, PERMISSIONS_STALE_EVENT } from './requestErrorConfig';

test('an expired Console token preserves the Web Client return target', () => {
  const handler = errorConfig.errorConfig?.errorHandler as (
    error: unknown,
    options: unknown,
  ) => void;
  handler({ response: { status: 401 } }, {});
  expect(removeToken).toHaveBeenCalled();
  const destination = jest.mocked(history.push).mock.calls.at(-1)?.[0];
  expect(
    new URL(String(destination), 'https://console.invalid').searchParams.get(
      'redirect',
    ),
  ).toBe('/web-client?id=123456789');
});

test('a 403 requests one permission refresh event without retrying the request', () => {
  const refresh = jest.fn();
  window.addEventListener(PERMISSIONS_STALE_EVENT, refresh);

  const handler = errorConfig.errorConfig?.errorHandler as (
    error: unknown,
    options: unknown,
  ) => void;
  handler({ response: { status: 403 } }, {});

  expect(refresh).toHaveBeenCalledTimes(1);
  window.removeEventListener(PERMISSIONS_STALE_EVENT, refresh);
});
