import type { VideoFormat } from './video-codecs';
import { av1CodecPrivate, av1RandomAccess } from './av1-format';
import { webmFrame, webmHeader } from './webm';

export const RECORD_LIMITS = {
  buffered: 2 * 1024 * 1024,
  block: 256 * 1024,
  timeoutMs: 5000,
  fallback: 16 * 1024 * 1024,
};
export type RecordingReason =
  | 'user'
  | 'changed'
  | 'limit'
  | 'failed'
  | 'denied'
  | 'disconnected';
export class StreamRecorder {
  private queue: Uint8Array[] = [];
  private buffered = 0;
  private pending?: {
    sequence: number;
    bytes: number;
    timer: ReturnType<typeof setTimeout>;
  };
  private sequence = 0;
  private format?: string;
  private chroma?: VideoFormat['chroma'];
  private first?: number;
  private last = -1;
  private stopping?: RecordingReason;
  private ended = false;
  private written = 0;
  private delta = 33;
  constructor(
    private emit: (sequence: number, bytes: Uint8Array) => void,
    private done: (reason: RecordingReason, duration: number) => void,
    private maxBytes = Number.MAX_SAFE_INTEGER,
  ) {}
  frame(
    format: VideoFormat,
    width: number,
    height: number,
    bytes: Uint8Array,
    pts: number,
    key: boolean,
  ) {
    if (this.ended || this.stopping) return;
    if (!Number.isSafeInteger(pts) || pts < 0) {
      this.stop('changed');
      return;
    }
    const signature = `${format.codec}/${format.profile}/${format.codecString ?? ''}/${width}/${height}`;
    if (
      this.format &&
      (signature !== this.format ||
        (this.chroma && format.chroma && this.chroma !== format.chroma) ||
        pts < this.last)
    ) {
      this.stop('changed');
      return;
    }
    if (!this.format && !key) return;
    if (format.codec === 'av1') {
      if (!av1CodecPrivate(format)) {
        this.stop('failed');
        return;
      }
      const access = key ? av1RandomAccess(bytes) : undefined;
      if (!this.format && !access) return;
      if (access && access.codecString !== format.codecString) {
        this.stop('changed');
        return;
      }
      key = !!access;
    }
    try {
      const encoded = webmFrame(bytes, pts - (this.first ?? pts), key);
      if (!this.format) {
        this.format = signature;
        this.first = pts;
        if (
          !this.enqueue(
            webmHeader(
              format.codec,
              width,
              height,
              format.codec === 'av1' ? av1CodecPrivate(format) : undefined,
            ),
          )
        )
          return;
      }
      // 只有实际入队的视频帧才计入时长，不能把仅写入文件头视作有效录制。
      if (!this.enqueue(encoded)) return;
      if (this.last >= 0 && pts > this.last)
        this.delta = Math.min(1000, pts - this.last);
      this.last = pts;
      this.chroma = format.chroma ?? this.chroma;
    } catch {
      this.stop('failed');
    }
  }
  private enqueue(bytes: Uint8Array) {
    if (this.stopping || this.ended) return false;
    if (this.written + this.buffered + bytes.length > this.maxBytes) {
      this.stop('limit');
      return false;
    }
    if (this.buffered + bytes.length > RECORD_LIMITS.buffered) {
      this.stop('failed');
      return false;
    }
    for (let offset = 0; offset < bytes.length; offset += RECORD_LIMITS.block)
      this.queue.push(bytes.slice(offset, offset + RECORD_LIMITS.block));
    this.buffered += bytes.length;
    this.pump();
    return true;
  }
  private pump() {
    if (this.ended || this.pending) return;
    const bytes = this.queue.shift();
    if (!bytes) {
      if (this.stopping) this.finish(this.stopping);
      return;
    }
    const sequence = ++this.sequence;
    this.pending = {
      sequence,
      bytes: bytes.length,
      timer: setTimeout(() => this.fail(), RECORD_LIMITS.timeoutMs),
    };
    this.emit(sequence, bytes);
  }
  consumed(sequence: number, ok: boolean) {
    if (!this.pending || sequence !== this.pending.sequence || this.ended)
      return;
    clearTimeout(this.pending.timer);
    this.buffered -= this.pending.bytes;
    this.written += this.pending.bytes;
    this.pending = undefined;
    if (!ok) {
      this.fail();
      return;
    }
    this.pump();
  }
  stop(reason: RecordingReason) {
    if (!this.ended && !this.stopping) {
      this.stopping = reason;
      this.pump();
    }
  }
  fail() {
    this.queue = [];
    this.buffered = 0;
    this.finish('failed');
  }
  dispose() {
    this.queue = [];
    this.buffered = 0;
    this.finish('failed');
  }
  private finish(reason: RecordingReason) {
    if (this.ended) return;
    this.ended = true;
    clearTimeout(this.pending?.timer);
    this.pending = undefined;
    this.done(
      reason,
      this.first === undefined || this.last < 0
        ? 0
        : Math.max(0, this.last - this.first + this.delta),
    );
  }
}
