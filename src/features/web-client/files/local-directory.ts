import {
  createDownloadSink,
  type DownloadSink,
  type WritableFile,
} from './download';
import { FILE_LIMITS, safeName } from './transfer';

export interface LocalFileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<WritableFile>;
}
export interface LocalDirectoryHandle {
  kind: 'directory';
  name: string;
  entries(): AsyncIterableIterator<
    [string, LocalDirectoryHandle | LocalFileHandle]
  >;
  getDirectoryHandle(name: string): Promise<LocalDirectoryHandle>;
  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<LocalFileHandle>;
  queryPermission?(options: { mode: 'readwrite' }): Promise<PermissionState>;
}
export interface LocalEntry {
  name: string;
  directory: boolean;
  handle: LocalDirectoryHandle | LocalFileHandle;
}
export interface LocalDirectoryView {
  rootName: string;
  path: string;
  handle: LocalDirectoryHandle;
  entries: LocalEntry[];
}
type DirectoryPicker = {
  showDirectoryPicker?: (options: {
    mode: 'readwrite';
  }) => Promise<LocalDirectoryHandle>;
};
export const localDirectorySupported = () =>
  typeof (window as unknown as DirectoryPicker).showDirectoryPicker ===
  'function';

function pathParts(path: string) {
  if (path.length > 2048 || path.includes('\\'))
    throw new Error('Invalid local path');
  const parts = path.split('/').filter(Boolean);
  parts.forEach((part) => {
    if (part === '.' || part === '..') throw new Error('Invalid local path');
    safeName(part);
  });
  return parts;
}
async function list(handle: LocalDirectoryHandle) {
  const entries: LocalEntry[] = [];
  // 只枚举当前目录的句柄，不读取文件内容，也不递归扫描。
  for await (const [name, child] of handle.entries()) {
    if (entries.length >= FILE_LIMITS.entries)
      throw new Error('Too many local entries');
    if (!name || name.length > 255 || name === '.' || name === '..') continue;
    entries.push({
      name,
      directory: child.kind === 'directory',
      handle: child,
    });
  }
  return entries.sort(
    (a, b) =>
      Number(b.directory) - Number(a.directory) || a.name.localeCompare(b.name),
  );
}

export class LocalDirectory {
  private root?: LocalDirectoryHandle;
  private view?: LocalDirectoryView;
  private revision = 0;
  async choose(): Promise<LocalDirectoryView | undefined> {
    const picker = window as unknown as DirectoryPicker;
    if (!picker.showDirectoryPicker)
      throw new Error('Directory picker unavailable');
    const revision = ++this.revision;
    try {
      const root = await picker.showDirectoryPicker({ mode: 'readwrite' });
      if (revision !== this.revision) return;
      const entries = await list(root);
      if (revision !== this.revision) return;
      this.root = root;
      this.view = { rootName: root.name, path: '/', handle: root, entries };
      return this.view;
    } catch (error) {
      // 用户取消不清除现有授权目录。
      if (error instanceof Error && error.name === 'AbortError') return;
      throw error;
    }
  }
  async navigate(path: string): Promise<LocalDirectoryView | undefined> {
    const root = this.root;
    if (!root) throw new Error('No local directory');
    const parts = pathParts(path);
    const revision = ++this.revision;
    let handle = root;
    for (const part of parts) handle = await handle.getDirectoryHandle(part);
    const entries = await list(handle);
    if (revision !== this.revision || root !== this.root) return;
    this.view = {
      rootName: root.name,
      path: `/${parts.join('/')}`,
      handle,
      entries,
    };
    return this.view;
  }
  current() {
    return this.view;
  }
  dispose() {
    ++this.revision;
    this.root = undefined;
    this.view = undefined;
  }
}

export class LocalFileConflict extends Error {
  constructor() {
    super('Local file exists');
  }
}
export async function directoryDownload(
  target: LocalDirectoryHandle,
  name: string,
  size: number,
  overwrite: boolean,
): Promise<DownloadSink> {
  safeName(name);
  if (!Number.isSafeInteger(size) || size < 0) throw new Error('Invalid size');
  if (
    target.queryPermission &&
    (await target.queryPermission({ mode: 'readwrite' })) !== 'granted'
  )
    throw new Error('Local write permission denied');
  if (!overwrite) {
    try {
      await target.getFileHandle(name);
      throw new LocalFileConflict();
    } catch (error) {
      if (!(error instanceof Error) || error.name !== 'NotFoundError')
        throw error;
    }
  }
  const file = await target.getFileHandle(name, { create: true });
  const writer = await file.createWritable();
  return createDownloadSink(name, size, writer);
}
