/** @jest-environment jsdom */
import { expect, test } from '@jest/globals';
import { shouldGuideShortcut } from './shortcut-guide';

test.each([
  { code: 'KeyS', key: 'S', altKey: true, shiftKey: true },
  { code: 'KeyT', key: 't', ctrlKey: true },
  { code: 'KeyC', key: 'C', ctrlKey: true, shiftKey: true },
  { code: 'KeyX', key: 'X', metaKey: true, shiftKey: true },
  { code: 'F5', key: 'F5' },
  { code: 'F12', key: 'F12' },
  { code: 'MetaLeft', key: 'Meta', metaKey: true },
  { code: 'KeyV', key: 'v', metaKey: true },
])('通用快捷键%j可引导，不维护某个组合的拦截表', (keys) => {
  expect(shouldGuideShortcut(new KeyboardEvent('keydown', keys), 'Win32')).toBe(
    true,
  );
});
test.each([
  { code: 'KeyA', key: 'A', shiftKey: true },
  { code: 'ShiftLeft', key: 'Shift', shiftKey: true },
  { code: 'ControlLeft', key: 'Control', ctrlKey: true },
  { code: 'AltLeft', key: 'Alt', altKey: true },
  { code: 'KeyC', key: 'c', ctrlKey: true },
  { code: 'KeyX', key: 'x', ctrlKey: true },
  { code: 'KeyV', key: 'v', ctrlKey: true },
  { code: 'Insert', key: 'Insert', ctrlKey: true },
  { code: 'Insert', key: 'Insert', shiftKey: true },
  { code: 'Delete', key: 'Delete', shiftKey: true },
  { code: 'KeyT', key: 't', ctrlKey: true, repeat: true },
  { code: 'KeyT', key: 'Process', ctrlKey: true },
  { code: 'KeyT', key: 'Dead', altKey: true },
  { code: 'KeyT', key: 't', ctrlKey: true, isComposing: true },
])('普通文字、修饰键、复制剪切粘贴及IME不被引导打断：%j', (keys) => {
  expect(shouldGuideShortcut(new KeyboardEvent('keydown', keys), 'Win32')).toBe(
    false,
  );
});
test('macOS命令修饰键和普通剪贴板组合保留，但其它命令组合仍引导', () => {
  for (const code of ['MetaLeft', 'KeyC', 'KeyX', 'KeyV'])
    expect(
      shouldGuideShortcut(
        new KeyboardEvent('keydown', { code, key: 'Meta', metaKey: true }),
        'MacIntel',
      ),
    ).toBe(false);
  expect(
    shouldGuideShortcut(
      new KeyboardEvent('keydown', {
        code: 'KeyC',
        key: 'C',
        metaKey: true,
        shiftKey: true,
      }),
      'MacIntel',
    ),
  ).toBe(true);
  expect(
    shouldGuideShortcut(
      new KeyboardEvent('keydown', { code: 'KeyT', key: 't', metaKey: true }),
      'MacIntel',
    ),
  ).toBe(true);
  expect(
    shouldGuideShortcut(
      new KeyboardEvent('keydown', {
        code: 'MetaRight',
        key: 'Meta',
        metaKey: true,
      }),
      'Linux x86_64',
    ),
  ).toBe(true);
});
test('AltGraph字符不作为Ctrl+Alt热键引导', () => {
  const event = new KeyboardEvent('keydown', {
    code: 'KeyS',
    key: 'ß',
    ctrlKey: true,
    altKey: true,
  });
  Object.defineProperty(event, 'getModifierState', {
    value: (name: string) => name === 'AltGraph',
  });
  expect(shouldGuideShortcut(event, 'Win32')).toBe(false);
  expect(
    shouldGuideShortcut(
      new KeyboardEvent('keydown', {
        code: 'AltRight',
        key: 'AltGraph',
        ctrlKey: true,
        altKey: true,
      }),
      'Win32',
    ),
  ).toBe(false);
});
