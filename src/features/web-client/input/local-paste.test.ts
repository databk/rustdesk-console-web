/** @jest-environment jsdom */
import { expect, test } from '@jest/globals';
import { isLocalPasteShortcut } from './local-paste';

test.each(['Win32', 'Linux x86_64', 'MacIntel'])(
  'Ctrl+V和Shift+Insert在%s保留本机粘贴',
  (platform) => {
    for (const keys of [
      { code: 'KeyV', ctrlKey: true },
      { code: 'Insert', shiftKey: true },
    ])
      expect(
        isLocalPasteShortcut(new KeyboardEvent('keydown', keys), platform),
      ).toBe(true);
  },
);
test.each([
  ['Win32', false],
  ['Linux x86_64', false],
  ['MacIntel', true],
  ['macOS', true],
  ['iPad', true],
])('Meta+V依本机平台%s区分而非远端系统', (platform, expected) => {
  expect(
    isLocalPasteShortcut(
      new KeyboardEvent('keydown', { code: 'KeyV', metaKey: true }),
      platform as string,
    ),
  ).toBe(expected);
});
test('AltGraph及混合修饰键不误作浏览器粘贴', () => {
  const event = new KeyboardEvent('keydown', { code: 'KeyV', ctrlKey: true });
  Object.defineProperty(event, 'getModifierState', {
    value: (name: string) => name === 'AltGraph',
  });
  expect(isLocalPasteShortcut(event, 'Win32')).toBe(false);
  expect(
    isLocalPasteShortcut(
      new KeyboardEvent('keydown', {
        code: 'KeyV',
        ctrlKey: true,
        metaKey: true,
      }),
      'MacIntel',
    ),
  ).toBe(false);
});
