import type { hbb } from '../protocol';

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
interface AudioCodecs {
  AudioDecoder?: {
    new (init: {
      output: (data: NativeAudioData) => void;
      error: () => void;
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
  private inFlight = 0;
  constructor(
    private output: (frame: PcmFrame) => void,
    private error: () => void,
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
    try {
      if (
        ![8000, 12000, 16000, 24000, 48000].includes(sampleRate) ||
        ![1, 2].includes(numberOfChannels) ||
        !api.AudioDecoder ||
        !api.EncodedAudioChunk ||
        !(await api.AudioDecoder.isConfigSupported(config)).supported
      )
        throw new Error();
      if (epoch !== this.epoch) return;
      this.decoder = new api.AudioDecoder({
        output: (data) => {
          try {
            if (epoch !== this.epoch) return;
            if (
              data.numberOfChannels !== numberOfChannels ||
              data.numberOfFrames <= 0 ||
              data.numberOfFrames > 5760 ||
              data.numberOfFrames > data.sampleRate * 0.12 ||
              ![8000, 12000, 16000, 24000, 48000].includes(data.sampleRate)
            )
              throw new Error();
            if (this.inFlight >= AUDIO_LIMITS.inFlight) return;
            const planes = Array.from(
              { length: data.numberOfChannels },
              (_, planeIndex) => {
                const plane = new Float32Array(data.numberOfFrames);
                data.copyTo(plane, { planeIndex, format: 'f32-planar' });
                return plane;
              },
            );
            ++this.inFlight;
            this.output({ planes, sampleRate: data.sampleRate });
          } catch {
            this.fail();
          } finally {
            data.close();
          }
        },
        error: () => {
          if (epoch === this.epoch) this.fail();
        },
      });
      this.decoder.configure(config);
    } catch {
      if (epoch === this.epoch) this.fail();
    }
  }
  decode(data: Uint8Array) {
    if (!this.decoder) return;
    try {
      const duration = opusDuration(data);
      if (this.decoder.decodeQueueSize >= AUDIO_LIMITS.queue) throw new Error();
      const Chunk = codecs().EncodedAudioChunk;
      if (!Chunk) throw new Error();
      this.decoder.decode(
        new Chunk({ type: 'key', timestamp: this.timestamp, duration, data }),
      );
      this.timestamp += duration;
    } catch {
      this.fail();
    }
  }
  acknowledge() {
    this.inFlight = Math.max(0, this.inFlight - 1);
  }
  private fail() {
    this.dispose();
    this.error();
  }
  dispose() {
    ++this.epoch;
    if (this.decoder?.state !== 'closed') this.decoder?.close();
    this.decoder = undefined;
    this.timestamp = 0;
    this.inFlight = 0;
  }
}
