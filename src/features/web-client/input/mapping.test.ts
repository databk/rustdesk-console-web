/** @jest-environment jsdom */
import './dom-test-encoding';
import { afterEach, expect, jest, test } from '@jest/globals';
import { hbb } from '../protocol';
import { RemoteInput } from './input';
import { RemoteTouch } from './touch';
import { DEFAULT_INPUT_MAPPING, mapInput } from './mapping';

afterEach(() => {
  document.body.replaceChildren();
  jest.useRealTimers();
});
const enabled = {
  reverseWheel: true,
  swapButtons: true,
  swapControlCommand: true,
};
test('实体和软键盘的左右修饰键、组合键一致转换，功能键不变', () => {
  for (const [source, target] of [
    [hbb.ControlKey.Control, hbb.ControlKey.Meta],
    [hbb.ControlKey.RControl, hbb.ControlKey.RWin],
    [hbb.ControlKey.Meta, hbb.ControlKey.Control],
    [hbb.ControlKey.RWin, hbb.ControlKey.RControl],
  ]) {
    expect(
      mapInput(
        {
          keyEvent: {
            controlKey: source,
            down: true,
            modifiers: [source, hbb.ControlKey.Shift],
          },
        },
        enabled,
      ).keyEvent,
    ).toMatchObject({
      controlKey: target,
      modifiers: [target, hbb.ControlKey.Shift],
    });
  }
  expect(
    mapInput(
      { keyEvent: { controlKey: hbb.ControlKey.CtrlAltDel, press: true } },
      enabled,
    ).keyEvent?.controlKey,
  ).toBe(hbb.ControlKey.CtrlAltDel);
});
test('组合按钮只交换左右，中键和移动不变，滚动量在转换后反向', () => {
  expect(
    [9, 17, 33, 10, 18, 34].map(
      (mask) => mapInput({ mouseEvent: { mask } }, enabled).mouseEvent?.mask,
    ),
  ).toEqual([17, 9, 33, 18, 10, 34]);
  expect(
    mapInput({ mouseEvent: { mask: 0, x: 4, y: 5 } }, enabled).mouseEvent,
  ).toMatchObject({ mask: 0, x: 4, y: 5 });
  expect(
    mapInput({ mouseEvent: { mask: 3, x: -2, y: 3 } }, enabled).mouseEvent,
  ).toMatchObject({ mask: 3, x: 2, y: -3 });
});
function canvas() {
  const element = document.createElement('canvas');
  element.tabIndex = 0;
  document.body.appendChild(element);
  element.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;
  element.setPointerCapture = jest.fn();
  element.hasPointerCapture = () => false;
  return element;
}
test('按下期间先用旧映射释放，再修改；物理抬起不会释放另一种键', () => {
  const element = canvas();
  let mapping = enabled;
  const sent: ReturnType<typeof mapInput>[] = [];
  const handler = new RemoteInput(
    element,
    { x: 0, y: 0, width: 100, height: 100 },
    (value) => sent.push(mapInput(value, mapping)),
  );
  element.dispatchEvent(
    new KeyboardEvent('keydown', {
      code: 'ControlLeft',
      key: 'Control',
      ctrlKey: true,
    }),
  );
  element.dispatchEvent(
    new MouseEvent('pointerdown', { button: 0, buttons: 1 }),
  );
  handler.release();
  mapping = DEFAULT_INPUT_MAPPING;
  element.dispatchEvent(
    new KeyboardEvent('keyup', { code: 'ControlLeft', key: 'Control' }),
  );
  expect(
    sent
      .filter((v) => v.keyEvent)
      .map((v) => [v.keyEvent?.controlKey, v.keyEvent?.down]),
  ).toEqual([
    [hbb.ControlKey.Meta, true],
    [hbb.ControlKey.Meta, false],
  ]);
  expect(
    sent.filter((v) => v.mouseEvent?.mask).map((v) => v.mouseEvent?.mask),
  ).toEqual([17, 18]);
  const paste = new KeyboardEvent('keydown', {
    code: 'KeyV',
    key: 'v',
    ctrlKey: true,
    cancelable: true,
  });
  element.dispatchEvent(paste);
  expect(paste.defaultPrevented).toBe(false);
  handler.dispose();
});
test('触摸长按右键也使用同一映射，释放保持对应按钮', () => {
  jest.useFakeTimers();
  const element = canvas();
  const sent: ReturnType<typeof mapInput>[] = [];
  const handler = new RemoteTouch(
    element,
    { x: 0, y: 0, width: 100, height: 100 },
    (value) => sent.push(mapInput(value, enabled)),
    'pointer',
    { scale: 1, x: 0, y: 0 },
    () => {},
  );
  const event = new MouseEvent('pointerdown', { clientX: 10, clientY: 10 });
  Object.assign(event, { pointerType: 'touch', pointerId: 1 });
  element.dispatchEvent(event);
  jest.advanceTimersByTime(500);
  expect(
    sent.filter((v) => v.mouseEvent?.mask).map((v) => v.mouseEvent?.mask),
  ).toEqual([9, 10]);
  handler.dispose();
});

test('Pointer组合按钮和滚轮通过统一映射，中键与抬起身份保持一致', () => {
  const element = canvas();
  const sent: ReturnType<typeof mapInput>[] = [];
  const handler = new RemoteInput(
    element,
    { x: 0, y: 0, width: 100, height: 100 },
    (value) => sent.push(mapInput(value, enabled)),
  );
  element.dispatchEvent(
    new MouseEvent('pointerdown', { button: 0, buttons: 1 }),
  );
  for (const buttons of [3, 7, 5, 1])
    element.dispatchEvent(new MouseEvent('pointermove', { buttons }));
  element.dispatchEvent(new MouseEvent('pointerup', { button: 0, buttons: 0 }));
  expect(
    sent
      .filter((value) => value.mouseEvent?.mask)
      .map((value) => value.mouseEvent?.mask),
  ).toEqual([17, 9, 33, 10, 34, 18]);
  element.dispatchEvent(
    new WheelEvent('wheel', { deltaX: 5, deltaY: -10, ctrlKey: true }),
  );
  expect(sent.at(-1)?.mouseEvent).toMatchObject({
    mask: 3,
    x: 1,
    y: -1,
    modifiers: [hbb.ControlKey.Meta],
  });
  handler.dispose();
});
