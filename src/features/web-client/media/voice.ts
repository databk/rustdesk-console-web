interface EncodedAudio {
  byteLength: number;
  copyTo(destination: Uint8Array): void;
}
interface Encoder {
  state: string;
  encodeQueueSize: number;
  configure(config: object): void;
  encode(data: { close(): void }): void;
  close(): void;
}
interface VoiceCodecs {
  AudioEncoder?: {
    new (callbacks: {
      output(chunk: EncodedAudio): void;
      error(): void;
    }): Encoder;
    isConfigSupported(config: object): Promise<{ supported?: boolean }>;
  };
  AudioData?: new (config: {
    format: 'f32';
    sampleRate: number;
    numberOfFrames: number;
    numberOfChannels: number;
    timestamp: number;
    data: Float32Array;
  }) => { close(): void };
}
export const VOICE_CONFIG = {
  codec: 'opus',
  sampleRate: 48000,
  numberOfChannels: 1,
  bitrate: 32000,
};
export const VOICE_LIMITS = { samples: 960, queue: 2, timeoutMs: 30000 };
const api = () => globalThis as unknown as VoiceCodecs;
export class VoiceEncoder {
  private encoder?: Encoder;
  private timestamp = 0;
  private pending = 0;
  private epoch = 0;
  private timer?: ReturnType<typeof setTimeout>;
  static async supported() {
    try {
      return (
        !!api().AudioData &&
        !!(await api().AudioEncoder?.isConfigSupported(VOICE_CONFIG))?.supported
      );
    } catch {
      return false;
    }
  }
  constructor(
    private output: (bytes: Uint8Array) => Promise<boolean>,
    private consumed: () => void,
    private error: () => void,
  ) {}
  async start() {
    this.dispose();
    const epoch = this.epoch;
    if (!(await VoiceEncoder.supported()) || epoch !== this.epoch) return false;
    const EncoderApi = api().AudioEncoder;
    if (!EncoderApi) return false;
    this.encoder = new EncoderApi({
      output: (chunk) => {
        if (epoch !== this.epoch) return;
        if (!chunk.byteLength || chunk.byteLength > 65536) {
          this.fail();
          return;
        }
        const bytes = new Uint8Array(chunk.byteLength);
        chunk.copyTo(bytes);
        // 两个采集 credit 同时限制编码及网络 drain；慢网络丢采集帧，不无限积压。
        void this.output(bytes)
          .then((ok) => {
            bytes.fill(0);
            if (epoch !== this.epoch) return;
            this.pending--;
            if (!this.pending) {
              clearTimeout(this.timer);
              this.timer = undefined;
            }
            this.consumed();
            if (!ok) this.fail();
          })
          .catch(() => {
            bytes.fill(0);
            if (epoch === this.epoch) this.fail();
          });
      },
      error: () => {
        if (epoch === this.epoch) this.fail();
      },
    });
    this.encoder.configure(VOICE_CONFIG);
    return true;
  }
  encode(samples: Float32Array) {
    const Data = api().AudioData;
    if (
      !this.encoder ||
      !Data ||
      samples.length !== VOICE_LIMITS.samples ||
      !samples.every(Number.isFinite) ||
      this.pending >= VOICE_LIMITS.queue ||
      this.encoder.encodeQueueSize >= VOICE_LIMITS.queue
    ) {
      this.consumed();
      return;
    }
    let data: { close(): void } | undefined;
    try {
      data = new Data({
        format: 'f32',
        sampleRate: 48000,
        numberOfFrames: samples.length,
        numberOfChannels: 1,
        timestamp: this.timestamp,
        data: samples,
      });
      this.timestamp += 20000;
      this.pending++;
      if (!this.timer) this.timer = setTimeout(() => this.fail(), 5000);
      this.encoder.encode(data);
    } catch {
      this.fail();
    } finally {
      data?.close();
      samples.fill(0);
    }
  }
  private fail() {
    this.dispose();
    this.error();
  }
  dispose() {
    ++this.epoch;
    clearTimeout(this.timer);
    this.timer = undefined;
    if (this.encoder?.state !== 'closed') this.encoder?.close();
    this.encoder = undefined;
    this.pending = 0;
    this.timestamp = 0;
  }
}
