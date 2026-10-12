import { hbb } from '../protocol';
import { keyIdentity } from './keys';
import { isLocalPasteShortcut, localPlatform } from './local-paste';

export interface RemoteDisplay {
  x: number;
  y: number;
  width: number;
  height: number;
}
type Input = { keyEvent?: hbb.IKeyEvent; mouseEvent?: hbb.IMouseEvent };

export function modifiers(
  event: {
    altKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
  },
  ownCode = '',
): hbb.ControlKey[] {
  const result: hbb.ControlKey[] = [];
  if (event.altKey && !ownCode.startsWith('Alt'))
    result.push(hbb.ControlKey.Alt);
  if (event.ctrlKey && !ownCode.startsWith('Control'))
    result.push(hbb.ControlKey.Control);
  if (event.shiftKey && !ownCode.startsWith('Shift'))
    result.push(hbb.ControlKey.Shift);
  if (event.metaKey && !ownCode.startsWith('Meta'))
    result.push(hbb.ControlKey.Meta);
  return result;
}

export function remotePoint(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  display: RemoteDisplay,
) {
  if (rect.width <= 0 || rect.height <= 0) return undefined;
  const x = Math.floor(((clientX - rect.left) * display.width) / rect.width);
  const y = Math.floor(((clientY - rect.top) * display.height) / rect.height);
  return {
    x: display.x + Math.max(0, Math.min(display.width - 1, x)),
    y: display.y + Math.max(0, Math.min(display.height - 1, y)),
  };
}

export class RemoteInput {
  private keys = new Map<string, hbb.IKeyEvent>();
  private buttons = new Set<number>();
  private abort = new AbortController();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly display: RemoteDisplay,
    private readonly send: (input: Input) => void,
    private readonly onActivity: () => void = () => {},
    private readonly platform: string = localPlatform(),
  ) {
    const options = { signal: this.abort.signal };
    canvas.addEventListener('keydown', this.keydown, options);
    canvas.addEventListener('keyup', this.keyup, options);
    canvas.addEventListener('pointerdown', this.pointerdown, options);
    canvas.addEventListener('pointerup', this.pointerup, options);
    canvas.addEventListener('pointermove', this.pointermove, options);
    canvas.addEventListener('pointerenter', this.enter, options);
    canvas.addEventListener('pointerleave', this.leave, options);
    canvas.addEventListener('pointercancel', this.release, options);
    canvas.addEventListener('lostpointercapture', this.releaseButtons, options);
    canvas.addEventListener('blur', this.release, options);
    canvas.addEventListener(
      'contextmenu',
      (event) => event.preventDefault(),
      options,
    );
    canvas.addEventListener('wheel', this.wheel, {
      ...options,
      passive: false,
    });
    window.addEventListener('blur', this.release, options);
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) this.release();
      },
      options,
    );
  }

  private keydown = (event: KeyboardEvent) => {
    const shortcut =
      !event.isComposing &&
      !event.getModifierState('AltGraph') &&
      (event.ctrlKey || event.altKey || event.metaKey) &&
      /^Key[A-Z]$/.test(event.code);
    if (
      event.isComposing ||
      (!shortcut && (event.key === 'Dead' || event.key === 'Process'))
    )
      return;
    // 交给浏览器产生真实 paste 事件；提前发送 V 会粘贴远端的旧内容。
    if (isLocalPasteShortcut(event, this.platform)) {
      this.release();
      return;
    }
    const key: hbb.IKeyEvent | undefined =
      this.keys.get(event.code) || keyIdentity(event.code, event.key, shortcut);
    if (!key) return;
    event.preventDefault();
    this.onActivity();
    this.keys.set(event.code, key);
    this.send({
      keyEvent: {
        ...key,
        down: true,
        mode: hbb.KeyboardMode.Legacy,
        modifiers: modifiers(event, event.code),
      },
    });
  };
  private keyup = (event: KeyboardEvent) => {
    const key = this.keys.get(event.code);
    if (!key) return;
    event.preventDefault();
    this.keys.delete(event.code);
    this.send({
      keyEvent: {
        ...key,
        down: false,
        mode: hbb.KeyboardMode.Legacy,
        modifiers: modifiers(event, event.code),
      },
    });
  };
  private pointermove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    const point = remotePoint(
      event.clientX,
      event.clientY,
      this.canvas.getBoundingClientRect(),
      this.display,
    );
    if (point) {
      this.onActivity();
      this.send({
        mouseEvent: { mask: 0, ...point, modifiers: modifiers(event) },
      });
    }
    // Chorded button changes arrive as pointermove, not pointerdown/up.
    if (this.buttons.size) this.syncButtons(event);
  };
  private enter = () => {
    const active = document.activeElement;
    if (active !== this.canvas && active instanceof Element) {
      const hidden = active.closest('[hidden], [aria-hidden="true"]');
      const closedToolbar = active.closest(
        '[data-session-toolbar][data-tool-open="false"]',
      );
      const editing = active.closest(
        'input,textarea,select,[contenteditable="true"],[role="menu"]',
      );
      // 菜单收起后的按钮焦点可交还画面；正在操作的表单和菜单仍保留焦点。
      if (!hidden && (editing || (active.closest('button') && !closedToolbar)))
        return;
    }
    this.canvas.focus({ preventScroll: true });
  };
  private leave = () => {
    // 捕获中的拖动允许继续；普通离开则交还本机键盘。
    if (this.buttons.size) return;
    this.release();
    if (document.activeElement === this.canvas) this.canvas.blur();
  };
  private syncButtons(event: PointerEvent) {
    for (const button of [1, 2, 4]) {
      const down = !!(event.buttons & button);
      if (down === this.buttons.has(button)) continue;
      if (down) this.buttons.add(button);
      else this.buttons.delete(button);
      this.send({
        mouseEvent: {
          mask: (down ? 1 : 2) | (button << 3),
          modifiers: modifiers(event),
        },
      });
    }
  }
  private pointerdown = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    if (event.button < 0 || event.button > 2) return;
    event.preventDefault();
    this.canvas.focus();
    this.canvas.setPointerCapture(event.pointerId);
    this.pointermove(event);
    this.syncButtons(event);
  };
  private pointerup = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    if (!this.buttons.size) return;
    event.preventDefault();
    this.pointermove(event);
    if (!this.buttons.size && this.canvas.hasPointerCapture(event.pointerId))
      this.canvas.releasePointerCapture(event.pointerId);
  };
  private wheel = (event: WheelEvent) => {
    event.preventDefault();
    this.send({
      mouseEvent: {
        mask: 3,
        x: -Math.sign(event.deltaX),
        y: -Math.sign(event.deltaY),
        modifiers: modifiers(event),
      },
    });
  };
  release = () => {
    for (const key of this.keys.values())
      this.send({
        keyEvent: { ...key, down: false, mode: hbb.KeyboardMode.Legacy },
      });
    this.keys.clear();
    this.releaseButtons();
  };
  private releaseButtons = () => {
    for (const button of this.buttons)
      this.send({ mouseEvent: { mask: 2 | (button << 3) } });
    this.buttons.clear();
  };
  dispose() {
    this.release();
    this.abort.abort();
  }
}
