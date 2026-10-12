/** @jest-environment node */
import { expect, test } from '@jest/globals';
import { FileTransfer, type FileEvent } from './transfer';

test('独立审查：已取消命令的迟到发送失败不能终止新下载', async () => {
  const events: FileEvent[] = [];
  let rejectOld: (error: Error) => void = () => {};
  const pendingSend = new Promise<void>((_resolve, reject) => {
    rejectOld = reject;
  });
  const transfer = new FileTransfer(
    async (message) => {
      if (message.fileAction?.send?.id === 1) await pendingSend;
    },
    (event) => events.push(event),
  );
  try {
    const first = transfer.command({
      type: 'download',
      path: 'C:/a.bin',
      name: 'a.bin',
      size: 1,
    });
    await transfer.command({ type: 'cancel' });
    await transfer.command({
      type: 'download',
      path: 'C:/b.bin',
      name: 'b.bin',
      size: 1,
    });
    const count = events.length;
    rejectOld(new Error('Cancelled while waiting for transport drain'));
    await first;
    expect(events.slice(count)).toEqual([]);
  } finally {
    transfer.dispose();
  }
});
