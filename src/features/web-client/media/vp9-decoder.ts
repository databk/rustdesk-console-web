import { validFrameSize } from '../core/display';
import type { hbb } from '../protocol';

export const VIDEO_LIMITS = {
  batches: 8,
  framesPerBatch: 16,
  decodeQueue: 32,
  timeoutMs: 5000,
};
export const VP9_CONFIG: VideoDecoderConfig = {
  codec: 'vp09.00.10.08',
  optimizeForLatency: true,
};

export class Vp9Decoder {
  private decoder: VideoDecoder;
  private pending: {
    timestamp: number;
    timer: ReturnType<typeof setTimeout>;
  }[] = [];
  private disposed = false;
  private needKey = true;

  static async supported(): Promise<boolean> {
    if (typeof VideoDecoder === 'undefined') return false;
    try {
      return !!(await VideoDecoder.isConfigSupported(VP9_CONFIG)).supported;
    } catch {
      return false;
    }
  }

  constructor(
    private readonly onFrame: (frame: VideoFrame) => void,
    private readonly acknowledge: () => void,
    private readonly onError: () => void,
  ) {
    this.decoder = new VideoDecoder({
      output: (frame) => {
        if (this.disposed) {
          frame.close();
          return;
        }
        if (
          !validFrameSize(frame.codedWidth, frame.codedHeight) ||
          !validFrameSize(frame.displayWidth, frame.displayHeight)
        ) {
          frame.close();
          this.fail();
          return;
        }
        // Native encoder timestamps are milliseconds; WebCodecs uses microseconds.
        while (
          this.pending.length &&
          this.pending[0].timestamp <= frame.timestamp
        ) {
          clearTimeout(this.pending.shift()?.timer);
          this.acknowledge();
        }
        // Sending an ACK can synchronously close a failed session.
        if (this.disposed) frame.close();
        else this.onFrame(frame);
      },
      error: () => this.fail(),
    });
    this.decoder.configure(VP9_CONFIG);
  }

  decode(batch: hbb.IEncodedVideoFrames) {
    if (this.disposed) return;
    const frames = batch.frames;
    if (
      !frames?.length ||
      frames.length > VIDEO_LIMITS.framesPerBatch ||
      this.pending.length >= VIDEO_LIMITS.batches ||
      this.decoder.decodeQueueSize + frames.length > VIDEO_LIMITS.decodeQueue
    ) {
      this.fail();
      return;
    }
    const lastTimestamp = Number(frames[frames.length - 1].pts) * 1000;
    if (!Number.isSafeInteger(lastTimestamp) || lastTimestamp < 0) {
      this.fail();
      return;
    }
    this.pending.push({
      timestamp: lastTimestamp,
      timer: setTimeout(() => this.fail(), VIDEO_LIMITS.timeoutMs),
    });
    try {
      for (const frame of frames) {
        if (!frame.data?.length || (this.needKey && !frame.key))
          throw new Error();
        const timestamp = Number(frame.pts) * 1000;
        if (!Number.isSafeInteger(timestamp) || timestamp < 0)
          throw new Error();
        this.decoder.decode(
          new EncodedVideoChunk({
            type: frame.key ? 'key' : 'delta',
            timestamp,
            data: new Uint8Array(frame.data),
          }),
        );
        this.needKey = false;
      }
    } catch {
      this.fail();
    }
  }

  private fail() {
    if (!this.disposed) {
      this.dispose();
      this.onError();
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const batch of this.pending) clearTimeout(batch.timer);
    this.pending = [];
    if (this.decoder.state !== 'closed') this.decoder.close();
  }
}
