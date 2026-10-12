export type AudioFailureReason =
  | 'invalid-format'
  | 'unavailable-api'
  | 'unsupported-config'
  | 'support-probe'
  | 'decoder-create'
  | 'decoder-configure'
  | 'invalid-packet'
  | 'decode-queue-limit'
  | 'chunk-create'
  | 'decode-submit'
  | 'decoder-error'
  | 'invalid-pcm'
  | 'pcm-copy'
  | 'pcm-output'
  | 'pcm-close';

const ERROR_NAMES = [
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
export type AudioErrorName = (typeof ERROR_NAMES)[number] | 'none' | 'unknown';

// 不传异常正文、stack 或任意自定义 name；它们可能含音频内容或其它敏感值。
export function audioErrorName(error?: unknown): AudioErrorName {
  if (error === undefined) return 'none';
  try {
    const name =
      typeof error === 'object' && error !== null && 'name' in error
        ? error.name
        : undefined;
    return ERROR_NAMES.find((allowed) => allowed === name) ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function bounded(value: number) {
  return Number.isFinite(value)
    ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, value))
    : 0;
}

export interface AudioDiagnostic {
  reason: AudioFailureReason;
  errorName: AudioErrorName;
  cleanupErrorName?: AudioErrorName;
  decoderEpoch: number;
  sampleRate: number;
  channels: number;
  receivedPackets: number;
  receivedDurationUs: number;
  lastPacketBytes: number;
  lastPacketDurationUs: number;
  submittedPackets: number;
  pendingPackets: number;
  maxPendingPackets: number;
  submittedPending: number;
  maxSubmittedPending: number;
  maxBufferedPackets: number;
  droppedPackets: number;
  droppedPacketDurationUs: number;
  decodeQueue: number;
  maxDecodeQueue: number;
  decodedPcm: number;
  decodedDurationUs: number;
  deliveredPcm: number;
  droppedPcm: number;
  lastPcmSamples: number;
  lastPcmSampleRate: number;
  lastPcmChannels: number;
  inFlight: number;
  maxInFlight: number;
  acknowledgements: number;
  maxAckDelayMs: number;
  oldestInFlightMs: number;
}
export type AudioMetrics = Omit<
  AudioDiagnostic,
  'reason' | 'errorName' | 'cleanupErrorName'
>;

// 只累积数值；交付时刻最多随4个PCM在途项保存，不保留包或采样内容。
export class AudioDiagnostics {
  private receivedPackets = 0;
  private receivedDurationUs = 0;
  private lastPacketBytes = 0;
  private lastPacketDurationUs = 0;
  private submittedPackets = 0;
  private pendingPackets = 0;
  private maxPendingPackets = 0;
  private submittedPending = 0;
  private maxSubmittedPending = 0;
  private maxBufferedPackets = 0;
  private droppedPackets = 0;
  private droppedPacketDurationUs = 0;
  private decodeQueue = 0;
  private maxDecodeQueue = 0;
  private decodedPcm = 0;
  private decodedDurationUs = 0;
  private deliveredPcm = 0;
  private droppedPcm = 0;
  private lastPcmSamples = 0;
  private lastPcmSampleRate = 0;
  private lastPcmChannels = 0;
  private maxInFlight = 0;
  private acknowledgements = 0;
  private maxAckDelayMs = 0;
  private pending: number[] = [];

  constructor(
    private decoderEpoch: number,
    private sampleRate: number,
    private channels: number,
    private now = () => performance.now(),
  ) {}

  get inFlight() {
    return this.pending.length;
  }
  queue(size: number) {
    this.decodeQueue = bounded(size);
    this.maxDecodeQueue = Math.max(this.maxDecodeQueue, this.decodeQueue);
  }
  packet(bytes: number) {
    this.receivedPackets = bounded(this.receivedPackets + 1);
    this.lastPacketBytes = bounded(bytes);
    this.lastPacketDurationUs = 0;
  }
  duration(durationUs: number) {
    this.lastPacketDurationUs = bounded(durationUs);
    this.receivedDurationUs = bounded(this.receivedDurationUs + durationUs);
  }
  submitted() {
    this.submittedPackets = bounded(this.submittedPackets + 1);
  }
  flow(pendingPackets: number, submittedPending: number) {
    this.pendingPackets = bounded(pendingPackets);
    this.submittedPending = bounded(submittedPending);
    this.maxPendingPackets = Math.max(
      this.maxPendingPackets,
      this.pendingPackets,
    );
    this.maxSubmittedPending = Math.max(
      this.maxSubmittedPending,
      this.submittedPending,
    );
    this.maxBufferedPackets = Math.max(
      this.maxBufferedPackets,
      bounded(pendingPackets + submittedPending),
    );
  }
  droppedPacket(durationUs: number) {
    this.droppedPackets = bounded(this.droppedPackets + 1);
    this.droppedPacketDurationUs = bounded(
      this.droppedPacketDurationUs + durationUs,
    );
  }
  pcm(samples: number, sampleRate: number, channels: number) {
    this.lastPcmSamples = bounded(samples);
    this.lastPcmSampleRate = bounded(sampleRate);
    this.lastPcmChannels = bounded(channels);
  }
  decoded() {
    this.decodedPcm = bounded(this.decodedPcm + 1);
    this.decodedDurationUs = bounded(
      this.decodedDurationUs +
        (this.lastPcmSamples * 1000000) / this.lastPcmSampleRate,
    );
  }
  dropped() {
    this.droppedPcm = bounded(this.droppedPcm + 1);
  }
  delivering() {
    this.pending.push(this.now());
    this.maxInFlight = Math.max(this.maxInFlight, this.inFlight);
  }
  delivered() {
    this.deliveredPcm = bounded(this.deliveredPcm + 1);
  }
  acknowledge() {
    const sentAt = this.pending.shift();
    if (sentAt === undefined) return;
    this.acknowledgements = bounded(this.acknowledgements + 1);
    this.maxAckDelayMs = Math.max(
      this.maxAckDelayMs,
      bounded(this.now() - sentAt),
    );
  }
  clear() {
    this.pending = [];
    this.pendingPackets = 0;
    this.submittedPending = 0;
  }
  failure(reason: AudioFailureReason, error?: unknown): AudioDiagnostic {
    return {
      ...this.snapshot(),
      reason,
      errorName: audioErrorName(error),
    };
  }
  snapshot(): AudioMetrics {
    return {
      decoderEpoch: bounded(this.decoderEpoch),
      sampleRate: bounded(this.sampleRate),
      channels: bounded(this.channels),
      receivedPackets: this.receivedPackets,
      receivedDurationUs: this.receivedDurationUs,
      lastPacketBytes: this.lastPacketBytes,
      lastPacketDurationUs: this.lastPacketDurationUs,
      submittedPackets: this.submittedPackets,
      pendingPackets: this.pendingPackets,
      maxPendingPackets: this.maxPendingPackets,
      submittedPending: this.submittedPending,
      maxSubmittedPending: this.maxSubmittedPending,
      maxBufferedPackets: this.maxBufferedPackets,
      droppedPackets: this.droppedPackets,
      droppedPacketDurationUs: this.droppedPacketDurationUs,
      decodeQueue: this.decodeQueue,
      maxDecodeQueue: this.maxDecodeQueue,
      decodedPcm: this.decodedPcm,
      decodedDurationUs: this.decodedDurationUs,
      deliveredPcm: this.deliveredPcm,
      droppedPcm: this.droppedPcm,
      lastPcmSamples: this.lastPcmSamples,
      lastPcmSampleRate: this.lastPcmSampleRate,
      lastPcmChannels: this.lastPcmChannels,
      inFlight: this.inFlight,
      maxInFlight: this.maxInFlight,
      acknowledgements: this.acknowledgements,
      maxAckDelayMs: this.maxAckDelayMs,
      oldestInFlightMs: this.pending.length
        ? bounded(this.now() - this.pending[0])
        : 0,
    };
  }
}
