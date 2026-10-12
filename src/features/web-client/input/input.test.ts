/** @jest-environment jsdom */
import './dom-test-encoding';
import { afterEach, expect, jest, test } from '@jest/globals';
import { hbb } from '../protocol';
import { modifiers, RemoteInput, remotePoint } from './input';

const handlers: RemoteInput[] = [];
test('进入画面取得焦点，离开释放；不抢密码、菜单和路径输入', () => {
  const { canvas, sent } = setup();
  canvas.dispatchEvent(new Event('pointerenter'));
  expect(document.activeElement).toBe(canvas);
  canvas.dispatchEvent(
    new KeyboardEvent('keydown', { code: 'AltLeft', key: 'Alt', altKey: true }),
  );
  canvas.dispatchEvent(new Event('pointerleave'));
  expect(document.activeElement).not.toBe(canvas);
  expect(sent.at(-1)?.keyEvent).toMatchObject({
    controlKey: hbb.ControlKey.Alt,
    down: false,
  });
  for (const tag of ['input', 'textarea', 'button', 'select']) {
    const field = document.createElement(tag);
    document.body.append(field);
    field.focus();
    canvas.dispatchEvent(new Event('pointerenter'));
    expect(document.activeElement).toBe(field);
    field.remove();
  }
});
test('Alt+Shift+S使用基础字母并配对释放，重复与本地布局变化不留下旧键', () => {
  const { canvas, sent } = setup();
  const combination = {
    altKey: true,
    shiftKey: true,
    code: 'KeyS',
    key: 'S',
    cancelable: true,
  };
  const down = new KeyboardEvent('keydown', combination);
  canvas.dispatchEvent(down);
  expect(down.defaultPrevented).toBe(true);
  expect(sent[0].keyEvent).toMatchObject({
    chr: 115,
    down: true,
    modifiers: [hbb.ControlKey.Alt, hbb.ControlKey.Shift],
  });
  canvas.dispatchEvent(
    new KeyboardEvent('keydown', { ...combination, key: 'Dead', repeat: true }),
  );
  canvas.dispatchEvent(
    new KeyboardEvent('keyup', { ...combination, key: 's', shiftKey: false }),
  );
  expect(sent.map((value) => value.keyEvent?.chr)).toEqual([115, 115, 115]);
  expect(sent[2].keyEvent).toMatchObject({
    down: false,
    modifiers: [hbb.ControlKey.Alt],
  });
  canvas.dispatchEvent(
    new KeyboardEvent('keydown', { ...combination, key: 'Process' }),
  );
  expect(sent.at(-1)?.keyEvent?.chr).toBe(115);
});
test('收起工具菜单后进入画面恢复焦点，打开菜单和编辑字段时保留焦点', () => {
  const { canvas } = setup();
  const toolbar = document.createElement('div');
  toolbar.setAttribute('data-session-toolbar', '');
  toolbar.setAttribute('data-tool-open', 'true');
  const button = document.createElement('button');
  toolbar.append(button);
  document.body.append(toolbar);
  button.focus();
  canvas.dispatchEvent(new Event('pointerenter'));
  expect(document.activeElement).toBe(button);
  toolbar.setAttribute('data-tool-open', 'false');
  canvas.dispatchEvent(new Event('pointerenter'));
  expect(document.activeElement).toBe(canvas);
  const path = document.createElement('input');
  toolbar.append(path);
  path.focus();
  canvas.dispatchEvent(new Event('pointerenter'));
  expect(document.activeElement).toBe(path);
});
test('AltGraph字符保留原文字，不当成Ctrl+Alt英文字母快捷键', () => {
  const { canvas, sent } = setup();
  const event = new KeyboardEvent('keydown', {
    key: 'ß',
    code: 'KeyS',
    altKey: true,
    ctrlKey: true,
  });
  Object.defineProperty(event, 'getModifierState', {
    value: (name: string) => name === 'AltGraph',
  });
  canvas.dispatchEvent(event);
  expect(sent[0].keyEvent?.chr).toBe('ß'.codePointAt(0));
});
test('Ctrl/Cmd+V 和 Shift+Insert 保留浏览器粘贴事件，先释放远端修饰键', () => {
  for (const shortcut of [
    { code: 'KeyV', key: 'v', ctrlKey: true },
    { code: 'KeyV', key: 'v', metaKey: true },
    { code: 'Insert', key: 'Insert', shiftKey: true },
  ]) {
    const { canvas, sent } = setup('MacIntel');
    canvas.dispatchEvent(
      new KeyboardEvent('keydown', {
        code: 'ControlLeft',
        key: 'Control',
        ctrlKey: true,
      }),
    );
    const event = new KeyboardEvent('keydown', {
      ...shortcut,
      cancelable: true,
    });
    canvas.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(sent).toHaveLength(2);
    expect(sent[1].keyEvent).toMatchObject({
      controlKey: hbb.ControlKey.Control,
      down: false,
    });
    canvas.dispatchEvent(new KeyboardEvent('keyup', shortcut));
    expect(sent).toHaveLength(2);
  }
});
afterEach(() => {
  for (const handler of handlers) handler.dispose();
  handlers.length = 0;
  document.body.replaceChildren();
});
function setup(platform = 'Win32') {
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
    undefined,
    platform,
  );
  handlers.push(handler);
  return { canvas, sent, handler };
}
test('Windows Win+V完整发送Meta与V，并按原身份释放；不落入本机粘贴分支', () => {
  const { canvas, sent } = setup('Win32');
  for (const type of ['keydown', 'keyup']) {
    const sequence =
      type === 'keydown' ? ['MetaLeft', 'KeyV'] : ['KeyV', 'MetaLeft'];
    for (const code of sequence) {
      const event = new KeyboardEvent(type, {
        code,
        key: code === 'KeyV' ? 'v' : 'Meta',
        metaKey: code !== 'MetaLeft' || type === 'keydown',
        cancelable: true,
      });
      canvas.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
  }
  expect(sent.map((m) => m.keyEvent)).toMatchObject([
    { controlKey: hbb.ControlKey.Meta, down: true },
    { chr: 118, down: true, modifiers: [hbb.ControlKey.Meta] },
    { chr: 118, down: false, modifiers: [hbb.ControlKey.Meta] },
    { controlKey: hbb.ControlKey.Meta, down: false },
  ]);
});
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
