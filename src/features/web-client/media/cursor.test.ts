import { afterEach, expect, jest, test } from '@jest/globals';
import { CURSOR_LIMITS, cursorMetrics, RemoteCursor } from './cursor';

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});
test('初始快照和本地活动隐藏标记；远端移动短时显示，同坐标不续期，清理销毁timer', () => {
  jest.useFakeTimers();
  const host = document.createElement('div'),
    canvas = document.createElement('canvas'),
    marker = document.createElement('div');
  host.append(canvas, marker);
  document.body.append(host);
  canvas.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 800, height: 600 }) as DOMRect;
  const renderer = new RemoteCursor(canvas, marker);
  try {
    renderer.configure(
      { x: 0, y: 0, width: 800, height: 600 },
      false,
      true,
      false,
    );
    renderer.move({ x: 20, y: 20 });
    expect(marker.style.display).toBe('none');
    renderer.move({ x: 30, y: 20 });
    expect(marker.style.display).toBe('block');
    jest.advanceTimersByTime(1000);
    renderer.move({ x: 30, y: 20 });
    jest.advanceTimersByTime(201);
    expect(marker.style.display).toBe('none');
    renderer.move({ x: 40, y: 20 });
    renderer.localActivity();
    expect(marker.style.display).toBe('none');
    renderer.move({ x: 50, y: 20 });
    renderer.clear();
    expect(jest.getTimerCount()).toBe(0);
    expect(marker.style.display).toBe('none');
  } finally {
    renderer.dispose();
    host.remove();
  }
});
test('非方形光标图像/热点同比例缩放，最小/最大输出有界', () => {
  expect(cursorMetrics(32, 48, 4, 8, 0.5)).toEqual({
    width: 16,
    height: 24,
    hotx: 2,
    hoty: 4,
  });
  expect(cursorMetrics(32, 48, 4, 8, 2)).toEqual({
    width: 64,
    height: 96,
    hotx: 8,
    hoty: 16,
  });
  expect(cursorMetrics(32, 32, 31, 31, 100)?.width).toBe(CURSOR_LIMITS.output);
  expect(cursorMetrics(32, 32, 31, 31, 0.01)?.width).toBe(12);
  for (const value of [-1, 32, 1.5, NaN])
    expect(cursorMetrics(32, 32, value, 0, 1)).toBeUndefined();
});

test('页面隐藏、游标关闭或embedded清除位置和timer，恢复后的首个快照不冒作活动', () => {
  jest.useFakeTimers();
  const hidden = jest.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  const host = document.createElement('div'),
    canvas = document.createElement('canvas'),
    marker = document.createElement('div');
  host.append(canvas, marker);
  document.body.append(host);
  canvas.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 800, height: 600 }) as DOMRect;
  const renderer = new RemoteCursor(canvas, marker);
  const configure = (visible = true, embedded = false) =>
    renderer.configure(
      { x: 0, y: 0, width: 800, height: 600 },
      false,
      visible,
      embedded,
    );
  renderer.observe(true);
  try {
    configure();
    renderer.move({ x: 20, y: 20 });
    renderer.move({ x: 30, y: 20 });
    expect(marker.style.display).toBe('block');
    hidden.mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(marker.style.display).toBe('none');
    expect(jest.getTimerCount()).toBe(0);
    renderer.move({ x: 40, y: 20 });
    hidden.mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    renderer.move({ x: 50, y: 20 });
    expect(marker.style.display).toBe('none');
    renderer.move({ x: 60, y: 20 });
    expect(marker.style.display).toBe('block');
    for (const [visible, embedded] of [
      [false, false],
      [true, true],
    ]) {
      configure(visible, embedded);
      expect(marker.style.display).toBe('none');
      expect(jest.getTimerCount()).toBe(0);
      renderer.move({ x: 70, y: 20 });
      configure();
      renderer.move({ x: 80, y: 20 });
      expect(marker.style.display).toBe('none');
      renderer.move({ x: 90, y: 20 });
      expect(marker.style.display).toBe('block');
    }
    renderer.observe(false);
    expect(marker.style.display).toBe('none');
    expect(jest.getTimerCount()).toBe(0);
    renderer.observe(true);
    renderer.move({ x: 100, y: 20 });
    expect(marker.style.display).toBe('none');
    renderer.move({ x: 110, y: 20 });
    expect(marker.style.display).toBe('block');
    renderer.clear();
    expect(marker.style.display).toBe('none');
    expect(jest.getTimerCount()).toBe(0);
    renderer.move({ x: 120, y: 20 });
    expect(marker.style.display).toBe('none');
  } finally {
    renderer.dispose();
    host.remove();
  }
  hidden.mockReturnValue(true);
  document.dispatchEvent(new Event('visibilitychange'));
  expect(marker.style.display).toBe('none');
  expect(jest.getTimerCount()).toBe(0);
});

