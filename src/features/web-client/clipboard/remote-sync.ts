import { pngSize } from './image';
import { MAX_TEXT_BYTES } from './text';

export type ClipboardValue = { text: string } | { bytes: Uint8Array };
const same = (a: ClipboardValue | undefined, b: ClipboardValue) => {
  if (!a) return false;
  if ('text' in a && 'text' in b) return a.text === b.text;
  if ('bytes' in a && 'bytes' in b)
    return (
      a.bytes.length === b.bytes.length &&
      a.bytes.every((n, i) => n === b.bytes[i])
    );
  return false;
};

export function writeRemoteClipboard(value: ClipboardValue): Promise<void> {
  if ('text' in value) return navigator.clipboard.writeText(value.text);
  return navigator.clipboard.write([
    new ClipboardItem({
      'image/png': new Blob([new Uint8Array(value.bytes)], {
        type: 'image/png',
      }),
    }),
  ]);
}

/** 只消费远端变化，不轮询本机剪贴板；串行写入，保留最新一次失败用于用户点击重试。 */
export class RemoteClipboardSync {
  private epoch = 0;
  private pending?: ClipboardValue;
  private last?: ClipboardValue;
  private writing?: ClipboardValue;
  private writingEpoch = -1;
  private busy = false;
  private blocked = false;
  constructor(
    private allowed: () => boolean,
    private write: (value: ClipboardValue) => Promise<void>,
    private onBlocked: (blocked: boolean) => void,
  ) {}
  reset() {
    ++this.epoch;
    this.pending = undefined;
    this.last = undefined;
    this.blocked = false;
    this.onBlocked(false);
  }
  rememberLocal(value: ClipboardValue) {
    // 本机主动粘贴时使尚未写入的远端内容失效，避免迟到回显覆盖用户刚复制的内容。
    this.reset();
    this.last = value;
  }
  receive(value: ClipboardValue) {
    // 去重以最新目标为准：写入 B 时再收到已完成的 A，仍需在 B 后恢复 A。
    const latest =
      this.pending ??
      (this.writingEpoch === this.epoch ? this.writing : this.last);
    if (
      !this.allowed() ||
      same(latest, value)
    )
      return;
    try {
      if ('text' in value) {
        if (new TextEncoder().encode(value.text).byteLength > MAX_TEXT_BYTES)
          return;
      } else pngSize(value.bytes);
    } catch {
      return;
    }
    this.pending = value;
    // 权限已拒绝后不反复触发浏览器提示；只更新显式重试要复制的最新内容。
    if (!this.blocked) void this.flush();
  }
  retry() {
    if (!this.allowed()) return;
    this.blocked = false;
    void this.flush();
  }
  private async flush() {
    if (this.busy || !this.pending || !this.allowed()) return;
    if (same(this.last, this.pending)) {
      this.pending = undefined;
      this.blocked = false;
      this.onBlocked(false);
      return;
    }
    const value = this.pending;
    const epoch = this.epoch;
    this.pending = undefined;
    this.busy = true;
    this.writing = value;
    this.writingEpoch = epoch;
    try {
      // 此前没有异步转换；必须在当前有效上下文内直接调用浏览器写入。
      await this.write(value);
      if (epoch === this.epoch && this.allowed()) {
        this.last = value;
        this.blocked = false;
        this.onBlocked(false);
      }
    } catch {
      if (epoch === this.epoch && this.allowed()) {
        this.pending ??= value;
        this.blocked = true;
        this.onBlocked(true);
      }
    } finally {
      this.busy = false;
      this.writing = undefined;
      if (!this.blocked && this.pending && this.allowed()) void this.flush();
    }
  }
}
