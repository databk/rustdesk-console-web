/** @jest-environment jsdom */
import './dom-test-encoding';
import { afterEach, expect, jest, test } from '@jest/globals';
import type { hbb } from '../protocol';
import { RemoteInput } from './input';
import { RemoteTouch, type TouchMode } from './touch';

const active: { dispose(): void }[] = [];
afterEach(() => {
  active.forEach((item) => {
    item.dispose();
  });
  active.length = 0;
  jest.useRealTimers();
});
function fixture(mode: TouchMode = 'pointer') {
  const canvas = document.createElement('canvas');
  canvas.setPointerCapture = jest.fn();
  canvas.getBoundingClientRect = () =>
    ({ x: 0, y: 0, left: 0, top: 0, width: 800, height: 600 }) as DOMRect;
  const display = { x: -800, y: 0, width: 800, height: 600 };
  const send =
    jest.fn<
      (value: {
        mouseEvent?: hbb.IMouseEvent;
        keyEvent?: hbb.IKeyEvent;
      }) => void
    >();
  const zoom = jest.fn();
  active.push(new RemoteInput(canvas, display, send));
  const touch = new RemoteTouch(
    canvas,
    display,
    send,
    mode,
    { scale: 1, x: 0, y: 0 },
    zoom,
  );
  active.push(touch);
  const pointer = (type: string, id = 1, x = 200, y = 100) => {
    const event = new MouseEvent(type, {
      clientX: x,
      clientY: y,
      cancelable: true,
      buttons: type === 'pointerup' ? 0 : 1,
    });
    Object.defineProperties(event, {
      pointerType: { value: 'touch' },
      pointerId: { value: id },
    });
    canvas.dispatchEvent(event);
  };
  return { touch, send, zoom, pointer };
}
test('点击只发送一组鼠标按下抬起，保留负坐标', () => {
  const f = fixture();
  f.pointer('pointerdown');
  f.pointer('pointerup');
  expect(f.send.mock.calls.map(([value]) => value.mouseEvent?.mask)).toEqual([
    0, 0, 9, 10,
  ]);
  expect(f.send.mock.calls[0][0].mouseEvent?.x).toBe(-600);
});
test('拖动取消只释放一次，长按右键不额外点击左键', () => {
  jest.useFakeTimers();
  const f = fixture();
  f.pointer('pointerdown');
  f.pointer('pointermove', 1, 230);
  f.touch.cancel();
  f.touch.cancel();
  expect(
    f.send.mock.calls.filter(([value]) => value.mouseEvent?.mask === 10),
  ).toHaveLength(1);
  f.send.mockClear();
  f.pointer('pointerdown');
  jest.advanceTimersByTime(501);
  f.pointer('pointerup');
  expect(f.send.mock.calls.map(([value]) => value.mouseEvent?.mask)).toEqual([
    0, 17, 18,
  ]);
});
test('双指缩放不会发送拖动或点击，手指离开后不误触', () => {
  const f = fixture();
  f.pointer('pointerdown', 1, 100);
  f.pointer('pointerdown', 2, 200);
  f.pointer('pointermove', 2, 300);
  f.pointer('pointerup', 2, 300);
  f.pointer('pointerup', 1, 100);
  expect(f.zoom).toHaveBeenLastCalledWith(
    expect.objectContaining({ scale: 2 }),
  );
  expect(
    f.send.mock.calls.every(([value]) => value.mouseEvent?.mask === 0),
  ).toBe(true);
});
test('滚动模式仅发送滚轮，失焦停止长按计时', () => {
  jest.useFakeTimers();
  const f = fixture('scroll');
  f.pointer('pointerdown');
  f.pointer('pointermove', 1, 200, 148);
  f.pointer('pointerup');
  expect(f.send).toHaveBeenCalledTimes(1);
  expect(f.send).toHaveBeenCalledWith({ mouseEvent: { mask: 3, x: 0, y: 2 } });
  const g = fixture();
  g.pointer('pointerdown');
  window.dispatchEvent(new Event('blur'));
  jest.advanceTimersByTime(1000);
  expect(
    g.send.mock.calls.some(([value]) => value.mouseEvent?.mask === 17),
  ).toBe(false);
});
