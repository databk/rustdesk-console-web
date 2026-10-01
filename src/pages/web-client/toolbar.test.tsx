import { afterEach, expect, jest, test } from '@jest/globals';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import React from 'react';
import { SessionToolbar } from './toolbar';
const text = (_key: string, fallback: string) => fallback;
afterEach(() => {
  cleanup();
  jest.useRealTimers();
});
test('菜单初始收起；指针、焦点、打开下拉层或固定时不自动隐藏', () => {
  jest.useFakeTimers();
  const select = jest.fn();
  const view = render(
    <SessionToolbar
      text={text}
      onSelect={select}
      onFiles={() => {}}
      onDisconnect={() => {}}
      onFullscreen={() => {}}
      fullscreen={false}
      connected
      busy={false}
      audio={false}
    >
      <span>content</span>
    </SessionToolbar>,
  );
  const root = document.querySelector('[data-session-toolbar]');
  if (!root) throw new Error('Missing toolbar');
  expect(root.getAttribute('data-expanded')).toBe('false');
  fireEvent.pointerEnter(root);
  act(() => jest.advanceTimersByTime(2000));
  expect(root.getAttribute('data-expanded')).toBe('true');
  fireEvent.pointerLeave(root);
  act(() => jest.advanceTimersByTime(2000));
  expect(root.getAttribute('data-expanded')).toBe('false');
  fireEvent.click(screen.getByRole('button', { name: 'Show session menu' }));
  const display = screen.getByRole('button', { name: 'Display' });
  act(() => display.focus());
  fireEvent.pointerLeave(root);
  act(() => jest.advanceTimersByTime(2000));
  expect(root.getAttribute('data-expanded')).toBe('true');
  act(() => display.blur());
  act(() => jest.advanceTimersByTime(2000));
  expect(root.getAttribute('data-expanded')).toBe('false');
  view.rerender(
    <SessionToolbar
      text={text}
      tool="display"
      onSelect={select}
      onFiles={() => {}}
      onDisconnect={() => {}}
      onFullscreen={() => {}}
      fullscreen={false}
      connected
      busy={false}
      audio={false}
    >
      <span>content</span>
    </SessionToolbar>,
  );
  act(() => jest.advanceTimersByTime(2000));
  expect(root.getAttribute('data-expanded')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Pin menu' }));
  expect(screen.getByRole('button', { name: 'Unpin menu' })).toBeTruthy();
});
