import { hbb } from '../protocol';
import { keyIdentity } from './keys';

export type VirtualKey = {
  code: string;
  label: string;
  key?: string;
  shifted?: string;
  width?: number;
  modifier?: boolean;
};
const key = (code: string, label: string, shifted?: string): VirtualKey => ({
  code,
  label,
  key: label,
  shifted,
});
// 仅列出已由实体输入链支持的键；不添加 PrintScreen/Pause 等占位键帽。
export const KEYBOARD_ROWS: VirtualKey[][] = [
  [
    { code: 'Escape', label: 'Esc' },
    ...Array.from({ length: 12 }, (_, i) => ({
      code: `F${i + 1}`,
      label: `F${i + 1}`,
    })),
  ],
  [
    key('Backquote', '`', '~'),
    ...'1234567890'
      .split('')
      .map((label, i) => key(`Digit${label}`, label, '!@#$%^&*()'[i])),
    key('Minus', '-', '_'),
    key('Equal', '=', '+'),
    { code: 'Backspace', label: '⌫', width: 2 },
  ],
  [
    { code: 'Tab', label: 'Tab', width: 1.5 },
    ...'qwertyuiop'
      .split('')
      .map((label) =>
        key(`Key${label.toUpperCase()}`, label, label.toUpperCase()),
      ),
    key('BracketLeft', '[', '{'),
    key('BracketRight', ']', '}'),
    key('Backslash', '\\', '|'),
  ],
  [
    { code: 'CapsLock', label: 'Caps', width: 1.8 },
    ...'asdfghjkl'
      .split('')
      .map((label) =>
        key(`Key${label.toUpperCase()}`, label, label.toUpperCase()),
      ),
    key('Semicolon', ';', ':'),
    key('Quote', "'", '"'),
    { code: 'Enter', label: 'Enter', width: 2 },
  ],
  [
    { code: 'ShiftLeft', label: 'Shift', width: 2.2, modifier: true },
    ...'zxcvbnm'
      .split('')
      .map((label) =>
        key(`Key${label.toUpperCase()}`, label, label.toUpperCase()),
      ),
    key('Comma', ',', '<'),
    key('Period', '.', '>'),
    key('Slash', '/', '?'),
    { code: 'ShiftRight', label: 'Shift', width: 2.6, modifier: true },
  ],
  [
    { code: 'ControlLeft', label: 'Ctrl', modifier: true },
    { code: 'MetaLeft', label: 'Win / ⌘', modifier: true },
    { code: 'AltLeft', label: 'Alt', modifier: true },
    { code: 'Space', label: 'Space', width: 6 },
    { code: 'AltRight', label: 'Alt', modifier: true },
    { code: 'MetaRight', label: 'Win / ⌘', modifier: true },
    { code: 'ControlRight', label: 'Ctrl', modifier: true },
  ],
];
export const NAVIGATION_ROWS: (VirtualKey | undefined)[][] = [
  [
    { code: 'Insert', label: 'Ins' },
    { code: 'Home', label: 'Home' },
    { code: 'PageUp', label: 'PgUp' },
  ],
  [
    { code: 'Delete', label: 'Del' },
    { code: 'End', label: 'End' },
    { code: 'PageDown', label: 'PgDn' },
  ],
  [undefined, { code: 'ArrowUp', label: '↑' }, undefined],
  [
    { code: 'ArrowLeft', label: '←' },
    { code: 'ArrowDown', label: '↓' },
    { code: 'ArrowRight', label: '→' },
  ],
];

type Send = (input: { keyEvent: hbb.IKeyEvent }) => boolean;
export class VirtualKeyboard {
  private held = new Map<string, hbb.ControlKey>();
  constructor(private readonly send: Send) {}
  heldCodes() {
    return [...this.held.keys()];
  }
  press(value: VirtualKey) {
    const controls = [...this.held.values()];
    const shift = controls.some(
      (c) => c === hbb.ControlKey.Shift || c === hbb.ControlKey.RShift,
    );
    const shortcut = controls.some(
      (c) => ![hbb.ControlKey.Shift, hbb.ControlKey.RShift].includes(c),
    );
    const identity = keyIdentity(
      value.code,
      shift ? (value.shifted ?? value.key ?? '') : (value.key ?? ''),
      shortcut,
    );
    if (!identity) return false;
    if (value.modifier && identity.controlKey != null) {
      const down = !this.held.has(value.code);
      const modifiers = controls.filter((c) => c !== identity.controlKey);
      if (
        !this.send({
          keyEvent: {
            ...identity,
            mode: hbb.KeyboardMode.Legacy,
            down,
            modifiers: modifiers.length ? modifiers : undefined,
          },
        })
      )
        return false;
      if (down) this.held.set(value.code, identity.controlKey);
      else this.held.delete(value.code);
      return true;
    }
    // 原子按键沿原生 press 语义，不把它记录成持续按下的键。
    return this.send({
      keyEvent: {
        ...identity,
        mode: hbb.KeyboardMode.Legacy,
        press: true,
        modifiers: controls,
      },
    });
  }
  release() {
    const keys = [...this.held.values()];
    this.held.clear();
    for (const controlKey of keys)
      this.send({
        keyEvent: { controlKey, mode: hbb.KeyboardMode.Legacy, down: false },
      });
  }
}
