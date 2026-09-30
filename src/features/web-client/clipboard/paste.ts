import { hbb } from '../protocol';
import { clipboardPng } from './image';
import { encodeText, MAX_TEXT_BYTES } from './text';

export type PasteContent = { text: string } | { bytes: Uint8Array };
type PasteStatus = 'sending' | 'sent' | 'cancelled' | 'failed';

// 原生协议没有系统剪贴板写入确认。此间隔仅让远端异步写入有机会完成，
// 不代表操作系统或目标应用确认成功；弱网络下仍可能需要重试。
export const PASTE_SETTLE_MS = 300;

export class RemotePaste {
  private epoch = 0;
  private busy = false;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly transport: {
      clipboard: (value: hbb.IClipboard) => boolean;
      image: (bytes: Uint8Array) => boolean;
      flush: () => Promise<void>;
      input: (value: { keyEvent: hbb.IKeyEvent }) => boolean;
      status: (value: PasteStatus) => void;
    },
  ) {}

  cancel() {
    ++this.epoch;
    clearTimeout(this.timer);
    this.timer = undefined;
    if (this.busy) this.transport.status('cancelled');
    this.busy = false;
  }

  async send(content: PasteContent, valid: () => boolean, mac: boolean) {
    if (this.busy || !valid()) return;
    const epoch = ++this.epoch;
    const active = () => epoch === this.epoch && valid();
    this.busy = true;
    this.transport.status('sending');
    try {
      let sent: boolean;
      if ('bytes' in content) {
        const png = await clipboardPng({
          content: content.bytes,
          format: hbb.ClipboardFormat.ImagePng,
        });
        if (!active()) return;
        sent = this.transport.image(png);
      } else {
        if (!content.text || content.text.length > MAX_TEXT_BYTES)
          throw new Error('Invalid paste size');
        const clipboard = encodeText(content.text);
        if (!active()) return;
        sent = this.transport.clipboard(clipboard);
      }
      if (!sent) throw new Error('Clipboard send failed');
      await this.transport.flush();
      if (!active()) return;
      this.timer = setTimeout(() => {
        this.timer = undefined;
        this.busy = false;
        if (!active()) {
          if (epoch === this.epoch) this.transport.status('cancelled');
          return;
        }
        const applied = this.transport.input({
          keyEvent: {
            chr: 118,
            press: true,
            mode: hbb.KeyboardMode.Legacy,
            modifiers: [mac ? hbb.ControlKey.Meta : hbb.ControlKey.Control],
          },
        });
        this.transport.status(applied ? 'sent' : 'failed');
      }, PASTE_SETTLE_MS);
    } catch {
      if (epoch === this.epoch) this.transport.status('failed');
    } finally {
      if (epoch === this.epoch && !this.timer) {
        this.busy = false;
        if (!valid()) this.transport.status('cancelled');
      }
    }
  }
}
