import { validFrameSize } from '../core/display';
import type { hbb } from '../protocol';
import { LatencyWindow } from './video-diagnostics';

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

export type VideoFailureReason =
  | 'invalid-batch'
  | 'invalid-timestamp'
  | 'invalid-data'
  | 'missing-key'
  | 'pending-batch-limit'
  | 'decode-queue-limit'
  | 'submitted-frame-limit'
  | 'chunk-create'
  | 'decode-submit'
  | 'decoder-error'
  | 'invalid-size'
  | 'batch-timeout'
  | 'decoder-initialize'
  | 'unsupported-format';
const VIDEO_ERROR_NAMES = [
  'Error',
  'TypeError',
  'RangeError',
  'NotSupportedError',
  'InvalidStateError',
  'EncodingError',
  'DataError',
  'OperationError',
  'AbortError',
] as const;
export interface VideoDiagnostic {
  reason: VideoFailureReason;
  errorName: (typeof VIDEO_ERROR_NAMES)[number] | 'none' | 'unknown';
  decodeQueue: number;
  pendingBatches: number;
  submittedFrames: number;
  batchFrames: number;
  receivedBatches: number;
  submittedTotal: number;
  outputFrames: number;
  matchedOutputs: number;
  lastBatchTimestampUs: number;
  lastOutputTimestampUs: number;
  oldestPendingMs: number;
  oldestSubmittedMs: number;
  lastOutputAgeMs: number;
}
function bounded(value: number) {
  return Number.isFinite(value)
    ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, value))
    : 0;
}
// 失败事件只携带固定原因/异常类别及有限数值，不携带载荷、异常正文或stack。
export function videoFailureDiagnostic(
  reason: VideoFailureReason,
  error?: unknown,
  values: Partial<Omit<VideoDiagnostic, 'reason' | 'errorName'>> = {},
): VideoDiagnostic {
  let errorName: VideoDiagnostic['errorName'] =
    error === undefined ? 'none' : 'unknown';
  try {
    if (typeof error === 'object' && error !== null && 'name' in error)
      errorName =
        VIDEO_ERROR_NAMES.find((name) => name === error.name) ?? 'unknown';
  } catch {
    /* 不读取异常正文或自定义name。 */
  }
  return {
    reason,
    errorName,
    decodeQueue: bounded(values.decodeQueue ?? 0),
    pendingBatches: bounded(values.pendingBatches ?? 0),
    submittedFrames: bounded(values.submittedFrames ?? 0),
    batchFrames: bounded(values.batchFrames ?? 0),
    receivedBatches: bounded(values.receivedBatches ?? 0),
    submittedTotal: bounded(values.submittedTotal ?? 0),
    outputFrames: bounded(values.outputFrames ?? 0),
    matchedOutputs: bounded(values.matchedOutputs ?? 0),
    lastBatchTimestampUs: bounded(values.lastBatchTimestampUs ?? 0),
    lastOutputTimestampUs: bounded(values.lastOutputTimestampUs ?? 0),
    oldestPendingMs: bounded(values.oldestPendingMs ?? 0),
    oldestSubmittedMs: bounded(values.oldestSubmittedMs ?? 0),
    lastOutputAgeMs: bounded(values.lastOutputAgeMs ?? 0),
  };
}

