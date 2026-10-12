import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import React from 'react';
import { useToolWindow } from './use-tool-window';

let area = { width: 580, height: 180 };
let rectangle: { mockRestore(): void };
function Harness({
  open,
  centered = false,
  name = 'window',
}: {
  open: boolean;
  centered?: boolean;
  name?: string;
}) {
  const window = useToolWindow(
    open,
    { width: 540, height: 520 },
    { width: 340, height: 360 },
    true,
    centered ? 'center' : 'right',
  );
  return React.createElement(
    'div',
    { 'data-area': '' },
    React.createElement(
      'section',
      {
        ref: window.panel,
        style: window.style,
        ...window.events,
        hidden: !open,
        'data-testid': name,
      },
      React.createElement('button', {
        type: 'button',
        'aria-label': 'Move',
        ...window.control(),
      }),
      React.createElement('button', {
        type: 'button',
        'aria-label': 'Resize',
        ...window.control('se'),
      }),
    ),
  );
}
beforeEach(() => {
  area = { width: 580, height: 180 };
  rectangle = jest
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: HTMLElement) {
      const bounds = this.hasAttribute('data-area')
        ? area
        : { width: 0, height: 0 };
      return {
        ...bounds,
        left: 0,
        top: 0,
        right: bounds.width,
        bottom: bounds.height,
        x: 0,
        y: 0,
        toJSON() {},
      };
    });
});
afterEach(() => {
  cleanup();
  rectangle.mockRestore();
});

test('隐藏工具不从选择页初始化最小尺寸，首次实际打开采用批准的540×520', () => {
  const view = render(React.createElement(Harness, { open: false }));
  const panel = screen.getByTestId('window');
  expect(panel.style.width).toBe('');
  area = { width: 1440, height: 900 };
  view.rerender(React.createElement(Harness, { open: true }));
  expect(panel.style.width).toBe('540px');
  expect(panel.style.height).toBe('520px');
  expect(panel.style.top).toBe('96px');
});

test('收起时选择页/零区域变化不覆盖用户几何，重新打开保持大小且再约束边界', () => {
  area = { width: 1440, height: 900 };
  const view = render(React.createElement(Harness, { open: true }));
  const panel = screen.getByTestId('window');
  fireEvent.keyDown(screen.getByRole('button', { name: 'Resize' }), {
    key: 'ArrowRight',
  });
  fireEvent.keyDown(screen.getByRole('button', { name: 'Move' }), {
    key: 'ArrowLeft',
  });
  const previous = {
    width: panel.style.width,
    height: panel.style.height,
    left: panel.style.left,
    top: panel.style.top,
  };
  view.rerender(React.createElement(Harness, { open: false }));
  area = { width: 390, height: 180 };
  act(() => window.dispatchEvent(new Event('resize')));
  expect(panel.style.width).toBe(previous.width);
  expect(panel.style.height).toBe(previous.height);
  area = { width: 1440, height: 900 };
  view.rerender(React.createElement(Harness, { open: true }));
  expect(panel.style.width).toBe(previous.width);
  expect(panel.style.height).toBe(previous.height);
  expect(panel.style.left).toBe(previous.left);
  expect(panel.style.top).toBe(previous.top);
  area = { width: 390, height: 300 };
  act(() => window.dispatchEvent(new Event('resize')));
  expect(panel.style.width).toBe('374px');
  expect(panel.style.height).toBe('284px');
  expect(panel.style.left).toBe('8px');
  expect(panel.style.top).toBe('8px');
});

test('指定居中窗口只在首次打开居中，不覆盖用户之后的移动位置', () => {
  area = { width: 1440, height: 900 };
  const view = render(
    React.createElement(Harness, { open: true, centered: true }),
  );
  const panel = screen.getByTestId('window');
  expect(panel.style.left).toBe('450px');
  fireEvent.keyDown(screen.getByRole('button', { name: 'Move' }), {
    key: 'ArrowLeft',
  });
  expect(panel.style.left).toBe('440px');
  view.rerender(React.createElement(Harness, { open: false, centered: true }));
  view.rerender(React.createElement(Harness, { open: true, centered: true }));
  expect(panel.style.left).toBe('440px');
});

test('每次实际打开都先于工具栏置顶，并超越已打开工具；普通重渲染不改变层级', () => {
  area = { width: 1440, height: 900 };
  const windows = (first: boolean, second: boolean) =>
    React.createElement(
      React.Fragment,
      null,
      React.createElement(Harness, { name: 'first', open: first }),
      React.createElement(Harness, { name: 'second', open: second }),
    );
  const view = render(windows(false, false));
  const first = screen.getByTestId('first');
  const second = screen.getByTestId('second');
  view.rerender(windows(true, false));
  expect(Number(first.style.zIndex)).toBeGreaterThan(35);
  view.rerender(windows(true, true));
  expect(Number(second.style.zIndex)).toBeGreaterThan(
    Number(first.style.zIndex),
  );
  const secondLayer = second.style.zIndex;
  view.rerender(windows(true, true));
  expect(second.style.zIndex).toBe(secondLayer);
  view.rerender(windows(false, true));
  const hiddenLayer = first.style.zIndex;
  view.rerender(windows(false, true));
  expect(first.style.zIndex).toBe(hiddenLayer);
  view.rerender(windows(true, true));
  expect(Number(first.style.zIndex)).toBeGreaterThan(
    Number(second.style.zIndex),
  );
});
