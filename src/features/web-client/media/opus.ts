import type { hbb } from '../protocol';
import {
  AudioDiagnostics,
  audioErrorName,
  type AudioDiagnostic,
  type AudioFailureReason,
} from './audio-diagnostics';

export interface PcmFrame {
  sampleRate: number;
  planes: Float32Array[];
}
interface NativeAudioData {
  numberOfChannels: number;
  numberOfFrames: number;
  sampleRate: number;
  copyTo(
    destination: Float32Array,
    options: { planeIndex: number; format: 'f32-planar' },
  ): void;
  close(): void;
}
interface Decoder {
  state: string;
  decodeQueueSize: number;
  configure(config: AudioConfig): void;
  decode(chunk: unknown): void;
  close(): void;
}
interface AudioConfig {
  codec: 'opus';
  sampleRate: number;
  numberOfChannels: number;
}
interface PendingPacket {
  timestamp: number;
  duration: number;
  receivedAt: number;
  data: Uint8Array;
}
interface AudioCodecs {
  AudioDecoder?: {
    new (init: {
      output: (data: NativeAudioData) => void;
      error: (error: unknown) => void;
    }): Decoder;
    isConfigSupported(config: AudioConfig): Promise<{ supported?: boolean }>;
  };
  EncodedAudioChunk?: new (init: {
    type: 'key';
    timestamp: number;
    duration: number;
    data: Uint8Array;
  }) => unknown;
}
const codecs = () => globalThis as unknown as AudioCodecs;
export const AUDIO_LIMITS = {
  packet: 64 * 1024,
  queue: 16,
  inFlight: 4,
  bufferedSeconds: 0.3,
};

// 原生 AudioFrame 是一个原始 Opus packet，没有 PTS 或 Ogg 封装。
// 按 RFC 6716 的 TOC 累计微秒，不能用到达时间或固定 20ms 代替包时长。
export function opusDuration(data: Uint8Array): number {
  if (!data.length || data.length > AUDIO_LIMITS.packet)
    throw new Error('Invalid Opus packet');
  const toc = data[0];
  const count = (toc & 3) === 0 ? 1 : (toc & 3) === 3 ? (data[1] ?? 0) & 63 : 2;
  const config = (toc >> 3) & 3;
  const samples =
    toc & 128
      ? 120 << config
      : (toc & 96) === 96
        ? toc & 8
          ? 960
          : 480
        : [480, 960, 1920, 2880][config];
  if (!count || count * samples > 5760)
    throw new Error('Invalid Opus duration');
  return (count * samples * 1000000) / 48000;
}

