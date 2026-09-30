/** @jest-environment node */
import { afterEach, expect, test } from '@jest/globals';
import { hbb } from '../protocol';
import {
  FILE_LIMITS,
  type FileEvent,
  FileTransfer,
  safeName,
  safePath,
} from './transfer';

const active: FileTransfer[] = [];
afterEach(() => {
  active.forEach((transfer) => {
    transfer.dispose();
  });
  active.length = 0;
});
function fixture() {
  const sent: hbb.IMessage[] = [];
  const events: FileEvent[] = [];
  const transfer = new FileTransfer(
    async (message) => {
      sent.push(message);
    },
    (event) => events.push(event),
  );
  active.push(transfer);
  return {
    transfer,
    sent,
    events,
    receive: (message: hbb.IMessage) =>
      transfer.handle(hbb.Message.decode(hbb.Message.encode(message).finish())),
  };
}
async function until(predicate: () => boolean) {
  for (let index = 0; index < 100; index++) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
  throw new Error('Transfer did not advance');
}
function file(bytes: Uint8Array) {
  return {
    name: '中文.txt',
    size: bytes.length,
    lastModified: 1000,
    slice: (start: number, end: number) => new Blob([bytes.slice(start, end)]),
  } as File;
}
test.each([0, 1, FILE_LIMITS.block, FILE_LIMITS.block + 1])(
  '上传 %i 字节与原生收到的数据相等，完成需回执和远端长度',
  async (length) => {
    const f = fixture();
    const bytes = Uint8Array.from({ length }, (_, index) => index % 251);
    await f.transfer.command({
      type: 'upload',
      path: 'C:/目标',
      files: [file(bytes)],
    });
    expect(f.sent[0].fileAction?.receive?.files?.[0].name).toBe('中文.txt');
    expect(f.sent.some((message) => message.fileResponse?.block)).toBe(false);
    await f.receive({
      fileAction: { sendConfirm: { id: 1, fileNum: 0, offsetBlk: 0 } },
    });
    await until(() => f.sent.some((message) => !!message.fileResponse?.done));
    const blocks = f.sent.flatMap((message) =>
      message.fileResponse?.block
        ? [message.fileResponse.block.data || new Uint8Array()]
        : [],
    );
    expect(blocks.length).toBeGreaterThan(0);
    expect(Buffer.concat(blocks.map((block) => Buffer.from(block)))).toEqual(
      Buffer.from(bytes),
    );
    expect(blocks.every((block) => block.length <= FILE_LIMITS.block)).toBe(
      true,
    );
    expect(f.events.at(-1)).toMatchObject({
      type: 'progress',
      progress: { phase: 'verifying' },
    });
    await f.receive({ fileResponse: { done: { id: 1, fileNum: 0 } } });
    expect(
      f.events.some(
        (event) => event.type === 'progress' && event.progress.phase === 'done',
      ),
    ).toBe(false);
    await f.receive({
      fileResponse: {
        dir: {
          path: 'C:/目标',
          entries: [
            { name: '中文.txt', entryType: hbb.FileType.File, size: length },
          ],
        },
      },
    });
    expect(
      f.events.some(
        (event) => event.type === 'progress' && event.progress.phase === 'done',
      ),
    ).toBe(true);
  },
);
test('下载必须等待每块写入和最终 close；迟到 ACK 不推进', async () => {
  const f = fixture();
  await f.transfer.command({
    type: 'download',
    path: 'C:/文件.bin',
    name: '文件.bin',
    size: 3,
  });
  await f.receive({
    fileResponse: { digest: { id: 1, fileNum: 0, fileSize: 3 } },
  });
  const pending = f.receive({
    fileResponse: {
      block: { id: 1, fileNum: 0, data: new Uint8Array([1, 2, 3]) },
    },
  });
  expect(f.events.at(-1)).toMatchObject({
    type: 'chunk',
    bytes: new Uint8Array([1, 2, 3]),
  });
  await f.transfer.command({ type: 'consumed', id: 99, sequence: 1, ok: true });
  expect(f.events.at(-1)?.type).toBe('chunk');
  await f.transfer.command({ type: 'consumed', id: 1, sequence: 1, ok: true });
  await pending;
  const done = f.receive({ fileResponse: { done: { id: 1, fileNum: 1 } } });
  expect(f.events.at(-1)?.type).toBe('download-done');
  await f.transfer.command({ type: 'consumed', id: 1, sequence: 2, ok: true });
  await done;
  expect(f.events.at(-1)).toMatchObject({
    type: 'progress',
    progress: { phase: 'done', transferred: 3 },
  });
});
test('重名默认等待决定，取消和迟到原生确认不会上传', async () => {
  const f = fixture();
  await f.transfer.command({
    type: 'upload',
    path: 'C:/目标',
    files: [file(new Uint8Array([7]))],
  });
  await f.receive({
    fileResponse: {
      digest: { id: 1, fileNum: 0, isUpload: true, fileSize: 9 },
    },
  });
  expect(f.events.at(-1)).toMatchObject({
    type: 'progress',
    progress: { phase: 'conflict' },
  });
  await f.transfer.command({ type: 'cancel' });
  await f.receive({
    fileAction: { sendConfirm: { id: 1, fileNum: 0, offsetBlk: 0 } },
  });
  expect(f.sent.some((message) => message.fileResponse?.block)).toBe(false);
});
test('下载长度不符、损坏压缩和写入失败均不能完成', async () => {
  for (const block of [
    { data: new Uint8Array([1, 2]) },
    { data: new Uint8Array([1]), compressed: true },
  ]) {
    const f = fixture();
    await f.transfer.command({
      type: 'download',
      path: 'C:/a',
      name: 'a',
      size: 1,
    });
    await f.receive({
      fileResponse: { digest: { id: 1, fileNum: 0, fileSize: 1 } },
    });
    await f.receive({
      fileResponse: { block: { ...block, id: 1, fileNum: 0 } },
    });
    expect(f.events.at(-1)).toEqual({ type: 'error' });
  }
  const f = fixture();
  await f.transfer.command({
    type: 'download',
    path: 'C:/a',
    name: 'a',
    size: 1,
  });
  await f.receive({
    fileResponse: { digest: { id: 1, fileNum: 0, fileSize: 1 } },
  });
  const pending = f.receive({
    fileResponse: { block: { id: 1, fileNum: 0, data: new Uint8Array([1]) } },
  });
  await f.transfer.command({ type: 'consumed', id: 1, sequence: 1, ok: false });
  await pending;
  expect(f.events.at(-1)).toEqual({ type: 'error' });
});
test('路径穿越、设备名和不安全目录在网络发送前拒绝', () => {
  expect(safePath('c:/目录')).toBe('C:/目录');
  for (const name of ['../a', 'C:a', 'CON.txt', 'LPT1', 'a/', 'a.', 'a\b'])
    expect(() => safeName(name)).toThrow();
  for (const path of ['C:/../Windows', '//server/share', 'C:relative'])
    expect(() => safePath(path)).toThrow();
});

