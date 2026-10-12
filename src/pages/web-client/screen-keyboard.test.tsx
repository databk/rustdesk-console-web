import '../../features/web-client/input/dom-test-encoding';
import { afterEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { hbb } from '@/features/web-client/protocol';
import { ScreenKeyboard } from './screen-keyboard';
afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});
const text = (_: string, fallback: string) => fallback;
test('独立键盘普通键/组合键走原生消息，关闭与撤权释放且不合成DOM快捷键', () => {
  const send = jest
    .fn<(input: { keyEvent: hbb.IKeyEvent }) => boolean>()
    .mockReturnValue(true);
  const close = jest.fn();
  const properties = {
    open: true,
    allowed: true,
    revision: '1:1',
    send,
    sendText: jest.fn(),
    onClose: close,
    text,
  };
  const view = render(<ScreenKeyboard {...properties} />);
  const domKeys = jest.fn();
  document.addEventListener('keydown', domKeys);
  fireEvent.click(screen.getByRole('button', { name: 'Send Left Ctrl key' }));
  fireEvent.click(screen.getByRole('button', { name: 'Send s key' }));
  expect(send).toHaveBeenLastCalledWith({
    keyEvent: {
      chr: 115,
      mode: hbb.KeyboardMode.Legacy,
      press: true,
      modifiers: [hbb.ControlKey.Control],
    },
  });
  expect(domKeys).not.toHaveBeenCalled();
  view.rerender(<ScreenKeyboard {...properties} allowed={false} />);
  expect(send).toHaveBeenLastCalledWith({
    keyEvent: {
      controlKey: hbb.ControlKey.Control,
      down: false,
      mode: hbb.KeyboardMode.Legacy,
    },
  });
  expect(
    (screen.getByRole('button', { name: 'Send s key' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  view.rerender(<ScreenKeyboard {...properties} />);
  const shift = screen.getByRole('button', { name: 'Send Left Shift key' });
  fireEvent.click(shift);
  const minimize = screen.getByRole('button', {
    name: 'Minimize screen keyboard',
  });
  minimize.focus();
  fireEvent.click(minimize);
  expect(close).toHaveBeenCalledWith(true);
  expect(send).toHaveBeenLastCalledWith({
    keyEvent: {
      controlKey: hbb.ControlKey.Shift,
      down: false,
      mode: hbb.KeyboardMode.Legacy,
    },
  });
  document.removeEventListener('keydown', domKeys);
});
test('只由打开动作聚焦，离开窗口释放；IME文字页独立发送并在新会话清草稿', () => {
  const send = jest
    .fn<(input: { keyEvent: hbb.IKeyEvent }) => boolean>()
    .mockReturnValue(true);
  const sendText = jest.fn();
  const properties = {
    open: true,
    allowed: true,
    revision: '1:1',
    send,
    sendText,
    onClose: () => {},
    text,
  };
  const view = render(<ScreenKeyboard {...properties} />);
  const field = document.createElement('input');
  document.body.append(field);
  field.focus();
  view.rerender(<ScreenKeyboard {...properties} revision="1:2" />);
  expect(document.activeElement).toBe(field);
  fireEvent.click(screen.getByRole('button', { name: 'Send Left Alt key' }));
  fireEvent.blur(screen.getByRole('button', { name: 'Send Left Alt key' }), {
    relatedTarget: field,
  });
  expect(send).toHaveBeenLastCalledWith({
    keyEvent: {
      controlKey: hbb.ControlKey.Alt,
      down: false,
      mode: hbb.KeyboardMode.Legacy,
    },
  });
  fireEvent.click(screen.getByRole('tab', { name: 'Text input' }));
  fireEvent.change(screen.getByLabelText('Keyboard text'), {
    target: { value: '中文输入' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send text' }));
  expect(sendText).toHaveBeenCalledWith('中文输入');
  fireEvent.change(screen.getByLabelText('Keyboard text'), {
    target: { value: 'old session draft' },
  });
  view.rerender(<ScreenKeyboard {...properties} revision="2:1" />);
  expect(
    (screen.getByLabelText('Keyboard text') as HTMLTextAreaElement).value,
  ).toBe('');
  field.remove();
});
