import { decompressBounded } from '../clipboard/text';
import { hbb } from '../protocol';

export const FILE_LIMITS = {
  block: 128 * 1024,
  files: 32,
  entries: 4096,
  fallback: 16 * 1024 * 1024,
  timeout: 30000,
};
export type FileCommand =
  | { type: 'list'; path: string }
  | { type: 'upload'; path: string; files: File[] }
  | { type: 'download'; path: string; name: string; size: number }
  | { type: 'conflict'; id: number; overwrite: boolean }
  | { type: 'consumed'; id: number; sequence: number; ok: boolean }
  | { type: 'cancel' };
export interface RemoteEntry {
  name: string;
  path: string;
  size: number;
  directory: boolean;
}
export interface FileProgress {
  id: number;
  name: string;
  direction: 'upload' | 'download';
  total: number;
  transferred: number;
  phase:
    | 'waiting'
    | 'transferring'
    | 'conflict'
    | 'verifying'
    | 'done'
    | 'skipped'
    | 'cancelled'
    | 'error';
}
export type FileEvent =
  | { type: 'directory'; path: string; entries: RemoteEntry[] }
  | { type: 'progress'; progress: FileProgress }
  | { type: 'chunk'; id: number; sequence: number; bytes: Uint8Array }
  | { type: 'download-done'; id: number; sequence: number }
  | { type: 'error' };
type Wire = { fileAction?: hbb.IFileAction; fileResponse?: hbb.IFileResponse };
type Job = FileProgress & {
  path: string;
  file?: File;
  timer?: ReturnType<typeof setTimeout>;
  digestReceived?: boolean;
  uploadStarted?: boolean;
};

export function safeName(name: string) {
  if (
    !name ||
    name.length > 255 ||
    Array.from(name).some(
      (char) =>
        char.charCodeAt(0) < 32 ||
        [92, 47, 58, 42, 63, 34, 60, 62, 124].includes(char.charCodeAt(0)),
    ) ||
    /[. ]$/.test(name)
  )
    throw new Error('Invalid file name');
  if (
    ['CON', 'PRN', 'AUX', 'NUL'].includes(name.split('.')[0].toUpperCase()) ||
    /^(COM|LPT)[1-9]$/i.test(name.split('.')[0])
  )
    throw new Error('Invalid device name');
  return name;
}
export function safePath(path: string) {
  if (!path) return '';
  if (path === '/') return '/';
  const normalized = path.split(String.fromCharCode(92)).join('/');
  if (
    normalized.length > 2048 ||
    !/^[a-z]:/i.test(normalized) ||
    normalized[2] !== '/'
  )
    throw new Error('Invalid remote path');
  const parts = normalized.slice(3).split('/').filter(Boolean);
  parts.forEach(safeName);
  return `${normalized.slice(0, 2).toUpperCase()}/${parts.join('/')}`;
}
export function childPath(path: string, name: string) {
  const base = safePath(path);
  return safePath(base + (base.endsWith('/') ? '' : '/') + safeName(name));
}
function sizeOf(size: unknown): number {
  const value = Number(size ?? 0);
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error('Invalid file size');
  return value;
}

