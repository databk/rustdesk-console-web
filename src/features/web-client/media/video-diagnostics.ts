export interface VideoDiagnostics {
  decodeQueue: number;
  pendingBatches: number;
  decodeLatencyMs?: number;
  ackLatencyMs?: number;
  presentationLatencyMs?: number;
  droppedPresentation: number;
  recoveryCount: number;
}

// 最近64个本地耗时样本；不保存帧，计时不代表远端采集耗时或网络RTT。
export class LatencyWindow {
  private values: number[] = [];
  add(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 60000) return;
    if (this.values.length === 64) this.values.shift();
    this.values.push(value);
  }
  value() {
    return this.values.length
      ? this.values.reduce((total, value) => total + value, 0) /
          this.values.length
      : undefined;
  }
  reset() {
    this.values = [];
  }
}
