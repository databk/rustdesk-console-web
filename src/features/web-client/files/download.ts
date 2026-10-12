import { FILE_LIMITS, safeName } from './transfer';

export interface DownloadSink {
  write(bytes: Uint8Array): Promise<void>;
  close(): Promise<void>;
  abort(): Promise<void>;
}
export interface WritableFile {
  write(bytes: Uint8Array): Promise<void>;
  close(): Promise<void>;
  abort(): Promise<void>;
}
interface Picker {
  showSaveFilePicker?: (options: {
    suggestedName: string;
  }) => Promise<{ createWritable(): Promise<WritableFile> }>;
}

export async function chooseDownload(
  name: string,
  size: number,
): Promise<DownloadSink> {
  safeName(name);
  if (!Number.isSafeInteger(size) || size < 0) throw new Error('Invalid size');
  const picker = window as unknown as Picker;
  let writer: WritableFile | undefined;
  if (picker.showSaveFilePicker)
    writer = await (
      await picker.showSaveFilePicker({ suggestedName: name })
    ).createWritable();
  else if (size > FILE_LIMITS.fallback)
    throw new Error('Streaming download unavailable');
  return createDownloadSink(name, size, writer);
}

export function createDownloadSink(
  name: string,
  size: number,
  writer?: WritableFile,
): DownloadSink {
  safeName(name);
  if (
    !Number.isSafeInteger(size) ||
    size < 0 ||
    (!writer && size > FILE_LIMITS.fallback)
  )
    throw new Error('Invalid download size');
  let chunks: Uint8Array[] = [];
  let written = 0;
  let ended = false;
  return {
    async write(bytes) {
      if (
        ended ||
        bytes.length > FILE_LIMITS.block ||
        written + bytes.length > size
      )
        throw new Error('Invalid download block');
      if (writer) await writer.write(new Uint8Array(bytes));
      else chunks.push(new Uint8Array(bytes));
      written += bytes.length;
    },
    async close() {
      if (ended || written !== size) throw new Error('Incomplete download');
      if (writer) await writer.close();
      else {
        const url = URL.createObjectURL(
          new Blob(chunks.map((bytes) => new Uint8Array(bytes))),
        );
        chunks = [];
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = name;
        anchor.click();
        // 浏览器下载导航接管后释放 URL，回退最多保留 16MiB。
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      ended = true;
    },
    async abort() {
      if (ended) return;
      ended = true;
      chunks = [];
      if (writer) await writer.abort();
    },
  };
}
