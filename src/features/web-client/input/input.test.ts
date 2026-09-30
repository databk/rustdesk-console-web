/** @jest-environment jsdom */
import './dom-test-encoding';
import { afterEach, expect, jest, test } from '@jest/globals';
import { hbb } from '../protocol';
import { modifiers, RemoteInput, remotePoint } from './input';

const handlers: RemoteInput[] = [];
afterEach(() => {
  for (const handler of handlers) handler.dispose();
  handlers.length = 0;
  document.body.replaceChildren();
});
function setup() {
  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  canvas.tabIndex = 0;
  canvas.getBoundingClientRect = () =>
    ({ left: 100, top: 50, width: 800, height: 450 }) as DOMRect;
  canvas.setPointerCapture = jest.fn();
  canvas.hasPointerCapture = () => false;
  const sent: { keyEvent?: hbb.IKeyEvent; mouseEvent?: hbb.IMouseEvent }[] = [];
  const handler = new RemoteInput(
    canvas,
    { x: -1920, y: 0, width: 1920, height: 1080 },
    (value) => sent.push(value),
  );
  handlers.push(handler);
  return { canvas, sent, handler };
}
test('scaled canvas coordinates preserve monitor origin and clamp captured drags', () => {
  const rect = { left: 100, top: 50, width: 800, height: 450 };
  const display = { x: -1920, y: 10, width: 1920, height: 1080 };
  expect(remotePoint(500, 275, rect, display)).toEqual({ x: -960, y: 550 });
  expect(remotePoint(-5, 900, rect, display)).toEqual({ x: -1920, y: 1089 });
  expect(remotePoint(500, 275, { ...rect, width: 0 }, display)).toBeUndefined();
});
test('modifier keys exclude themselves and preserve other held modifiers', () => {
  expect(
    modifiers(
      { ctrlKey: true, shiftKey: true, altKey: false, metaKey: false },
      'ControlLeft',
    ),
  ).toEqual([hbb.ControlKey.Shift]);
});
test('key down/up preserve characters, and blur releases held keys exactly once', () => {
  const { canvas, sent, handler } = setup();
  canvas.dispatchEvent(
    new KeyboardEvent('keydown', {
      code: 'KeyA',
      key: 'a',
      ctrlKey: true,
      cancelable: true,
    }),
  );
  expect(sent[0].keyEvent).toMatchObject({
    chr: 97,
    down: true,
    modifiers: [hbb.ControlKey.Control],
  });
  window.dispatchEvent(new Event('blur'));
  expect(sent[1].keyEvent).toMatchObject({ chr: 97, down: false });
  canvas.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA', key: 'a' }));
  handler.dispose();
  canvas.dispatchEvent(
    new KeyboardEvent('keydown', { code: 'KeyB', key: 'b' }),
  );
  expect(sent).toHaveLength(2);
});
test('IME composition is reserved for explicit Unicode text submission', () => {
  const { canvas, sent } = setup();
  canvas.dispatchEvent(
    new KeyboardEvent('keydown', {
      code: 'KeyA',
      key: 'Process',
      isComposing: true,
    }),
  );
  expect(sent).toHaveLength(0);
});
test('pointer drag, cancellation and wheel use native masks without stuck buttons', () => {
  const { canvas, sent } = setup();
  canvas.dispatchEvent(
    new MouseEvent('pointerdown', {
      button: 0,
      buttons: 1,
      clientX: 500,
      clientY: 275,
      cancelable: true,
    }),
  );
  expect(sent[0].mouseEvent).toMatchObject({ mask: 0, x: -960, y: 540 });
  expect(sent[1].mouseEvent?.mask).toBe(9);
  canvas.dispatchEvent(new Event('pointercancel'));
  expect(sent[2].mouseEvent?.mask).toBe(10);
  canvas.dispatchEvent(
    new WheelEvent('wheel', { deltaY: 120, deltaX: -10, cancelable: true }),
  );
  expect(sent[3].mouseEvent).toMatchObject({ mask: 3, x: 1, y: -1 });
});

test('chorded mouse buttons follow pointermove state and leave no held button', () => {
  const { canvas, sent, handler } = setup();
  for (const [type, button, buttons] of [
    ['pointerdown', 0, 1],
    ['pointermove', 2, 3],
    ['pointermove', 0, 2],
    ['pointerup', 2, 0],
  ] as const) {
    canvas.dispatchEvent(new MouseEvent(type, { button, buttons }));
  }
  expect(sent.map((v) => v.mouseEvent?.mask).filter((mask) => mask)).toEqual([
    9, 17, 10, 18,
  ]);
  const count = sent.length;
  handler.release();
  expect(sent).toHaveLength(count);
});

test('lost capture releases mouse buttons without releasing a held keyboard modifier', () => {
  const { canvas, sent, handler } = setup();
  canvas.dispatchEvent(
    new KeyboardEvent('keydown', { code: 'ShiftLeft', key: 'Shift' }),
  );
  canvas.dispatchEvent(
    new MouseEvent('pointerdown', { button: 0, buttons: 1 }),
  );
  canvas.dispatchEvent(new Event('lostpointercapture'));
  expect(sent.at(-1)?.mouseEvent?.mask).toBe(10);
  expect(sent.filter((v) => v.keyEvent?.down === false)).toHaveLength(0);
  handler.release();
  expect(sent.at(-1)?.keyEvent).toMatchObject({
    controlKey: hbb.ControlKey.Shift,
    down: false,
  });
  expect(sent.filter((v) => v.mouseEvent?.mask === 10)).toHaveLength(1);
});

test('moving into the canvas with an externally held mouse button does not start a remote drag', () => {
  const { canvas, sent } = setup();
  canvas.dispatchEvent(new MouseEvent('pointermove', { buttons: 1 }));
  expect(sent.map((v) => v.mouseEvent?.mask)).toEqual([0]);
});
