import { AUDIO_LIMITS, type PcmFrame } from './opus';

export class AudioPlayer {
  private context?: AudioContext;
  private gain?: GainNode;
  private sources = new Set<AudioBufferSourceNode>();
  private next = 0;
  async start() {
    this.dispose();
    const context = new AudioContext({ latencyHint: 'interactive' });
    this.context = context;
    this.gain = context.createGain();
    this.gain.connect(context.destination);
    await context.resume();
    if (this.context !== context || context.state !== 'running')
      throw new Error('Audio unavailable');
  }
  volume(value: number) {
    if (this.gain) this.gain.gain.value = Math.max(0, Math.min(1, value));
  }
  play(frame: PcmFrame) {
    const context = this.context;
    if (context?.state !== 'running' || !this.gain) return;
    if (
      Math.max(this.next, context.currentTime + 0.04) +
        frame.planes[0].length / frame.sampleRate -
        context.currentTime >
        AUDIO_LIMITS.bufferedSeconds ||
      this.sources.size >= 32
    )
      this.clear();
    const buffer = context.createBuffer(
      frame.planes.length,
      frame.planes[0].length,
      frame.sampleRate,
    );
    frame.planes.forEach((plane, index) => {
      buffer.copyToChannel(new Float32Array(plane), index);
    });
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gain);
    source.onended = () => {
      source.disconnect();
      this.sources.delete(source);
    };
    this.sources.add(source);
    this.next = Math.max(this.next, context.currentTime + 0.04);
    source.start(this.next);
    this.next += buffer.duration;
  }
  clear() {
    for (const source of this.sources) {
      source.onended = null;
      source.stop();
      source.disconnect();
    }
    this.sources.clear();
    this.next = 0;
  }
  dispose() {
    this.clear();
    this.gain?.disconnect();
    this.gain = undefined;
    const context = this.context;
    this.context = undefined;
    if (context && context.state !== 'closed')
      void context.close().catch(() => {});
  }
}
