import { beforeEach, expect, jest, test } from '@jest/globals';
const mockRequest = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockRemoveToken = jest.fn();
jest.mock('@umijs/max', () => ({ request: (...args: unknown[]) => mockRequest(...args) }));
jest.mock('@/utils/auth', () => ({ removeToken: () => mockRemoveToken() }));
import { createWebClientSession, createWebClientFileSession, getWebClientConfiguration, getWebClientDevices, getWebClientSessionNetwork, endWebClientSession, reportWebClientEvent } from './webClient';
import { unavailableTcp } from './tcpObservation';
beforeEach(() => { mockRequest.mockReset().mockResolvedValue({}); mockRemoveToken.mockClear(); });
test('质量监测读取自己的当前会话连接，拒绝其它会话、默认值及错误方向', async () => {
  const controller = new AbortController();
  const state = { api_version: 1, session_guid: 'guid', entry: unavailableTcp('connection', 'proxy_unobservable'),
    relay: { ...unavailableTcp('connection', 'source_unavailable'), status: 'identified', algorithm: 'cubic', reason: null } };
  mockRequest.mockResolvedValueOnce(state);
  expect(await getWebClientSessionNetwork('guid', { signal: controller.signal })).toEqual(state);
  expect(mockRequest).toHaveBeenLastCalledWith('/api/web-client/sessions/guid/network', {
    method: 'GET', timeout: 10000, signal: controller.signal, skipErrorHandler: true,
  });
  for (const invalid of [null, { ...state, session_guid: 'other' }, { ...state, entry: unavailableTcp('system', 'source_unavailable') },
    { scope: 'host_new_tcp_connections', algorithm: 'bbr' }]) {
    mockRequest.mockResolvedValueOnce(invalid);
    await expect(getWebClientSessionNetwork('guid')).rejects.toThrow('Invalid session network observation');
  }
});

test('专用设备范围和每个用途独立授权，不把HTTP认证放进socket URL', async () => {
  await getWebClientDevices({ current: 1, pageSize: 6 });
  await createWebClientSession('123456789');
  await createWebClientFileSession('parent');
  await reportWebClientEvent('file', { event: 'file_started', fileName: 'example.txt', size: 12, direction: 'upload' });
  await endWebClientSession('file');
  expect(mockRequest.mock.calls.map(([url]) => url)).toEqual(['/api/web-client/devices', '/api/web-client/sessions', '/api/web-client/sessions/parent/files', '/api/web-client/sessions/file/events', '/api/web-client/sessions/file']);
  expect(mockRequest.mock.calls[1][1]).toEqual({ method: 'POST', data: { targetId: '123456789' }, skipErrorHandler: true });
});
test.each([getWebClientConfiguration, () => createWebClientSession('123456789'), () => createWebClientFileSession('parent')])('401统一使当前登录失效', async (request) => {
  const expired = jest.fn(); window.addEventListener('auth:session-expired', expired);
  mockRequest.mockRejectedValueOnce({ response: { status: 401 } });
  await expect(request()).rejects.toMatchObject({ response: { status: 401 } });
  expect(expired).toHaveBeenCalledTimes(1); expect(mockRemoveToken).toHaveBeenCalledTimes(1);
  window.removeEventListener('auth:session-expired', expired);
});
test('403刷新权限但不擅自注销，清理请求仍可在权限撤销后发出', async () => {
  const stale = jest.fn(); window.addEventListener('auth:permissions-stale', stale);
  mockRequest.mockRejectedValueOnce({ response: { status: 403 } });
  await expect(createWebClientFileSession('parent')).rejects.toMatchObject({ response: { status: 403 } });
  expect(stale).toHaveBeenCalledTimes(1); expect(mockRemoveToken).not.toHaveBeenCalled();
  await endWebClientSession('parent');
  window.removeEventListener('auth:permissions-stale', stale);
});

test('配置403不触发权限刷新循环，保持页面友好拒绝', async () => {
  const stale = jest.fn(); window.addEventListener('auth:permissions-stale', stale);
  mockRequest.mockRejectedValue({ response: { status: 403 } });
  await expect(getWebClientConfiguration()).rejects.toMatchObject({ response: { status: 403 } });
  await expect(getWebClientConfiguration()).rejects.toMatchObject({ response: { status: 403 } });
  expect(stale).not.toHaveBeenCalled(); expect(mockRemoveToken).not.toHaveBeenCalled();
  window.removeEventListener('auth:permissions-stale', stale);
});
