import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { act, cleanup, renderHook } from '@testing-library/react';

type Configuration =
  import('@/services/rustdesk-console/webClient').WebClientConfiguration;
let mockUser: { guid: string } | undefined;
let mockPermissions = ['web_client.connect'];
const mockGetConfiguration = jest.fn<() => Promise<Configuration>>();
jest.mock('@umijs/max', () => ({
  useModel: () => ({
    initialState: {
      currentUser: mockUser,
      permissions: { permissions: mockPermissions, scopes: {} },
    },
  }),
}));
jest.mock('@/services/rustdesk-console/webClient', () => ({
  getWebClientConfiguration: () => mockGetConfiguration(),
  webClientHttpStatus: (error: { response?: { status?: number } }) =>
    error?.response?.status,
}));

import useWebClient from './webClient';

test('配置权限拒绝有单独提示，不伪装后端不可用', async () => {
  mockGetConfiguration.mockRejectedValueOnce({ response: { status: 403 } });
  const view = renderHook(useWebClient);
  await act(async () => {});
  expect(view.result.current.forbidden).toBe(true);
  expect(view.result.current.unavailable).toBe(false);
  expect(view.result.current.configuration).toBeUndefined();
});

const profile: Configuration = {
  enabled: true,
  idServerUrl: 'wss://example.test/id',
  relayServerUrl: 'wss://example.test/relay',
  serverPublicKey: 'public-key',
};

test('同账号权限刷新不清配置或重复请求，防止文件拒绝误断桌面', async () => {
  mockGetConfiguration.mockResolvedValueOnce(profile);
  const view = renderHook(useWebClient);
  await act(async () => {});
  mockUser = { guid: 'first' };
  view.rerender();
  await act(async () => {});
  expect(mockGetConfiguration).toHaveBeenCalledTimes(1);
  expect(view.result.current.configuration).toBe(profile);
});
beforeEach(() => {
  mockUser = { guid: 'first' };
  mockPermissions = ['web_client.connect'];
  mockGetConfiguration.mockReset();
});
test('同账号重新获网页权限时重新加载配置，未变化的权限拒绝不会循环', async () => {
  mockPermissions = [];
  mockGetConfiguration
    .mockRejectedValueOnce({ response: { status: 403 } })
    .mockResolvedValueOnce(profile);
  const view = renderHook(useWebClient);
  await act(async () => {});
  mockUser = { guid: 'first' };
  view.rerender();
  await act(async () => {});
  expect(mockGetConfiguration).toHaveBeenCalledTimes(1);
  mockPermissions = ['web_client.connect'];
  view.rerender();
  await act(async () => {});
  expect(mockGetConfiguration).toHaveBeenCalledTimes(2);
  expect(view.result.current.configuration).toBe(profile);
});
afterEach(cleanup);
function pending() {
  let resolve: (value: Configuration) => void = () => {};
  const promise = new Promise<Configuration>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
test.each([404, 503])(
  'a configuration HTTP %s stays unavailable until a successful retry',
  async (status) => {
    mockGetConfiguration
      .mockRejectedValueOnce({ response: { status } })
      .mockResolvedValueOnce(profile);
    const view = renderHook(useWebClient);
    await act(async () => {});
    expect(view.result.current.configuration).toBeUndefined();
    expect(view.result.current.unavailable).toBe(true);
    expect(view.result.current.loading).toBe(false);
    await act(async () => view.result.current.reload());
    expect(view.result.current.configuration).toBe(profile);
    expect(view.result.current.unavailable).toBe(false);
    expect(view.result.current.loading).toBe(false);
  },
);

test('a default-disabled configuration does not become an availability error', async () => {
  mockGetConfiguration.mockResolvedValueOnce({ enabled: false });
  const view = renderHook(useWebClient);
  await act(async () => {});
  expect(view.result.current.configuration).toEqual({ enabled: false });
  expect(view.result.current.unavailable).toBe(false);
  expect(view.result.current.loading).toBe(false);
});

test('new account never renders the old profile while its own request is pending', async () => {
  const second = pending();
  mockGetConfiguration
    .mockResolvedValueOnce(profile)
    .mockReturnValueOnce(second.promise);
  const renders: { user?: string; configuration?: Configuration }[] = [];
  const view = renderHook(() => {
    const value = useWebClient();
    renders.push({ user: mockUser?.guid, configuration: value.configuration });
    return value;
  });
  await act(async () => {});
  expect(view.result.current.configuration).toBe(profile);
  mockUser = { guid: 'second' };
  view.rerender();
  expect(
    renders
      .filter((r) => r.user === 'second')
      .every((r) => r.configuration === undefined),
  ).toBe(true);
  await act(async () => second.resolve({ enabled: false }));
  expect(view.result.current.configuration).toEqual({ enabled: false });
});
test('late configuration responses cannot revive the feature after logout', async () => {
  const request = pending();
  mockGetConfiguration.mockReturnValueOnce(request.promise);
  const view = renderHook(useWebClient);
  mockUser = undefined;
  view.rerender();
  await act(async () => request.resolve(profile));
  expect(view.result.current.configuration).toBeUndefined();
  expect(view.result.current.loading).toBe(false);
  expect(mockGetConfiguration).toHaveBeenCalledTimes(1);
});
