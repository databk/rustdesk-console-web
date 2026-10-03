import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { act, cleanup, render } from '@testing-library/react';
import { history } from '@umijs/max';
import React from 'react';
import { TOKEN_KEY } from './utils/auth';

const mockRefresh = jest.fn();
const mockSetInitialState = jest.fn();
let mockInitialState: { currentUser?: { guid: string } } = {
  currentUser: { guid: 'old-user' },
};

jest.mock('@umijs/max', () => ({
  getAllLocales: () => ['en-US'],
  useIntl: () => ({ formatMessage: ({ defaultMessage }: { defaultMessage: string }) => defaultMessage }),
  history: { location: { pathname: '/devices' }, push: jest.fn() },
  Link: ({ children }: any) => children,
  setLocale: jest.fn(),
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
jest.mock('@ant-design/pro-components', () => ({
  SettingDrawer: () => null,
}));
jest.mock('@/services/rustdesk-console/webClient', () => ({
  getWebClientConfiguration: async () => ({
    enabled: true,
    idServerUrl: 'wss://example.test/id',
    relayServerUrl: 'wss://example.test/relay',
    serverPublicKey: 'public-key',
  }),
}));

import AuthSync from './components/AuthSync';
import useWebClient from './models/webClient';

const historyPushMock = jest.mocked(history.push);

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockInitialState = { currentUser: { guid: 'old-user' } };
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
  expect(mockSetInitialState).toHaveBeenCalledTimes(1);
  const clear = mockSetInitialState.mock.calls[0][0] as (
    state: object,
  ) => object;
  expect(
    clear({
      currentUser: { guid: 'old-user' },
      permissions: { permissions: ['devices.view'] },
      settings: {},
    }),
  ).toEqual({
    currentUser: undefined,
    permissions: undefined,
    permissionsLoadFailed: false,
    settings: {},
  });
  expect(mockSetInitialState.mock.invocationCallOrder[0]).toBeLessThan(
    mockRefresh.mock.invocationCallOrder[0],
  );
});

test('clears the previous account even while the replacement identity request is stalled', async () => {
  localStorage.setItem(TOKEN_KEY, 'replacement-token');
  mockRefresh.mockImplementation(() => new Promise(() => {}));
  render(React.createElement(AuthSync));
  await act(async () => {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: TOKEN_KEY,
        oldValue: 'old-token',
        newValue: 'replacement-token',
      }),
    );
  });
  expect(mockSetInitialState).toHaveBeenCalledTimes(1);
  expect(mockRefresh).toHaveBeenCalledTimes(1);
  expect(historyPushMock).not.toHaveBeenCalled();
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

test('an unresolved account refresh cannot retain the old Web Client configuration or resources', async () => {
  const dispose = jest.fn();
  function AccountResources() {
    const { configuration } = useWebClient();
    React.useEffect(() => {
      if (configuration?.enabled)
        return () => {
          dispose();
        };
      return undefined;
    }, [configuration]);
    return React.createElement(
      'span',
      { 'data-testid': 'profile' },
      configuration?.enabled ? 'ready' : 'none',
    );
  }
  function Harness() {
    const [state, setState] = React.useState(mockInitialState);
    mockInitialState = state;
    mockSetInitialState.mockImplementation((value) =>
      setState(value as Parameters<typeof setState>[0]),
    );
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(AuthSync),
      React.createElement(AccountResources),
    );
  }
  localStorage.setItem(TOKEN_KEY, 'old-token');
  mockRefresh.mockImplementation(() => new Promise(() => {}));
  const view = render(React.createElement(Harness));
  await act(async () => {});
  expect(view.getByTestId('profile').textContent).toBe('ready');
  await act(async () => {
    localStorage.setItem(TOKEN_KEY, 'replacement-token');
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: TOKEN_KEY,
        oldValue: 'old-token',
        newValue: 'replacement-token',
      }),
    );
  });
  expect(mockRefresh).toHaveBeenCalledTimes(1);
  expect(view.getByTestId('profile').textContent).toBe('none');
  expect(dispose).toHaveBeenCalledTimes(1);
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
