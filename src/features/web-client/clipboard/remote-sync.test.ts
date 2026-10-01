/** @jest-environment node */
import { expect, jest, test } from '@jest/globals';
import { RemoteClipboardSync, type ClipboardValue } from './remote-sync';
const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
const deferred = () => {
  let finish!: () => void;
  let fail!: (error: Error) => void;
  const promise = new Promise<void>((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });
  return { promise, finish, fail };
};
const png = () =>
  new Uint8Array(
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jH7kAAAAASUVORK5CYII=',
      'base64',
    ),
  );
function fixture() {
  let allowed = true;
  const pending = deferred();
  const write = jest
    .fn<(value: ClipboardValue) => Promise<void>>()
    .mockImplementationOnce(() => pending.promise)
    .mockResolvedValue();
  const blocked = jest.fn<(value: boolean) => void>();
  const sync = new RemoteClipboardSync(() => allowed, write, blocked);
  return {
    sync,
    write,
    blocked,
    pending,
    disable: () => {
      allowed = false;
      sync.reset();
    },
  };
}
test('远端变化串行处理；在途重复去重，只保留最新一份排队内容', async () => {
  const { sync, write, pending } = fixture();
  sync.receive({ text: 'first' });
  sync.receive({ text: 'first' });
  sync.receive({ text: 'discarded' });
  sync.receive({ text: 'latest' });
  expect(write).toHaveBeenCalledTimes(1);
  pending.finish();
  await settle();
  expect(write).toHaveBeenCalledTimes(2);
  expect(write).toHaveBeenLastCalledWith({ text: 'latest' });
  sync.receive({ text: 'latest' });
  expect(write).toHaveBeenCalledTimes(2);
});
test.each(['logout', 'blur', 'hidden', 'revoked'])(
  '%s 使排队内容及迟到失败失效，无法撤回已提交浏览器的写入',
  async () => {
    const { sync, write, pending, disable, blocked } = fixture();
    sync.receive({ text: 'already submitted' });
    sync.receive({ text: 'queued secret' });
    disable();
    pending.fail(new Error('late denied'));
    await settle();
    expect(write).toHaveBeenCalledTimes(1);
    expect(blocked).not.toHaveBeenCalledWith(true);
    sync.retry();
    expect(write).toHaveBeenCalledTimes(1);
  },
);
test('本机粘贴清除旧排队值且远端回显不会覆盖本机内容', async () => {
  const { sync, write, pending } = fixture();
  sync.receive({ text: 'old' });
  sync.receive({ text: 'obsolete' });
  sync.rememberLocal({ text: 'local' });
  sync.receive({ text: 'local' });
  pending.finish();
  await settle();
  expect(write).toHaveBeenCalledTimes(1);
  sync.receive({ text: 'new remote' });
  await settle();
  expect(write).toHaveBeenLastCalledWith({ text: 'new remote' });
});
test('浏览器拒绝后不自动重试；显式复制使用最新内容，失败不报告成功', async () => {
  const { sync, write, pending, blocked } = fixture();
  sync.receive({ text: 'first' });
  sync.receive({ text: 'latest' });
  pending.fail(new Error('denied'));
  await settle();
  expect(blocked).toHaveBeenLastCalledWith(true);
  expect(write).toHaveBeenCalledTimes(1);
  sync.receive({ text: 'newest' });
  expect(write).toHaveBeenCalledTimes(1);
  write.mockRejectedValueOnce(new Error('still denied'));
  sync.retry();
  await settle();
  expect(write).toHaveBeenLastCalledWith({ text: 'newest' });
  expect(blocked).toHaveBeenLastCalledWith(true);
  sync.retry();
  await settle();
  expect(blocked).toHaveBeenLastCalledWith(false);
});
test('不同代次在旧写入结束前不会并发启动，新队列不被旧完成覆盖', async () => {
  const { sync, write, pending } = fixture();
  sync.receive({ text: 'old epoch' });
  sync.reset();
  sync.receive({ text: 'new epoch' });
  expect(write).toHaveBeenCalledTimes(1);
  pending.finish();
  await settle();
  expect(write).toHaveBeenLastCalledWith({ text: 'new epoch' });
  expect(write).toHaveBeenCalledTimes(2);
});
test('写入新值时复制回已完成的内容，最终仍以最近的远端变化为准', async () => {
  const pending = deferred();
  const write = jest
    .fn<(value: ClipboardValue) => Promise<void>>()
    .mockResolvedValueOnce()
    .mockImplementationOnce(() => pending.promise)
    .mockResolvedValue();
  const sync = new RemoteClipboardSync(() => true, write, () => {});
  sync.receive({ text: 'A' });
  await settle();
  sync.receive({ text: 'B' });
  sync.receive({ text: 'A' });
  expect(write).toHaveBeenCalledTimes(2);
  pending.finish();
  await settle();
  expect(write).toHaveBeenCalledTimes(3);
  expect(write).toHaveBeenLastCalledWith({ text: 'A' });
});
test('排队值切回在途内容时舍弃旧队列，不重复写入相同内容', async () => {
  const { sync, write, pending } = fixture();
  sync.receive({ text: 'A' });
  sync.receive({ text: 'obsolete B' });
  sync.receive({ text: 'A' });
  pending.finish();
  await settle();
  expect(write).toHaveBeenCalledTimes(1);
});
test('浏览器拒绝后最新内容切回已写内容，显式重试无需重复写入且清除提示', async () => {
  const write = jest
    .fn<(value: ClipboardValue) => Promise<void>>()
    .mockResolvedValueOnce()
    .mockRejectedValueOnce(new Error('denied'));
  const blocked = jest.fn<(value: boolean) => void>();
  const sync = new RemoteClipboardSync(() => true, write, blocked);
  sync.receive({ text: 'A' });
  await settle();
  sync.receive({ text: 'B' });
  await settle();
  expect(blocked).toHaveBeenLastCalledWith(true);
  sync.receive({ text: 'A' });
  expect(write).toHaveBeenCalledTimes(2);
  sync.retry();
  await settle();
  expect(write).toHaveBeenCalledTimes(2);
  expect(blocked).toHaveBeenLastCalledWith(false);
});
test('受支持PNG直接同步并按字节去重，超限文本与损坏图片拒绝', async () => {
  const { sync, write, pending } = fixture();
  sync.receive({ bytes: png() });
  sync.receive({ bytes: png() });
  expect(write).toHaveBeenCalledTimes(1);
  pending.finish();
  await settle();
  sync.receive({ bytes: png() });
  sync.receive({ bytes: new Uint8Array([1, 2, 3]) });
  sync.receive({ text: '中'.repeat(400000) });
  expect(write).toHaveBeenCalledTimes(1);
});
