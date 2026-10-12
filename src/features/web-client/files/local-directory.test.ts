/** @jest-environment jsdom */
import '../input/dom-test-encoding';
import { afterEach, expect, jest, test } from '@jest/globals';
import {
  directoryDownload,
  LocalDirectory,
  LocalFileConflict,
  type LocalDirectoryHandle,
  type LocalFileHandle,
} from './local-directory';
import type { WritableFile } from './download';
import { FILE_LIMITS } from './transfer';

function folder(
  name: string,
  children: (LocalDirectoryHandle | LocalFileHandle)[] = [],
): LocalDirectoryHandle {
  return {
    kind: 'directory',
    name,
    async *entries() {
      for (const child of children) yield [child.name, child];
    },
    async getDirectoryHandle(path) {
      const found = children.find(
        (item) => item.name === path && item.kind === 'directory',
      );
      if (!found) throw new DOMException('Missing', 'NotFoundError');
      return found as LocalDirectoryHandle;
    },
    async getFileHandle(path) {
      const found = children.find(
        (item) => item.name === path && item.kind === 'file',
      );
      if (!found) throw new DOMException('Missing', 'NotFoundError');
      return found as LocalFileHandle;
    },
  };
}
afterEach(() => {
  Reflect.deleteProperty(window, 'showDirectoryPicker');
});

test('目录授权只枚举当前句柄，不读取文件或递归；导航不能穿过根', async () => {
  const getFile = jest.fn<() => Promise<File>>();
  const child = folder('Child', []);
  const root = folder('Root', [
    child,
    {
      kind: 'file',
      name: 'one.txt',
      getFile,
      createWritable: jest.fn<() => Promise<WritableFile>>(),
    },
  ]);
  Object.assign(window, {
    showDirectoryPicker: jest
      .fn<() => Promise<LocalDirectoryHandle>>()
      .mockResolvedValue(root),
  });
  const local = new LocalDirectory();
  expect((await local.choose())?.entries.map((entry) => entry.name)).toEqual([
    'Child',
    'one.txt',
  ]);
  expect(getFile).not.toHaveBeenCalled();
  expect((await local.navigate('/Child'))?.path).toBe('/Child');
  for (const path of [
    '../Child',
    '/Child/..',
    'C:/Users',
    '/Child/../X',
    '/Child\\X',
  ])
    await expect(local.navigate(path)).rejects.toThrow();
  expect(local.current()?.path).toBe('/Child');
  expect((await local.navigate('/'))?.rootName).toBe('Root');
});

test('取消新目录选择保留现有目录，已销毁的迟到选择不能恢复授权', async () => {
  const root = folder('Root');
  const picker = jest
    .fn<() => Promise<LocalDirectoryHandle>>()
    .mockResolvedValueOnce(root)
    .mockRejectedValueOnce(new DOMException('Cancelled', 'AbortError'));
  Object.assign(window, { showDirectoryPicker: picker });
  const local = new LocalDirectory();
  await local.choose();
  expect(await local.choose()).toBeUndefined();
  expect(local.current()?.rootName).toBe('Root');
  let finish!: (value: LocalDirectoryHandle) => void;
  picker.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const choosing = local.choose();
  local.dispose();
  finish(folder('Late'));
  expect(await choosing).toBeUndefined();
  expect(local.current()).toBeUndefined();
});

test('旧目录枚举迟到时不能覆盖新导航', async () => {
  let finish!: () => void;
  const slow = folder('Slow');
  slow.entries = async function* () {
    await new Promise<void>((resolve) => {
      finish = resolve;
    });
  };
  const root = folder('Root', [slow, folder('Fast')]);
  Object.assign(window, { showDirectoryPicker: async () => root });
  const local = new LocalDirectory();
  await local.choose();
  const pending = local.navigate('/Slow');
  await Promise.resolve();
  await local.navigate('/Fast');
  finish();
  expect(await pending).toBeUndefined();
  expect(local.current()?.path).toBe('/Fast');
});

test('枚举有界，拒绝过大目录而保留原根', async () => {
  const root = folder('Root');
  const tooMany = folder('Large');
  let count = 0;
  tooMany.entries = async function* () {
    for (let i = 0; i < FILE_LIMITS.entries + 10; ++i) {
      count++;
      yield [String(i), folder(String(i))];
    }
  };
  Object.assign(window, {
    showDirectoryPicker: jest
      .fn<() => Promise<LocalDirectoryHandle>>()
      .mockResolvedValueOnce(root)
      .mockResolvedValueOnce(tooMany),
  });
  const local = new LocalDirectory();
  await local.choose();
  await expect(local.choose()).rejects.toThrow('Too many');
  expect(count).toBe(FILE_LIMITS.entries + 1);
  expect(local.current()?.rootName).toBe('Root');
});

test('直接写入目录先处理重名，再逐块写流；完成与取消保留边界', async () => {
  const write = jest
    .fn<(bytes: Uint8Array) => Promise<void>>()
    .mockResolvedValue(undefined);
  const close = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const abort = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const createWritable = jest
    .fn<() => Promise<WritableFile>>()
    .mockResolvedValue({ write, close, abort });
  const file = {
    kind: 'file' as const,
    name: 'one.txt',
    getFile: jest.fn<() => Promise<File>>(),
    createWritable,
  };
  const target = folder('Root', [file]);
  await expect(
    directoryDownload(target, 'one.txt', 2, false),
  ).rejects.toBeInstanceOf(LocalFileConflict);
  expect(createWritable).not.toHaveBeenCalled();
  const sink = await directoryDownload(target, 'one.txt', 2, true);
  await sink.write(new Uint8Array([1]));
  await expect(sink.close()).rejects.toThrow('Incomplete');
  await sink.write(new Uint8Array([2]));
  await sink.close();
  await sink.abort();
  expect(write).toHaveBeenCalledTimes(2);
  expect(close).toHaveBeenCalledTimes(1);
  expect(abort).not.toHaveBeenCalled();
  const cancelled = await directoryDownload(target, 'one.txt', 2, true);
  await cancelled.abort();
  await cancelled.abort();
  expect(abort).toHaveBeenCalledTimes(1);
});

test('写入权限、目录冲突、非法名字不能被覆盖选项绕过', async () => {
  const target = folder('Root');
  target.queryPermission = async () => 'denied';
  await expect(directoryDownload(target, 'one.txt', 1, true)).rejects.toThrow(
    'permission',
  );
  delete target.queryPermission;
  target.getFileHandle = async () => {
    throw new DOMException('Directory exists', 'TypeMismatchError');
  };
  await expect(directoryDownload(target, 'one.txt', 1, false)).rejects.toThrow(
    'Directory',
  );
  await expect(directoryDownload(target, '../x', 1, true)).rejects.toThrow();
});
