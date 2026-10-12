/** @jest-environment jsdom */
import '../input/dom-test-encoding';
import { afterEach, expect, jest, test } from '@jest/globals';
import { chooseDownload } from './download';
import { FILE_LIMITS } from './transfer';

afterEach(() => {
  Reflect.deleteProperty(window, 'showSaveFilePicker');
  jest.restoreAllMocks();
});
test('无写流时在创建缓冲前拒绝超限下载与路径名称', async () => {
  await expect(
    chooseDownload('a.bin', FILE_LIMITS.fallback + 1),
  ).rejects.toThrow();
  await expect(chooseDownload('../a', 1)).rejects.toThrow();
});
test('流式文件不聚合到 Blob，匹配长度后才 close，取消 abort', async () => {
  const write = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const close = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const abort = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const picker = jest.fn<() => Promise<object>>().mockResolvedValue({
    createWritable: async () => ({ write, close, abort }),
  });
  Object.assign(window, { showSaveFilePicker: picker });
  const sink = await chooseDownload('中文.bin', 3);
  await sink.write(new Uint8Array([1, 2]));
  await expect(sink.close()).rejects.toThrow();
  expect(close).not.toHaveBeenCalled();
  await sink.write(new Uint8Array([3]));
  await sink.close();
  expect(write).toHaveBeenCalledTimes(2);
  expect(close).toHaveBeenCalledTimes(1);
  await sink.abort();
  expect(abort).not.toHaveBeenCalled();
  const cancelled = await chooseDownload('a', 1);
  await cancelled.abort();
  await cancelled.abort();
  expect(abort).toHaveBeenCalledTimes(1);
  await expect(cancelled.write(new Uint8Array([1]))).rejects.toThrow();
});
test('零字节文件可以提交，写入失败向上返回', async () => {
  const close = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  Object.assign(window, {
    showSaveFilePicker: async () => ({
      createWritable: async () => ({
        close,
        abort: async () => {},
        write: async () => {
          throw new Error('disk');
        },
      }),
    }),
  });
  const empty = await chooseDownload('empty', 0);
  await empty.close();
  expect(close).toHaveBeenCalledTimes(1);
  const failed = await chooseDownload('fail', 1);
  await expect(failed.write(new Uint8Array([1]))).rejects.toThrow('disk');
  await failed.abort();
});
