import { hbb } from '../protocol';

export interface InputMapping {
  reverseWheel: boolean;
  swapButtons: boolean;
  swapControlCommand: boolean;
}
export const DEFAULT_INPUT_MAPPING: InputMapping = {
  reverseWheel: false,
  swapButtons: false,
  swapControlCommand: false,
};
type Input = { keyEvent?: hbb.IKeyEvent; mouseEvent?: hbb.IMouseEvent };

export function mapControlKey(key: hbb.ControlKey, enabled: boolean) {
  if (!enabled) return key;
  switch (key) {
    case hbb.ControlKey.Control:
      return hbb.ControlKey.Meta;
    case hbb.ControlKey.RControl:
      return hbb.ControlKey.RWin;
    case hbb.ControlKey.Meta:
      return hbb.ControlKey.Control;
    case hbb.ControlKey.RWin:
      return hbb.ControlKey.RControl;
    default:
      return key;
  }
}

// 所有页面输入（实体键、软键盘、指针和触摸）在同一出站边界转换。
export function mapInput(input: Input, options: InputMapping): Input {
  const mapModifiers = (keys?: hbb.ControlKey[] | null) =>
    keys?.map((key) => mapControlKey(key, options.swapControlCommand));
  const result: Input = {};
  if (input.keyEvent) {
    const key = input.keyEvent;
    result.keyEvent = {
      ...key,
      ...(key.controlKey != null
        ? {
            controlKey: mapControlKey(
              key.controlKey,
              options.swapControlCommand,
            ),
          }
        : {}),
      modifiers: mapModifiers(key.modifiers),
    };
  }
  if (input.mouseEvent) {
    const mouse = input.mouseEvent;
    const mask = mouse.mask ?? 0;
    const type = mask & 7;
    const button = mask >>> 3;
    const swapped =
      options.swapButtons && (type === 1 || type === 2)
        ? button === 1
          ? 2
          : button === 2
            ? 1
            : button
        : button;
    result.mouseEvent = {
      ...mouse,
      mask: type | (swapped << 3),
      ...(type === 3 && options.reverseWheel
        ? { x: -(mouse.x ?? 0), y: -(mouse.y ?? 0) }
        : {}),
      modifiers: mapModifiers(mouse.modifiers),
    };
  }
  return result;
}
