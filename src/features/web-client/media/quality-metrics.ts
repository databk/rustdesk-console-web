import type { VideoDiagnostics } from './video-diagnostics';

export interface QualityCounters extends Partial<VideoDiagnostics> {
  received?: number;
  decoded: number;
  videoBytes: number;
  delay?: number;
  displayGeneration: number;
}
export interface QualityReading extends Partial<VideoDiagnostics> {
  fps?: number;
  receivedFps?: number;
  decodedFps?: number;
  videoBitrate?: number;
  delay?: number;
}

// 单调时钟和累计计数只保留一个基线，不累积历史或帧内容。
export class QualitySampler {
  private previous?: {
    time: number;
    drawn: number;
    received?: number;
    decoded: number;
    bytes: number;
    display: number;
  };
  reset() {
    this.previous = undefined;
  }
  sample(
    time: number,
    drawn: number,
    counters: QualityCounters,
  ): QualityReading {
    const valid = [
      time,
      drawn,
      counters.videoBytes,
      counters.decoded,
      counters.displayGeneration,
    ].every((value) => Number.isFinite(value) && value >= 0);
    if (
      !valid ||
      (counters.received !== undefined &&
        (!Number.isSafeInteger(counters.received) || counters.received < 0))
    ) {
      this.reset();
      return {};
    }
    const delay =
      Number.isFinite(counters.delay) && (counters.delay ?? 0) > 0
        ? counters.delay
        : undefined;
    const previous = this.previous;
    const diagnostic: Partial<VideoDiagnostics> = {};
    for (const key of [
      'decodeQueue',
      'pendingBatches',
      'decodeLatencyMs',
      'ackLatencyMs',
      'presentationLatencyMs',
      'droppedPresentation',
      'recoveryCount',
    ] as (keyof VideoDiagnostics)[]) {
      const value = counters[key];
      if (value !== undefined && Number.isFinite(value) && value >= 0)
        diagnostic[key] = value;
    }
    this.previous = {
      time,
      drawn,
      received: counters.received,
      decoded: counters.decoded,
      bytes: counters.videoBytes,
      display: counters.displayGeneration,
    };
    if (
      !previous ||
      previous.display !== counters.displayGeneration ||
      time <= previous.time ||
      drawn < previous.drawn ||
      counters.videoBytes < previous.bytes ||
      counters.decoded < previous.decoded ||
      (counters.received !== undefined &&
        previous.received !== undefined &&
        counters.received < previous.received)
    )
      return { delay, ...diagnostic };
    const seconds = (time - previous.time) / 1000;
    return {
      fps: (drawn - previous.drawn) / seconds,
      decodedFps: (counters.decoded - previous.decoded) / seconds,
      ...(counters.received !== undefined && previous.received !== undefined
        ? { receivedFps: (counters.received - previous.received) / seconds }
        : {}),
      videoBitrate: ((counters.videoBytes - previous.bytes) * 8) / seconds,
      delay,
      ...diagnostic,
    };
  }
}
