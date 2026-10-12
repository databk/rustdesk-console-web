import { hbb } from '../protocol';

const control: Record<string, hbb.ControlKey> = {
  AltLeft: hbb.ControlKey.Alt,
  AltRight: hbb.ControlKey.RAlt,
  ControlLeft: hbb.ControlKey.Control,
  ControlRight: hbb.ControlKey.RControl,
  ShiftLeft: hbb.ControlKey.Shift,
  ShiftRight: hbb.ControlKey.RShift,
  MetaLeft: hbb.ControlKey.Meta,
  MetaRight: hbb.ControlKey.RWin,
  Enter: hbb.ControlKey.Return,
  NumpadEnter: hbb.ControlKey.NumpadEnter,
  Escape: hbb.ControlKey.Escape,
  Tab: hbb.ControlKey.Tab,
  Backspace: hbb.ControlKey.Backspace,
  Delete: hbb.ControlKey.Delete,
  Insert: hbb.ControlKey.Insert,
  Home: hbb.ControlKey.Home,
  End: hbb.ControlKey.End,
  PageUp: hbb.ControlKey.PageUp,
  PageDown: hbb.ControlKey.PageDown,
  ArrowUp: hbb.ControlKey.UpArrow,
  ArrowDown: hbb.ControlKey.DownArrow,
  ArrowLeft: hbb.ControlKey.LeftArrow,
  ArrowRight: hbb.ControlKey.RightArrow,
  CapsLock: hbb.ControlKey.CapsLock,
  Space: hbb.ControlKey.Space,
  ...Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [
      `F${i + 1}`,
      hbb.ControlKey[`F${i + 1}` as keyof typeof hbb.ControlKey],
    ]),
  ),
};

// 实体键与屏幕键盘共用原生键身份，不合成浏览器键盘事件。
export function keyIdentity(
  code: string,
  key: string,
  shortcut = false,
): hbb.IKeyEvent | undefined {
  if (control[code] !== undefined) return { controlKey: control[code] };
  if (shortcut && /^Key[A-Z]$/.test(code))
    return { chr: code.slice(3).toLowerCase().codePointAt(0) };
  if (Array.from(key).length === 1) return { chr: key.codePointAt(0) };
  return undefined;
}