export class Vp9Decoder {
  private decoder: VideoDecoder;
  private pending: {
    timestamp: number;
    started: number;
    timer: ReturnType<typeof setTimeout>;
  }[] = [];
  private submitted: { timestamp: number; started: number }[] = [];
  private decodeLatency = new LatencyWindow();
  private ackLatency = new LatencyWindow();
  private disposed = false;
  private needKey = true;
  private batchFrames = 0;
  private receivedBatches = 0;
  private submittedTotal = 0;
  private outputFrames = 0;
  private matchedOutputs = 0;
  private lastBatchTimestampUs = 0;
  private lastOutputTimestampUs = 0;
  private lastOutputAt: number | undefined;

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
    private readonly onError: (diagnostic: VideoDiagnostic) => void,
    config: VideoDecoderConfig = VP9_CONFIG,
    private readonly onSaturation?: (diagnostic: VideoDiagnostic) => void,
  ) {
    this.decoder = new VideoDecoder({
      output: (frame) => {
        if (this.disposed) {
          frame.close();
          return;
        }
        const now = performance.now();
        this.outputFrames = bounded(this.outputFrames + 1);
        this.lastOutputTimestampUs = bounded(frame.timestamp);
        this.lastOutputAt = now;
        if (
          !validFrameSize(frame.codedWidth, frame.codedHeight) ||
          !validFrameSize(frame.displayWidth, frame.displayHeight)
        ) {
          frame.close();
          this.fail('invalid-size');
          return;
        }
        const index = this.submitted.findIndex(
          (item) => item.timestamp === frame.timestamp,
        );
        if (index >= 0) {
          this.matchedOutputs = bounded(this.matchedOutputs + 1);
          this.decodeLatency.add(now - this.submitted[index].started);
          this.submitted.splice(0, index + 1);
        }
        // Native encoder timestamps are milliseconds; WebCodecs uses microseconds.
        while (
          this.pending.length &&
          this.pending[0].timestamp <= frame.timestamp
        ) {
          const batch = this.pending.shift();
          clearTimeout(batch?.timer);
          if (batch) this.ackLatency.add(now - batch.started);
          this.acknowledge();
        }
        // Sending an ACK can synchronously close a failed session.
        if (this.disposed) frame.close();
        else this.onFrame(frame);
      },
      error: (error) => this.fail('decoder-error', 0, error),
    });
    try {
      this.decoder.configure(config);
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  decode(batch: hbb.IEncodedVideoFrames): boolean {
    if (this.disposed) return false;
    const frames = batch.frames;
    this.receivedBatches = bounded(this.receivedBatches + 1);
    this.batchFrames = bounded(frames?.length ?? 0);
    this.lastBatchTimestampUs = frames?.length
      ? bounded(Number(frames[frames.length - 1].pts) * 1000)
      : 0;
    if (!frames?.length || frames.length > VIDEO_LIMITS.framesPerBatch) {
      this.fail('invalid-batch', 1);
      return false;
    }
    const lastTimestamp = Number(frames[frames.length - 1].pts) * 1000;
    if (!Number.isSafeInteger(lastTimestamp) || lastTimestamp < 0) {
      this.fail('invalid-timestamp', 1);
      return false;
    }
    // 先校验整个batch，避免提交半批后才发现无效时间戳/负载。
    for (const frame of frames) {
      const timestamp = Number(frame.pts) * 1000;
      if (!frame.data?.length) {
        this.fail('invalid-data', 1);
        return false;
      }
      if (!Number.isSafeInteger(timestamp) || timestamp < 0) {
        this.fail('invalid-timestamp', 1);
        return false;
      }
    }
    const saturation =
      this.pending.length >= VIDEO_LIMITS.batches
        ? 'pending-batch-limit'
        : this.decoder.decodeQueueSize + frames.length >
            VIDEO_LIMITS.decodeQueue
          ? 'decode-queue-limit'
          : this.submitted.length + frames.length > VIDEO_LIMITS.decodeQueue
            ? 'submitted-frame-limit'
            : undefined;
    if (saturation) {
      if (!this.onSaturation) this.fail(saturation, 1);
      else {
        const diagnostic = this.diagnostic(saturation);
        // 饱和后废弃整条依赖链，关闭解码器；调用者必须刷新并等待新关键帧。
        this.discard(1);
        this.onSaturation(diagnostic);
      }
      return false;
    }
    const started = performance.now();
    this.pending.push({
      timestamp: lastTimestamp,
      started,
      timer: setTimeout(
        () => this.fail('batch-timeout'),
        VIDEO_LIMITS.timeoutMs,
      ),
    });
    let failureReason: VideoFailureReason = 'decode-submit';
    try {
      for (const frame of frames) {
        if (!frame.data?.length) {
          failureReason = 'invalid-data';
          throw new Error();
        }
        if (this.needKey && !frame.key) {
          failureReason = 'missing-key';
          throw new Error();
        }
        const timestamp = Number(frame.pts) * 1000;
        if (!Number.isSafeInteger(timestamp) || timestamp < 0) {
          failureReason = 'invalid-timestamp';
          throw new Error();
        }
        this.submitted.push({ timestamp, started: performance.now() });
        failureReason = 'chunk-create';
        const chunk = new EncodedVideoChunk({
          type: frame.key ? 'key' : 'delta',
          timestamp,
          data: new Uint8Array(frame.data),
        });
        failureReason = 'decode-submit';
        this.decoder.decode(chunk);
        this.submittedTotal = bounded(this.submittedTotal + 1);
        this.needKey = false;
      }
    } catch (error) {
      this.fail(failureReason, 0, error);
      return false;
    }
    return !this.disposed;
  }

  metrics() {
    return {
      decodeQueue: this.disposed ? 0 : this.decoder.decodeQueueSize,
      pendingBatches: this.pending.length,
      decodeLatencyMs: this.decodeLatency.value(),
      ackLatencyMs: this.ackLatency.value(),
    };
  }

  private discard(additional: number) {
    const batches = this.pending.length + additional;
    this.dispose();
    // 确认已废弃的完整batch，释放原生等待；不冒充解码成功或采样ACK耗时。
    for (let i = 0; i < batches; ++i) this.acknowledge();
  }

  private diagnostic(
    reason: VideoFailureReason,
    error?: unknown,
  ): VideoDiagnostic {
    const now = performance.now();
    return videoFailureDiagnostic(reason, error, {
      decodeQueue: this.decoder.decodeQueueSize,
      pendingBatches: this.pending.length,
      submittedFrames: this.submitted.length,
      batchFrames: this.batchFrames,
      receivedBatches: this.receivedBatches,
      submittedTotal: this.submittedTotal,
      outputFrames: this.outputFrames,
      matchedOutputs: this.matchedOutputs,
      lastBatchTimestampUs: this.lastBatchTimestampUs,
      lastOutputTimestampUs: this.lastOutputTimestampUs,
      oldestPendingMs: this.pending.length ? now - this.pending[0].started : 0,
      oldestSubmittedMs: this.submitted.length
        ? now - this.submitted[0].started
        : 0,
      lastOutputAgeMs:
        this.lastOutputAt === undefined ? 0 : now - this.lastOutputAt,
    });
  }

  private fail(reason: VideoFailureReason, additional = 0, error?: unknown) {
    if (!this.disposed) {
      const diagnostic = this.diagnostic(reason, error);
      this.discard(additional);
      this.onError(diagnostic);
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const batch of this.pending) clearTimeout(batch.timer);
    this.pending = [];
    this.submitted = [];
    if (this.decoder.state !== 'closed') this.decoder.close();
  }
}
