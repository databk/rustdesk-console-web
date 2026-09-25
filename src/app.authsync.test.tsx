import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { history } from '@umijs/max';
import React from 'react';
import { TOKEN_KEY } from './utils/auth';

const mockRefresh = jest.fn();
const mockSetInitialState = jest.fn();
let mockInitialState: Record<string, unknown> = {
  currentUser: { guid: 'old-user' },
};

jest.mock('@umijs/max', () => ({
  getAllLocales: () => ['en-US'],
  history: { location: { pathname: '/devices' }, push: jest.fn() },
  Link: ({ children }: any) => children,
  setLocale: jest.fn(),
  useIntl: () => ({
    formatMessage: ({ defaultMessage }: { defaultMessage: string }) =>
      defaultMessage,
  }),
  useModel: () => ({
    initialState: mockInitialState,
    setInitialState: mockSetInitialState,
    refresh: mockRefresh,
  }),
}));
jest.mock('./requestErrorConfig', () => ({
  errorConfig: {},
  PERMISSIONS_STALE_EVENT: 'auth:permissions-stale',
}));
jest.mock('@/components', () => ({}));
jest.mock('@/services/rustdesk-console/auth', () => ({
  currentUser: jest.fn(),
}));
jest.mock('@/services/rustdesk-console/permission', () => ({
  getMyPermissions: jest.fn(),
}));
jest.mock('@/services/rustdesk-console/settings', () => ({
  getFrontendSettings: jest.fn(),
}));
jest.mock('antd', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  return {
    Alert: ({ action, message }: any) =>
      ReactModule.createElement(
        'div',
        null,
        ReactModule.createElement('span', null, message),
        action,
      ),
    Button: ({ children, onClick }: any) =>
      ReactModule.createElement(
        'button',
        { type: 'button', onClick },
        children,
      ),
  };
});
jest.mock('@ant-design/pro-components', () => ({
  SettingDrawer: () => null,
}));

import { currentUser } from '@/services/rustdesk-console/auth';
import { getMyPermissions } from '@/services/rustdesk-console/permission';
import { getFrontendSettings } from '@/services/rustdesk-console/settings';
import { getInitialState } from './app';
import AuthSync from './components/AuthSync';

const historyPushMock = jest.mocked(history.push);
const currentUserMock = jest.mocked(currentUser);
const getMyPermissionsMock = jest.mocked(getMyPermissions);
const getFrontendSettingsMock = jest.mocked(getFrontendSettings);

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  mockRefresh.mockReset();
  mockSetInitialState.mockReset();
  historyPushMock.mockReset();
  currentUserMock.mockReset();
  getMyPermissionsMock.mockReset();
  getFrontendSettingsMock.mockReset();
  mockInitialState = { currentUser: { guid: 'old-user' } };
  (history.location as { pathname: string }).pathname = '/devices';
});

test('keeps the authenticated user out of the 403 route when initial permission loading fails', async () => {
  localStorage.setItem(TOKEN_KEY, 'valid-token');
  currentUserMock.mockResolvedValue({ guid: 'user-guid' } as API.CurrentUser);
  getFrontendSettingsMock.mockResolvedValue({
    defaultLanguage: 'en-US',
  } as API.FrontendSettings);
  getMyPermissionsMock.mockRejectedValue(new Error('network unavailable'));

  const state = await getInitialState();

  expect(state.currentUser).toEqual({ guid: 'user-guid' });
  expect(state.permissions).toBeUndefined();
  expect(state.permissionsLoadFailed).toBe(true);
  expect(historyPushMock).toHaveBeenCalledWith('/address-book/personal');
});

test('shows an explicit retry action while permissions are unavailable', () => {
  mockInitialState = {
    currentUser: { guid: 'old-user' },
    permissionsLoadFailed: true,
  };
  const view = render(React.createElement(AuthSync));

  fireEvent.click(view.getByRole('button', { name: 'Retry' }));

  expect(mockRefresh).toHaveBeenCalledTimes(1);
});

test('refreshes an already authenticated tab when another tab replaces its token', async () => {
  localStorage.setItem(TOKEN_KEY, 'new-token');
  render(React.createElement(AuthSync));

  await act(async () => {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: TOKEN_KEY,
        oldValue: 'old-token',
        newValue: 'new-token',
      }),
    );
  });

  expect(mockRefresh).toHaveBeenCalledTimes(1);
});

test('clears authentication when another tab removes the only token', async () => {
  render(React.createElement(AuthSync));

  await act(async () => {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: TOKEN_KEY,
        oldValue: 'old-token',
        newValue: null,
      }),
    );
  });

  expect(mockSetInitialState).toHaveBeenCalledWith(expect.any(Function));
  expect(historyPushMock).toHaveBeenCalledWith('/user/login');
  expect(mockRefresh).not.toHaveBeenCalled();
});

test('keeps a tab-local session when a shared token is removed', async () => {
  sessionStorage.setItem(TOKEN_KEY, 'tab-token');
  render(React.createElement(AuthSync));

  await act(async () => {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: TOKEN_KEY,
        oldValue: 'shared-token',
        newValue: null,
      }),
    );
  });

  expect(mockRefresh).toHaveBeenCalledTimes(1);
  expect(historyPushMock).not.toHaveBeenCalled();
});

test('keeps current permissions when a refresh fails for a network reason', async () => {
  getMyPermissionsMock.mockRejectedValue(new Error('network unavailable'));
  render(React.createElement(AuthSync));

  await act(async () => {
    window.dispatchEvent(new Event('auth:permissions-stale'));
  });

  expect(mockSetInitialState).not.toHaveBeenCalled();
  expect(historyPushMock).not.toHaveBeenCalled();
});

test('clears the session when the permission refresh returns 401', async () => {
  localStorage.setItem(TOKEN_KEY, 'expired-token');
  getMyPermissionsMock.mockRejectedValue({ response: { status: 401 } });
  render(React.createElement(AuthSync));

  await act(async () => {
    window.dispatchEvent(new Event('auth:permissions-stale'));
  });

  expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  expect(mockSetInitialState).toHaveBeenCalledWith(expect.any(Function));
  expect(historyPushMock).toHaveBeenCalledWith('/user/login');
});
