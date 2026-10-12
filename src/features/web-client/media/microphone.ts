// Worklet仅发送固定20ms单声道PCM，最多两个未确认帧。不播放本机麦克风。
const WORKLET = `class RustDeskMicrophone extends AudioWorkletProcessor {
  constructor() { super(); this.frame = new Float32Array(960); this.offset = 0; this.pending = 0; this.port.onmessage = () => { this.pending = Math.max(0, this.pending - 1); }; }
  process(inputs) {
    const channels = inputs[0]; if (!channels || !channels.length) return true;
    for (let i = 0; i < channels[0].length; i++) {
      let value = 0; for (const channel of channels) value += channel[i] || 0;
      this.frame[this.offset++] = value / channels.length;
      if (this.offset === 960) {
        if (this.pending < 2) { const frame = this.frame; this.frame = new Float32Array(960); this.pending++; this.port.postMessage(frame, [frame.buffer]); }
        this.offset = 0;
      }
    }
    return true;
  }
} registerProcessor('rustdesk-microphone', RustDeskMicrophone);`;
export class Microphone {
  private stream?: MediaStream;
  private context?: AudioContext;
  private node?: AudioWorkletNode;
  private source?: MediaStreamAudioSourceNode;
  private epoch = 0;
  private enabled = false;
  private muted = false;
  constructor(
    private output: (samples: Float32Array) => void,
    private lost: () => void,
  ) {}
  async start() {
    this.dispose();
    const epoch = this.epoch;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
      video: false,
    });
    if (epoch !== this.epoch) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      return false;
    }
    this.stream = stream;
    stream.getTracks().forEach((track) => {
      track.onended = () => {
        if (epoch === this.epoch) {
          this.dispose();
          this.lost();
        }
      };
    });
    try {
      const context = new AudioContext({
        sampleRate: 48000,
        latencyHint: 'interactive',
      });
      this.context = context;
      if (context.sampleRate !== 48000 || !context.audioWorklet)
        throw new Error('Microphone unavailable');
      const url = URL.createObjectURL(
        new Blob([WORKLET], { type: 'text/javascript' }),
      );
      try {
        await context.audioWorklet.addModule(url);
      } finally {
        URL.revokeObjectURL(url);
      }
      if (epoch !== this.epoch) {
        void context.close();
        return false;
      }
      const node = new AudioWorkletNode(context, 'rustdesk-microphone', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      });
      this.node = node;
      node.port.onmessage = (event) => {
        const samples = event.data;
        if (
          epoch === this.epoch &&
          this.enabled &&
          !this.muted &&
          samples instanceof Float32Array &&
          samples.length === 960
        )
          this.output(samples);
        else this.consumed();
      };
      this.source = context.createMediaStreamSource(stream);
      this.source.connect(node);
      node.connect(context.destination);
      await context.resume();
      if (epoch !== this.epoch) return false;
      if (context.state !== 'running')
        throw new Error('Microphone unavailable');
      return true;
    } catch (error) {
      if (epoch === this.epoch) this.dispose();
      throw error;
    }
  }
  enable(value: boolean) {
    this.enabled = value;
  }
  mute(value: boolean) {
    this.muted = value;
    this.stream?.getAudioTracks().forEach((track) => {
      track.enabled = !value;
    });
  }
  consumed() {
    this.node?.port.postMessage('consumed');
  }
  dispose() {
    ++this.epoch;
    this.enabled = false;
    this.muted = false;
    this.stream?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    this.stream = undefined;
    if (this.node) {
      this.node.port.onmessage = null;
      this.node.port.close();
      this.node.disconnect();
    }
    this.node = undefined;
    this.source?.disconnect();
    this.source = undefined;
    const context = this.context;
    this.context = undefined;
    if (context && context.state !== 'closed')
      void context.close().catch(() => {});
  }
}