test('真实CSS画面比例更新当前ID和位置，原始像素保留，embedded和断开清理', () => {
  const host = document.createElement('div'),
    canvas = document.createElement('canvas'),
    marker = document.createElement('div');
  host.append(canvas, marker);
  document.body.append(host);
  let width = 400;
  jest
    .spyOn(canvas, 'getBoundingClientRect')
    .mockImplementation(
      () => ({ left: 0, top: 0, width, height: width * 0.75 }) as DOMRect,
    );
  jest
    .spyOn(host, 'getBoundingClientRect')
    .mockReturnValue({ left: 0, top: 0 } as DOMRect);
  const put = jest.fn(),
    draw = jest.fn();
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    putImageData: put,
    drawImage: draw,
  } as unknown as CanvasRenderingContext2D);
  jest
    .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
    .mockImplementation(function (this: HTMLCanvasElement) {
      return `data:image/png;base64,${this.width}x${this.height}`;
    });
  const originalImageData = globalThis.ImageData;
  Object.defineProperty(globalThis, 'ImageData', {
    configurable: true,
    value: class {
      constructor(
        readonly data: Uint8ClampedArray,
        readonly width: number,
        readonly height: number,
      ) {}
    },
  });
  const renderer = new RemoteCursor(canvas, marker);
  renderer.observe(true);
  try {
    renderer.configure(
      { x: 0, y: 0, width: 800, height: 600 },
      true,
      true,
      false,
    );
    const colors = new Uint8Array(32 * 32 * 4);
    colors[0] = 123;
    renderer.receive({
      id: '1',
      width: 32,
      height: 32,
      hotx: 4,
      hoty: 8,
      colors,
    });
    colors[0] = 0;
    expect(canvas.style.cursor).toContain('16x16');
    expect(canvas.style.cursor).toContain('2 4');
    renderer.move({ x: 399, y: 300 });
    expect(marker.style.display).toBe('none');
    renderer.move({ x: 400, y: 300 });
    expect(marker.style.left).toBe('198px');
    width = 1600;
    window.dispatchEvent(new Event('resize'));
    expect(marker.style.width).toBe('64px');
    expect(marker.style.left).toBe('792px');
    renderer.localActivity();
    expect(canvas.style.cursor).toContain('64x64');
    expect((put.mock.calls.at(-1)?.[0] as ImageData | undefined)?.data[0]).toBe(
      123,
    );
    const count = put.mock.calls.length;
    renderer.select('1');
    expect(put).toHaveBeenCalledTimes(count);
    renderer.configure(
      { x: 0, y: 0, width: 800, height: 600 },
      false,
      true,
      false,
    );
    expect(canvas.style.cursor).toContain('32x32');
    renderer.select('unknown');
    expect(canvas.style.cursor).toBe('default');
    renderer.select('1');
    renderer.configure(
      { x: 0, y: 0, width: 800, height: 600 },
      true,
      true,
      true,
    );
    expect(marker.style.display).toBe('none');
    expect(canvas.style.cursor).toBe('none');
    renderer.configure(
      { x: 0, y: 0, width: 800, height: 600 },
      true,
      true,
      false,
    );
    renderer.observe(false);
    expect(canvas.style.cursor).toContain('64x64');
    expect(canvas.style.cursor).toContain('8 16');
    renderer.observe(true);
    for (let index = 2; index <= 34; index++)
      renderer.receive({
        id: String(index),
        width: 32,
        height: 32,
        hotx: 0,
        hoty: 0,
        colors,
      });
    renderer.configure(
      { x: 0, y: 0, width: 800, height: 600 },
      true,
      true,
      false,
    );
    renderer.select('1');
    expect(canvas.style.cursor).toBe('default');
  } finally {
    renderer.dispose();
    host.remove();
    Object.defineProperty(globalThis, 'ImageData', {
      configurable: true,
      value: originalImageData,
    });
  }
  width = 400;
  window.dispatchEvent(new Event('resize'));
  expect(canvas.style.cursor).toBe('default');
});
