import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { history } from '@umijs/max';
import { TOKEN_KEY } from './utils/auth';

const mockRefresh = jest.fn();
const mockSetInitialState = jest.fn();

jest.mock('@umijs/max', () => ({
  history: { location: { pathname: '/devices' }, push: jest.fn() },
  Link: ({ children }: any) => children,
  useModel: () => ({
    initialState: { currentUser: { guid: 'old-user' } },
    setInitialState: mockSetInitialState,
    refresh: mockRefresh,
  }),
}));
jest.mock('./requestErrorConfig', () => ({ errorConfig: {} }));
jest.mock('@/components', () => ({}));
jest.mock('@/services/rustdesk-console/auth', () => ({
  currentUser: jest.fn(),
}));
jest.mock('@/services/rustdesk-console/permission', () => ({
  getMyPermissions: jest.fn(),
}));
jest.mock('@ant-design/pro-components', () => ({
  SettingDrawer: () => null,
}));
jest.mock('@ant-design/v5-patch-for-react-19', () => ({}));

import { AuthSync } from './app';

const historyPushMock = jest.mocked(history.push);

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  mockRefresh.mockReset();
  mockSetInitialState.mockReset();
  historyPushMock.mockReset();
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
