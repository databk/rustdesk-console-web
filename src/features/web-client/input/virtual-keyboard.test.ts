import './dom-test-encoding';
import { expect, test } from '@jest/globals';
import { hbb } from '../protocol';
import { DEFAULT_INPUT_MAPPING, mapInput } from './mapping';
import {
  KEYBOARD_ROWS,
  NAVIGATION_ROWS,
  VirtualKeyboard,
  type VirtualKey,
} from './virtual-keyboard';

const keys = [
  ...KEYBOARD_ROWS.flat(),
  ...NAVIGATION_ROWS.flat().filter((value): value is VirtualKey => !!value),
];
const key = (code: string) => {
  const value = keys.find((item) => item.code === code);
  if (!value) throw new Error(`Missing supported key: ${code}`);
  return value;
};
test('全部可见键帽都生成真实原生键身份，未支持键没有占位', () => {
  for (const value of keys) {
    const messages: hbb.IKeyEvent[] = [];
    const keyboard = new VirtualKeyboard(({ keyEvent }) => {
      messages.push(keyEvent);
      return true;
    });
    expect(keyboard.press(value)).toBe(true);
    const roundtrip = hbb.KeyEvent.decode(
      hbb.KeyEvent.encode(messages[0]).finish(),
    );
    expect(roundtrip.mode).toBe(hbb.KeyboardMode.Legacy);
    expect(roundtrip.controlKey || roundtrip.chr).toBeTruthy();
    keyboard.release();
  }
  expect(
    keys.some((value) => ['PrintScreen', 'Pause'].includes(value.code)),
  ).toBe(false);
});
test('Shift字符和快捷键基础字符分开，左右修饰沿同一映射释放原身份', () => {
  let swap = true;
  const messages: hbb.IKeyEvent[] = [];
  const keyboard = new VirtualKeyboard((input) => {
    const mapped = mapInput(input, {
      ...DEFAULT_INPUT_MAPPING,
      swapControlCommand: swap,
    });
    if (!mapped.keyEvent) throw new Error('Mapped key event missing');
    messages.push(mapped.keyEvent);
    return true;
  });
  keyboard.press(key('ShiftLeft'));
  keyboard.press(key('Digit1'));
  expect(messages.at(-1)).toMatchObject({
    chr: '!'.codePointAt(0),
    press: true,
    modifiers: [hbb.ControlKey.Shift],
  });
  keyboard.press(key('ControlLeft'));
  keyboard.press(key('KeyS'));
  expect(messages.at(-1)).toMatchObject({
    chr: 's'.codePointAt(0),
    modifiers: [hbb.ControlKey.Shift, hbb.ControlKey.Meta],
  });
  keyboard.release();
  expect(messages.at(-1)).toMatchObject({
    controlKey: hbb.ControlKey.Meta,
    down: false,
  });
  swap = false;
  keyboard.press(key('ControlRight'));
  keyboard.release();
  expect(messages.at(-1)).toMatchObject({
    controlKey: hbb.ControlKey.RControl,
    down: false,
  });
  expect(keyboard.heldCodes()).toEqual([]);
});
test('拒绝的修饰键不留下本机按下状态，重复清理幂等', () => {
  let calls = 0;
  const keyboard = new VirtualKeyboard(() => {
    calls++;
    return false;
  });
  expect(keyboard.press(key('ControlLeft'))).toBe(false);
  keyboard.release();
  keyboard.release();
  expect(calls).toBe(1);
  expect(keyboard.heldCodes()).toEqual([]);
});