test('多文件顺序执行；原生拒绝与断开不启动剩余文件', async () => {
  const f = fixture();
  await f.transfer.command({
    type: 'upload',
    path: 'C:/目标',
    files: [file(new Uint8Array([1])), file(new Uint8Array([2]))],
  });
  expect(f.sent.filter((message) => message.fileAction?.receive)).toHaveLength(
    1,
  );
  await f.receive({
    fileAction: { sendConfirm: { id: 1, fileNum: 0, skip: true } },
  });
  await until(
    () => f.sent.filter((message) => message.fileAction?.receive).length === 2,
  );
  await f.receive({
    fileResponse: {
      error: { id: 2, fileNum: 0, error: 'sensitive remote path' },
    },
  });
  expect(JSON.stringify(f.events)).not.toContain('sensitive remote path');
  expect(f.events.at(-1)).toEqual({ type: 'error' });
  f.transfer.dispose();
  await f.receive({
    fileAction: { sendConfirm: { id: 2, fileNum: 0, offsetBlk: 0 } },
  });
  expect(f.sent.some((message) => message.fileResponse?.block)).toBe(false);
});

test('取消待写块会解除等待，迟到块/完成不恢复下载', async () => {
  const f = fixture();
  await f.transfer.command({
    type: 'download',
    path: 'C:/a',
    name: 'a',
    size: 1,
  });
  await f.receive({
    fileResponse: { digest: { id: 1, fileNum: 0, fileSize: 1 } },
  });
  const pending = f.receive({
    fileResponse: { block: { id: 1, fileNum: 0, data: new Uint8Array([3]) } },
  });
  await f.transfer.command({ type: 'cancel' });
  await pending;
  const count = f.events.length;
  await f.receive({ fileResponse: { done: { id: 1, fileNum: 1 } } });
  expect(f.events).toHaveLength(count);
  expect(f.events.at(-1)).toMatchObject({
    type: 'progress',
    progress: { phase: 'cancelled' },
  });
});