// 一次仅一个原生 job；上传每次 slice，下载每块等待浏览器写入确认。
export class FileTransfer {
  private nextId = 1;
  private job?: Job;
  private queue: { file: File; path: string }[] = [];
  private sequence = 0;
  private pending?: {
    id: number;
    sequence: number;
    resolve: () => void;
    reject: () => void;
    timer: ReturnType<typeof setTimeout>;
  };
  private listing?: string;
  private directoryInitialized = false;
  private disposed = false;
  private revision = 0;
  accepts(message: Wire) {
    const id = (
      message.fileAction?.receive ||
      message.fileAction?.send ||
      message.fileAction?.sendConfirm ||
      message.fileResponse?.block ||
      message.fileResponse?.digest ||
      message.fileResponse?.done
    )?.id;
    return !this.disposed && (id === undefined || id === this.job?.id);
  }
  constructor(
    private send: (message: Wire) => Promise<void>,
    private emit: (event: FileEvent) => void,
  ) {}
  private progress(job: Job) {
    const { id, name, direction, total, transferred, phase } = job;
    this.emit({
      type: 'progress',
      progress: { id, name, direction, total, transferred, phase },
    });
  }
  private touch(job: Job) {
    clearTimeout(job.timer);
    job.timer = setTimeout(() => {
      if (this.job === job) this.fail();
    }, FILE_LIMITS.timeout);
  }
  async command(command: FileCommand) {
    if (this.disposed) return;
    const revision = this.revision;
    try {
      if (command.type === 'cancel') {
        this.cancel();
        return;
      }
      if (command.type === 'consumed') {
        const pending = this.pending;
        if (
          !pending ||
          pending.id !== command.id ||
          pending.sequence !== command.sequence
        )
          return;
        this.pending = undefined;
        clearTimeout(pending.timer);
        if (command.ok) pending.resolve();
        else pending.reject();
        return;
      }
      if (command.type === 'conflict') {
        const job = this.job;
        if (!job || job.id !== command.id || job.phase !== 'conflict') return;
        if (!command.overwrite) {
          await this.send({ fileAction: { cancel: { id: job.id } } });
          this.finish(job, 'skipped');
        } else {
          await this.send({
            fileAction: {
              sendConfirm: { id: job.id, fileNum: 0, offsetBlk: 0 },
            },
          });
          void this.upload(job);
        }
        return;
      }
      if (this.job || this.queue.length) throw new Error('Busy');
      if (command.type === 'list') {
        this.listing = safePath(command.path);
        await this.send({
          fileAction: { readDir: { path: this.listing, includeHidden: false } },
        });
      }
      if (command.type === 'upload') {
        const path = safePath(command.path);
        if (
          !path ||
          path === '/' ||
          !command.files.length ||
          command.files.length > FILE_LIMITS.files
        )
          throw new Error();
        command.files.forEach((file) => {
          safeName(file.name);
          sizeOf(file.size);
        });
        this.queue = command.files.map((file) => ({ file, path }));
        await this.nextUpload();
      }
      if (command.type === 'download') {
        const path = safePath(command.path);
        const name = safeName(command.name);
        const total = sizeOf(command.size);
        if (!path || path.split('/').at(-1) !== name) throw new Error();
        const job: Job = {
          id: this.nextId++,
          name,
          path,
          direction: 'download',
          total,
          transferred: 0,
          phase: 'waiting',
        };
        this.job = job;
        this.progress(job);
        this.touch(job);
        await this.send({
          fileAction: {
            send: {
              id: job.id,
              path,
              fileNum: 0,
              fileType: hbb.FileTransferSendRequest.FileType.Generic,
            },
          },
        });
      }
    } catch {
      if (!this.disposed && revision === this.revision) this.fail();
    }
  }
  private async nextUpload() {
    const item = this.queue.shift();
    if (!item || this.disposed) return;
    const { file, path } = item;
    const job: Job = {
      id: this.nextId++,
      name: file.name,
      path,
      file,
      direction: 'upload',
      total: file.size,
      transferred: 0,
      phase: 'waiting',
    };
    this.job = job;
    this.progress(job);
    this.touch(job);
    const modifiedTime = Math.floor(file.lastModified / 1000);
    await this.send({
      fileAction: {
        receive: {
          id: job.id,
          path,
          fileNum: 0,
          totalSize: file.size,
          files: [
            {
              name: file.name,
              size: file.size,
              modifiedTime,
              entryType: hbb.FileType.File,
            },
          ],
        },
      },
    });
    if (this.job !== job) return;
    await this.send({
      fileResponse: {
        digest: {
          id: job.id,
          fileNum: 0,
          fileSize: file.size,
          lastModified: modifiedTime,
          isResume: false,
        },
      },
    });
  }
  private async upload(job: Job) {
    if (this.job !== job || job.uploadStarted || !job.file) return;
    job.uploadStarted = true;
    job.phase = 'transferring';
    this.progress(job);
    try {
      do {
        const bytes = new Uint8Array(
          await job.file
            .slice(job.transferred, job.transferred + FILE_LIMITS.block)
            .arrayBuffer(),
        );
        if (this.job !== job || this.disposed) return;
        if (
          bytes.length > FILE_LIMITS.block ||
          (!bytes.length && job.transferred < job.total)
        )
          throw new Error();
        await this.send({
          fileResponse: {
            block: { id: job.id, fileNum: 0, data: bytes, compressed: false },
          },
        });
        if (this.job !== job) return;
        job.transferred += bytes.length;
        this.touch(job);
        this.progress(job);
      } while (job.transferred < job.total);
      job.phase = 'verifying';
      this.progress(job);
      await this.send({ fileResponse: { done: { id: job.id, fileNum: 0 } } });
    } catch {
      if (this.job === job) this.fail();
    }
  }
  async handle(message: hbb.Message) {
    if (this.disposed) return;
    const revision = this.revision;
    try {
      const response = message.fileResponse;
      const confirm = message.fileAction?.sendConfirm;
      const job = this.job;
      if (
        confirm &&
        job &&
        confirm.id === job.id &&
        job.direction === 'upload' &&
        confirm.fileNum === 0
      ) {
        if (job.phase !== 'waiting') return;
        if (confirm.skip) {
          await this.send({ fileAction: { cancel: { id: job.id } } });
          this.finish(job, 'skipped');
        } else if (
          (Object.hasOwn(confirm, 'offsetBlk') && confirm.offsetBlk === 0) ||
          (Object.hasOwn(confirm, 'skip') && confirm.skip === false)
        )
          void this.upload(job);
        else throw new Error();
        return;
      }
      if (!response) return;
      if (response.error && (response.error.id ?? 0) === 0) throw new Error();
      if (response.dir && (response.dir.id ?? 0) === 0) {
        if (this.directoryInitialized && this.listing === undefined) return;
        const dir = response.dir;
        const path = safePath(dir.path || '');
        if (
          this.listing !== undefined &&
          this.listing &&
          this.listing.toLowerCase() !== path.toLowerCase()
        )
          return;
        if ((dir.entries?.length || 0) > FILE_LIMITS.entries) throw new Error();
        const entries = (dir.entries || [])
          .filter((entry) =>
            [
              hbb.FileType.File,
              hbb.FileType.Dir,
              hbb.FileType.DirDrive,
            ].includes(entry.entryType ?? 0),
          )
          .map((entry) => {
            const name = entry.name || '';
            const directory = [
              hbb.FileType.Dir,
              hbb.FileType.DirDrive,
            ].includes(entry.entryType ?? 0);
            const next =
              entry.entryType === hbb.FileType.DirDrive
                ? safePath(name.endsWith(':') ? `${name}/` : name)
                : childPath(path, name);
            return { name, path: next, size: sizeOf(entry.size), directory };
          });
        this.listing = undefined;
        this.directoryInitialized = true;
        if (
          job?.direction === 'upload' &&
          job.phase === 'verifying' &&
          job.digestReceived
        ) {
          if (
            path.toLowerCase() !== job.path.toLowerCase() ||
            !entries.some(
              (entry) =>
                entry.name === job.name &&
                !entry.directory &&
                entry.size === job.total,
            )
          )
            throw new Error();
          this.finish(job, 'done');
        }
        this.emit({ type: 'directory', path, entries });
        return;
      }
      const data =
        response.block ||
        response.done ||
        response.digest ||
        response.error ||
        response.dir;
      if (!job || !data || data.id !== job.id) return;
      this.touch(job);
      if (response.error) throw new Error();
      if (response.dir) {
        if (
          job.direction !== 'download' ||
          response.dir.entries?.length !== 1 ||
          sizeOf(response.dir.entries[0].size) !== job.total ||
          (response.dir.entries[0].name &&
            response.dir.entries[0].name !== job.name)
        )
          throw new Error();
      } else if (response.digest) {
        const digest = response.digest;
        if (digest.fileNum !== 0 || digest.isResume) throw new Error();
        if (job.direction === 'upload') {
          if (!digest.isUpload || job.phase !== 'waiting') throw new Error();
          job.phase = 'conflict';
          this.progress(job);
        } else {
          if (job.digestReceived || sizeOf(digest.fileSize) !== job.total)
            throw new Error();
          job.digestReceived = true;
          job.phase = 'transferring';
          this.progress(job);
          await this.send({
            fileAction: {
              sendConfirm: { id: job.id, fileNum: 0, offsetBlk: 0 },
            },
          });
        }
      } else if (response.block) {
        const block = response.block;
        if (
          job.direction !== 'download' ||
          !job.digestReceived ||
          block.fileNum !== 0 ||
          this.pending
        )
          throw new Error();
        const input = block.data || new Uint8Array();
        if (input.length > FILE_LIMITS.block) throw new Error();
        const bytes = block.compressed
          ? decompressBounded(input, FILE_LIMITS.block)
          : input;
        if (job.transferred + bytes.length > job.total) throw new Error();
        if (bytes.length)
          await this.consume(job, {
            type: 'chunk',
            id: job.id,
            sequence: ++this.sequence,
            bytes,
          });
        if (this.job !== job) return;
        job.transferred += bytes.length;
        this.progress(job);
      } else if (response.done) {
        if (
          job.transferred !== job.total ||
          ![0, 1].includes(response.done.fileNum ?? -1)
        )
          throw new Error();
        if (job.direction === 'upload') {
          if (job.phase !== 'verifying' || job.digestReceived)
            throw new Error();
          job.digestReceived = true;
          this.listing = job.path;
          await this.send({ fileAction: { readDir: { path: job.path } } });
        } else {
          if (!job.digestReceived) throw new Error();
          job.phase = 'verifying';
          this.progress(job);
          await this.consume(job, {
            type: 'download-done',
            id: job.id,
            sequence: ++this.sequence,
          });
          if (this.job === job) this.finish(job, 'done');
        }
      }
    } catch {
      if (!this.disposed && revision === this.revision) this.fail();
    }
  }
  private consume(
    job: Job,
    event: Extract<FileEvent, { type: 'chunk' | 'download-done' }>,
  ) {
    return new Promise<void>((resolve, reject) => {
      const fail = () => reject(new Error('File write failed'));
      this.pending = {
        id: job.id,
        sequence: event.sequence,
        resolve,
        reject: fail,
        timer: setTimeout(fail, FILE_LIMITS.timeout),
      };
      this.emit(event);
    });
  }
  private finish(job: Job, phase: FileProgress['phase']) {
    clearTimeout(job.timer);
    if (this.job !== job) return;
    job.phase = phase;
    this.progress(job);
    this.job = undefined;
    const revision = ++this.revision;
    void this.nextUpload().catch(() => {
      if (!this.disposed && revision === this.revision) this.fail();
    });
  }
  private fail() {
    this.cancel('error');
    this.emit({ type: 'error' });
  }
  cancel(phase: 'cancelled' | 'error' = 'cancelled') {
    ++this.revision;
    this.queue = [];
    const job = this.job;
    this.job = undefined;
    if (job) {
      clearTimeout(job.timer);
      job.phase = phase;
      this.progress(job);
      void this.send({ fileAction: { cancel: { id: job.id } } }).catch(
        () => {},
      );
    }
    if (this.pending) {
      const pending = this.pending;
      this.pending = undefined;
      clearTimeout(pending.timer);
      pending.reject();
    }
  }
  dispose() {
    this.disposed = true;
    this.cancel();
    this.listing = undefined;
  }
}
