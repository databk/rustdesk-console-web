import type { DownloadSink, WritableFile } from '../files/download';
import { RECORD_LIMITS } from './recorder';
import { durationBytes, durationOffset } from './webm';
export interface RecordingSink extends DownloadSink {
  duration(value: number): void;
}
interface RecordingWriter extends WritableFile {
  seek?(offset: number): Promise<void>;
}

export async function chooseRecording(): Promise<{
  sink: RecordingSink;
  maxBytes: number;
  streaming: boolean;
}> {
  const name = `rustdesk-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
  const picker = window as unknown as {
    showSaveFilePicker?: (o: {
      suggestedName: string;
    }) => Promise<{ createWritable(): Promise<RecordingWriter> }>;
  };
  const writer = picker.showSaveFilePicker
    ? await (
        await picker.showSaveFilePicker({ suggestedName: name })
      ).createWritable()
    : undefined;
  return {
    sink: recordingSink(name, writer),
    maxBytes: writer ? Number.MAX_SAFE_INTEGER : RECORD_LIMITS.fallback,
    streaming: !!writer,
  };
}
export function recordingSink(
  name: string,
  writer?: RecordingWriter,
): RecordingSink {
  let chunks: Uint8Array[] = [],
    total = 0,
    ended = false;
  let finalized = false;
  let offset = -1,
    duration = 0;
  return {
    duration(value) {
      duration = value;
    },
    async write(bytes) {
      if (
        ended ||
        bytes.length > RECORD_LIMITS.block ||
        (!writer && total + bytes.length > RECORD_LIMITS.fallback)
      )
        throw new Error('Recording limit');
      if (total === 0) offset = durationOffset(bytes);
      if (writer) await writer.write(new Uint8Array(bytes));
      else chunks.push(new Uint8Array(bytes));
      total += bytes.length;
    },
    async close() {
      if (ended) return;
      ended = true;
      if (!total) {
        chunks = [];
        await writer?.abort();
        finalized = true;
        return;
      }
      if (writer) {
        if (!writer.seek || offset < 0) {
          await writer.abort();
          throw new Error('Recording seek unavailable');
        }
        try {
          await writer.seek(offset);
          if (finalized) throw new Error('Recording cancelled');
          await writer.write(durationBytes(duration));
          if (finalized) throw new Error('Recording cancelled');
          await writer.seek(total);
          if (finalized) throw new Error('Recording cancelled');
          await writer.close();
          finalized = true;
        } catch (error) {
          if (!finalized) await writer.abort().catch(() => {});
          finalized = true;
          throw error;
        }
      } else {
        chunks[0]?.set(durationBytes(duration), offset);
        const url = URL.createObjectURL(
          new Blob(
            chunks.map((b) => new Uint8Array(b)),
            { type: 'video/webm' },
          ),
        );
        chunks = [];
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = name;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        finalized = true;
      }
    },
    async abort() {
      if (finalized) return;
      ended = true;
      finalized = true;
      chunks = [];
      await writer?.abort();
    },
  };
}
