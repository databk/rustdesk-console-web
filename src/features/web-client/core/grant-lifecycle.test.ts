import { expect, jest, test } from '@jest/globals';
import { GrantLifecycle } from './grant-lifecycle';
import type { WebClientGrant } from './gateway';
const grant = (sessionGuid: string): WebClientGrant => ({
  sessionGuid,
  gatewayPath: '/api/web-client/socket',
  tickets: { rendezvous: 'r', relay: 'l' },
  expiresAt: new Date(Date.now() + 60000).toISOString(),
});
function pending() {
  let resolve!: (grant: WebClientGrant) => void;
  const promise = new Promise<WebClientGrant>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
test('取消后迟到授权只结束服务器会话，不启动旧连接', async () => {
  const end = jest
    .fn<(guid: string) => Promise<unknown>>()
    .mockResolvedValue({});
  const lifecycle = new GrantLifecycle(end),
    request = pending();
  const acquired = lifecycle.acquire(() => request.promise);
  lifecycle.cancel();
  request.resolve(grant('old'));
  expect(await acquired).toBeUndefined();
  expect(lifecycle.current()).toBeUndefined();
  expect(end).toHaveBeenCalledWith('old');
});
test('重叠申请的晚到结果不能结束新授权，清理幂等', async () => {
  const end = jest
    .fn<(guid: string) => Promise<unknown>>()
    .mockResolvedValue({});
  const lifecycle = new GrantLifecycle(end),
    first = pending();
  const old = lifecycle.acquire(() => first.promise);
  await lifecycle.acquire(async () => grant('new'));
  first.resolve(grant('old'));
  await old;
  expect(lifecycle.current()?.sessionGuid).toBe('new');
  expect(end.mock.calls).toEqual([['old']]);
  lifecycle.cancel();
  lifecycle.cancel();
  expect(end.mock.calls).toEqual([['old'], ['new']]);
});