export class OpusDecoder {
  private decoder?: Decoder;
  private timestamp = 0;
  private epoch = 0;
  private diagnostics = new AudioDiagnostics(0, 0, 0);
  private pending: PendingPacket[] = [];
  private submittedPending = 0;
  private pumpTimer?: ReturnType<typeof setTimeout>;
  constructor(
    private output: (frame: PcmFrame) => void,
    private error: (diagnostic: AudioDiagnostic) => void,
  ) {}
  static async supported() {
    try {
      return !!(
        await codecs().AudioDecoder?.isConfigSupported({
          codec: 'opus',
          sampleRate: 48000,
          numberOfChannels: 2,
        })
      )?.supported;
    } catch {
      return false;
    }
  }
  async configure(format: hbb.IAudioFormat) {
    this.dispose();
    const epoch = this.epoch;
    const sampleRate = format.sampleRate ?? 0;
    const numberOfChannels = format.channels ?? 0;
    const api = codecs();
    const config: AudioConfig = { codec: 'opus', sampleRate, numberOfChannels };
    this.diagnostics = new AudioDiagnostics(
      epoch,
      sampleRate,
      numberOfChannels,
    );
    let stage: AudioFailureReason = 'support-probe';
    try {
      if (
        ![8000, 12000, 16000, 24000, 48000].includes(sampleRate) ||
        ![1, 2].includes(numberOfChannels)
      ) {
        this.fail('invalid-format');
        return;
      }
      if (!api.AudioDecoder || !api.EncodedAudioChunk) {
        this.fail('unavailable-api');
        return;
      }
      const supported = (await api.AudioDecoder.isConfigSupported(config))
        .supported;
      if (epoch !== this.epoch) return;
      if (!supported) {
        this.fail('unsupported-config');
        return;
      }
      stage = 'decoder-create';
      this.decoder = new api.AudioDecoder({
        output: (data) => {
          let outputStage: AudioFailureReason = 'invalid-pcm';
          try {
            if (epoch !== this.epoch) return;
            this.submittedPending = Math.max(0, this.submittedPending - 1);
            this.observeQueue();
            this.diagnostics.pcm(
              data.numberOfFrames,
              data.sampleRate,
              data.numberOfChannels,
            );
            if (
              data.numberOfChannels !== numberOfChannels ||
              data.numberOfFrames <= 0 ||
              data.numberOfFrames > 5760 ||
              data.numberOfFrames > data.sampleRate * 0.12 ||
              ![8000, 12000, 16000, 24000, 48000].includes(data.sampleRate)
            )
              throw new Error();
            this.diagnostics.decoded();
            if (this.diagnostics.inFlight >= AUDIO_LIMITS.inFlight) {
              this.diagnostics.dropped();
              return;
            }
            outputStage = 'pcm-copy';
            const planes = Array.from(
              { length: data.numberOfChannels },
              (_, planeIndex) => {
                const plane = new Float32Array(data.numberOfFrames);
                data.copyTo(plane, { planeIndex, format: 'f32-planar' });
                return plane;
              },
            );
            this.diagnostics.delivering();
            outputStage = 'pcm-output';
            this.output({ planes, sampleRate: data.sampleRate });
            if (epoch === this.epoch) this.diagnostics.delivered();
          } catch (error) {
            if (epoch === this.epoch) this.fail(outputStage, error);
          } finally {
            try {
              data.close();
            } catch (error) {
              if (epoch === this.epoch) this.fail('pcm-close', error);
            }
            if (epoch === this.epoch) this.schedule();
          }
        },
        error: (error) => {
          if (epoch === this.epoch) this.fail('decoder-error', error);
        },
      });
      stage = 'decoder-configure';
      this.decoder.configure(config);
      this.observeQueue();
    } catch (error) {
      if (epoch === this.epoch) this.fail(stage, error);
    }
  }
  decode(data: Uint8Array) {
    if (!this.decoder) return;
    this.diagnostics.packet(data.length);
    try {
      const duration = opusDuration(data);
      this.diagnostics.duration(duration);
      const timestamp = this.timestamp;
      this.timestamp += duration;
      if (this.pending.length + this.submittedPending >= AUDIO_LIMITS.queue) {
        const dropped = this.pending.shift();
        if (!dropped) {
          this.diagnostics.droppedPacket(duration);
          this.observeQueue();
          return;
        }
        this.diagnostics.droppedPacket(dropped.duration);
      }
      // 独立复制，避免小包引用整个共享传输缓冲。FIFO与未输出提交合计最多16包。
      this.pending.push({
        timestamp,
        duration,
        receivedAt: performance.now(),
        data: data.slice(),
      });
      this.observeQueue();
      this.schedule();
    } catch (error) {
      this.fail('invalid-packet', error);
    }
  }
  acknowledge() {
    this.diagnostics.acknowledge();
    this.schedule();
  }
  metrics() {
    this.observeQueue();
    return this.diagnostics.snapshot();
  }
  private schedule() {
    if (
      !this.decoder ||
      this.pumpTimer !== undefined ||
      !this.pending.length ||
      this.submittedPending + this.diagnostics.inFlight >= AUDIO_LIMITS.inFlight
    )
      return;
    const epoch = this.epoch;
    // 让WebCodecs输出与页面ACK任务得到执行机会，不在共享收包microtask环内批量解码。
    this.pumpTimer = setTimeout(() => {
      if (epoch !== this.epoch) return;
      this.pumpTimer = undefined;
      this.pump(epoch);
    }, 0);
  }
  private pump(epoch: number) {
    const decoder = this.decoder;
    if (!decoder || epoch !== this.epoch) return;
    let stage: AudioFailureReason = 'chunk-create';
    let submitted = 0;
    try {
      while (
        this.pending.length &&
        submitted < AUDIO_LIMITS.inFlight &&
        this.submittedPending + this.diagnostics.inFlight <
          AUDIO_LIMITS.inFlight &&
        decoder.decodeQueueSize < AUDIO_LIMITS.queue
      ) {
        const packet = this.pending.shift();
        if (!packet) break;
        if (
          performance.now() - packet.receivedAt >
          AUDIO_LIMITS.bufferedSeconds * 1000
        ) {
          this.diagnostics.droppedPacket(packet.duration);
          continue;
        }
        stage = 'chunk-create';
        const Chunk = codecs().EncodedAudioChunk;
        if (!Chunk) throw new Error();
        const chunk = new Chunk({
          type: 'key',
          timestamp: packet.timestamp,
          duration: packet.duration,
          data: packet.data,
        });
        ++this.submittedPending;
        this.observeQueue();
        stage = 'decode-submit';
        decoder.decode(chunk);
        if (epoch !== this.epoch) return;
        ++submitted;
        this.diagnostics.submitted();
        this.observeQueue();
      }
      this.observeQueue();
      // 没有credit时不轮询；output或真实页面ACK会继续调度。
      if (submitted && decoder.decodeQueueSize < AUDIO_LIMITS.queue)
        this.schedule();
    } catch (error) {
      if (epoch === this.epoch) this.fail(stage, error);
    }
  }
  private observeQueue() {
    this.diagnostics.queue(this.decoder?.decodeQueueSize ?? 0);
    this.diagnostics.flow(this.pending.length, this.submittedPending);
  }
  private fail(reason: AudioFailureReason, error?: unknown) {
    this.observeQueue();
    const diagnostic = this.diagnostics.failure(reason, error);
    const cleanupErrorName = this.closeDecoder();
    if (cleanupErrorName) diagnostic.cleanupErrorName = cleanupErrorName;
    this.error(diagnostic);
  }
  dispose() {
    this.closeDecoder();
  }
  private closeDecoder() {
    ++this.epoch;
    clearTimeout(this.pumpTimer);
    this.pumpTimer = undefined;
    this.pending = [];
    this.submittedPending = 0;
    const decoder = this.decoder;
    this.decoder = undefined;
    this.timestamp = 0;
    // fail已复制旧快照；idle指标必须归属当前epoch，不能带进新的audioGeneration。
    this.diagnostics = new AudioDiagnostics(this.epoch, 0, 0);
    try {
      if (decoder?.state !== 'closed') decoder?.close();
    } catch (error) {
      return audioErrorName(error);
    }
    return undefined;
  }
}
