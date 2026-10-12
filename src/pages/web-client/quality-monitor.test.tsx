/** @jest-environment jsdom */
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import { getWebClientSessionNetwork } from '@/services/rustdesk-console/webClient';
type WebClientSessionNetwork =
  import('@/services/rustdesk-console/webClient').WebClientSessionNetwork;
import { fitQualityBox, resizeQualityBox } from './quality-geometry';
type QualityEdge = import('./quality-geometry').QualityEdge;
import { QualityMonitor } from './quality-monitor';
import { unavailableTcp } from '@/services/rustdesk-console/tcpObservation';
jest.mock('@umijs/max', () => ({
  useIntl: () => ({
    formatMessage: ({
      id,
      defaultMessage,
    }: {
      id: string;
      defaultMessage?: string;
    }) =>
      jest.requireActual<{ default: Record<string, string> }>(
        '@/locales/en-US/serverNetwork',
      ).default[id] ||
      defaultMessage ||
      id,
  }),
}));
const guid = '00000000-0000-4000-8000-000000000001';
const reading = (algorithm = 'bbr'): WebClientSessionNetwork => ({
  api_version: 1,
  session_guid: guid,
  entry: {
    ...unavailableTcp('connection', 'source_unavailable'),
    status: 'identified',
    algorithm,
    reason: null,
  },
  relay: unavailableTcp('connection', 'namespace_unobservable'),
});

jest.mock('@/services/rustdesk-console/webClient', () => ({
  getWebClientSessionNetwork: jest.fn(),
}));
const getServerNetwork = jest.mocked(getWebClientSessionNetwork);
beforeEach(() => {
  getServerNetwork.mockReset().mockResolvedValue(reading());
});
function toggleDiagnostics(panel: HTMLElement, open: boolean) {
  const details = panel.querySelector('details');
  if (!details) throw new Error('Missing frame diagnostics');
  details.open = open;
  fireEvent(details, new Event('toggle'));
}
test('only expanded diagnostics reads the current session; entry and relay are independent', async () => {
  const { panel } = setup();
  expect(getServerNetwork).not.toHaveBeenCalled();
  toggleDiagnostics(panel, true);
  await screen.findByText('BBR');
  expect(getServerNetwork).toHaveBeenCalledWith(
    guid,
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  expect(screen.getByText('Entry sender')).toBeTruthy();
  expect(screen.getByText('Relay sender')).toBeTruthy();
  expect(screen.getByText('Unable to identify')).toBeTruthy();
  toggleDiagnostics(panel, false);
  getServerNetwork.mockResolvedValueOnce(reading('cubic'));
  toggleDiagnostics(panel, true);
  await screen.findByText('CUBIC');
  expect(getServerNetwork).toHaveBeenCalledTimes(2);
});
test('failed reads show unknown; closing diagnostics aborts and discards late replies', async () => {
  getServerNetwork.mockRejectedValueOnce(new Error('Unavailable'));
  const { panel } = setup();
  toggleDiagnostics(panel, true);
  await screen.findAllByText('Unable to identify');
  toggleDiagnostics(panel, false);
  let resolve: (value: WebClientSessionNetwork) => void = () => {};
  getServerNetwork.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  toggleDiagnostics(panel, true);
  await waitFor(() => expect(getServerNetwork).toHaveBeenCalledTimes(2));
  const signal = getServerNetwork.mock.calls[1][1]?.signal;
  toggleDiagnostics(panel, false);
  expect(signal?.aborted).toBe(true);
  await act(async () => resolve(reading()));
  expect(screen.queryByText('BBR')).toBeNull();
});
test('reconnecting discards old session results even when the old request ignores cancellation', async () => {
  let resolve: (value: WebClientSessionNetwork) => void = () => {};
  getServerNetwork.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const { panel, changeSession } = setup();
  toggleDiagnostics(panel, true);
  const signal = getServerNetwork.mock.calls[0][1]?.signal;
  getServerNetwork.mockResolvedValueOnce({
    ...reading('cubic'),
    session_guid: 'second',
  });
  changeSession('second');
  await screen.findByText('CUBIC');
  expect(signal?.aborted).toBe(true);
  await act(async () => resolve(reading()));
  expect(screen.queryByText('BBR')).toBeNull();
});
test('polling is infrequent, never overlaps, and stops when diagnostics closes', async () => {
  jest.useFakeTimers();
  try {
    let resolve: (value: WebClientSessionNetwork) => void = () => {};
    getServerNetwork.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const { panel } = setup();
    toggleDiagnostics(panel, true);
    await act(async () => {
      jest.advanceTimersByTime(90000);
    });
    expect(getServerNetwork).toHaveBeenCalledTimes(1);
    await act(async () => resolve(reading()));
    await act(async () => {
      jest.advanceTimersByTime(30000);
    });
    expect(getServerNetwork).toHaveBeenCalledTimes(2);
    toggleDiagnostics(panel, false);
    await act(async () => {
      jest.advanceTimersByTime(90000);
    });
    expect(getServerNetwork).toHaveBeenCalledTimes(2);
  } finally {
    jest.useRealTimers();
  }
});
test('a disconnected or unbound session never samples another session', async () => {
  const { panel } = setup(undefined, false);
  toggleDiagnostics(panel, true);
  expect(getServerNetwork).not.toHaveBeenCalled();
  expect(screen.getAllByText('Not connected')).toHaveLength(2);
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  jest.restoreAllMocks();
});
test('拖动、最小尺寸及短视口始终在工作区内，保留标题与关闭入口', () => {
  expect(
    fitQualityBox(
      { x: -100, y: 800, width: 80, height: 100 },
      { width: 1000, height: 700 },
    ),
  ).toEqual({ x: 8, y: 448, width: 260, height: 244 });
  expect(
    fitQualityBox(
      { x: 700, y: 700, width: 320, height: 300 },
      { width: 230, height: 180 },
    ),
  ).toEqual({ x: 8, y: 8, width: 214, height: 164 });
});
test('共享几何按调用者的真实最小尺寸约束聊天与键盘，窄屏优先可用区域', () => {
  expect(
    fitQualityBox(
      { x: 0, y: 0, width: 200, height: 200 },
      { width: 1000, height: 700 },
      { width: 340, height: 360 },
    ),
  ).toEqual({ x: 8, y: 8, width: 340, height: 360 });
  expect(
    fitQualityBox(
      { x: 0, y: 0, width: 880, height: 374 },
      { width: 390, height: 844 },
      { width: 680, height: 360 },
    ),
  ).toEqual({ x: 8, y: 8, width: 374, height: 374 });
});
test.each(['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as QualityEdge[])(
  '%s边缩放不越界且维持最小可读尺寸',
  (edge) => {
    for (const change of [-2000, 2000]) {
      const box = resizeQualityBox(
        { x: 100, y: 100, width: 320, height: 300 },
        edge,
        change,
        change,
        { width: 1000, height: 700 },
      );
      expect(box.x).toBeGreaterThanOrEqual(8);
      expect(box.y).toBeGreaterThanOrEqual(8);
      expect(box.width).toBeGreaterThanOrEqual(260);
      expect(box.height).toBeGreaterThanOrEqual(244);
      expect(box.x + box.width).toBeLessThanOrEqual(992);
      expect(box.y + box.height).toBeLessThanOrEqual(692);
    }
  },
);
function setup(sessionGuid: string | undefined = guid, ready = true) {
  let bounds = { width: 1000, height: 700 };
  const host = document.createElement('div');
  host.getBoundingClientRect = () =>
    ({ ...bounds, x: 30, y: 20, left: 30, top: 20 }) as DOMRect;
  const outer = document.createElement('div');
  outer.append(host);
  document.body.append(outer);
  const onClose = jest.fn();
  const props = {
    reading: { fps: 30, videoBitrate: 2_000_000, delay: 25 },
    ready,
    sessionGuid,
    display: { x: 0, y: 0, width: 1920, height: 1080 },
    format: { codec: 'vp8', chroma: '4:2:0' },
    text: (_: string, fallback: string) => fallback,
    onClose,
  };
  const view = render(React.createElement(QualityMonitor, props), {
    container: host,
  });
  const panel = screen.getByLabelText('Quality monitor');
  return {
    panel,
    changeSession: (nextGuid: string) =>
      view.rerender(
        React.createElement(QualityMonitor, {
          ...props,
          sessionGuid: nextGuid,
        }),
      ),
    onClose,
    unmount: cleanup,
    resize: (next: typeof bounds) => {
      bounds = next;
      fireEvent(window, new Event('resize'));
    },
  };
}
test('键盘移动与右下缩放，窗口改变后收回边界，背景滑块不降低文字透明度', () => {
  const { panel, resize, onClose } = setup();
  expect(panel.style.backgroundColor).toBe('rgba(24, 36, 51, 0.8)');
  expect(panel.style.opacity).toBe('');
  const title = screen.getByRole('button', { name: 'Move quality monitor' });
  fireEvent.keyDown(title, { key: 'ArrowLeft' });
  expect(panel.style.left).toBe('654px');
  const handle = panel.querySelector('[data-quality-resize="se"]');
  if (!handle) throw new Error('Missing resize handle');
  fireEvent.keyDown(handle, { key: 'ArrowLeft' });
  expect(panel.style.width).toBe('310px');
  fireEvent.click(screen.getByRole('button', { name: 'Monitor settings' }));
  const slider = screen.getByRole('slider', { name: 'Background opacity' });
  expect(slider.getAttribute('min')).toBe('35');
  expect(slider.getAttribute('max')).toBe('100');
  fireEvent.change(slider, { target: { value: '35' } });
  expect(screen.getByText('35%')).toBeTruthy();
  expect(panel.style.backgroundColor).toBe('rgba(24, 36, 51, 0.35)');
  expect(panel.style.opacity).toBe('');
  resize({ width: 230, height: 180 });
  expect(panel.style.left).toBe('8px');
  expect(panel.style.top).toBe('8px');
  expect(panel.style.width).toBe('214px');
  expect(panel.style.height).toBe('164px');
  fireEvent.click(
    screen.getByRole('button', { name: 'Close quality monitor' }),
  );
  expect(onClose).toHaveBeenCalledTimes(1);
});
test('拖动和缩放只处理浮窗，不把操作冒泡给远控；取消捕获后停止移动', () => {
  const original = window.PointerEvent;
  Object.defineProperty(window, 'PointerEvent', {
    configurable: true,
    value: MouseEvent,
  });
  try {
    const { panel } = setup();
    const title = screen.getByRole('button', { name: 'Move quality monitor' });
    const bubbled = jest.fn();
    panel.parentElement?.parentElement?.addEventListener(
      'pointermove',
      bubbled,
    );
    fireEvent.pointerDown(title, { button: 0, clientX: 700, clientY: 400 });
    fireEvent.pointerMove(title, { clientX: 600, clientY: 350 });
    expect(panel.style.left).toBe('564px');
    expect(panel.style.top).toBe('334px');
    expect(bubbled).not.toHaveBeenCalled();
    fireEvent.pointerCancel(title);
    fireEvent.pointerMove(title, { clientX: 500, clientY: 300 });
    expect(panel.style.left).toBe('564px');
    const northwest = panel.querySelector('[data-quality-resize="nw"]');
    if (!northwest) throw new Error('Missing northwest handle');
    fireEvent.pointerDown(northwest, {
      button: 0,
      clientX: 564,
      clientY: 334,
    });
    fireEvent.pointerMove(panel, { clientX: 554, clientY: 324 });
    expect(panel.style.width).toBe('330px');
    expect(panel.style.height).toBe('310px');
  } finally {
    Object.defineProperty(window, 'PointerEvent', {
      configurable: true,
      value: original,
    });
  }
});

test.each(['blur', 'hidden', 'fullscreen', 'resize', 'unmount'])(
  '拖动中%s显式释放捕获，迟到pointermove不再改变几何',
  (boundary) => {
    const original = window.PointerEvent;
    Object.defineProperty(window, 'PointerEvent', {
      configurable: true,
      value: MouseEvent,
    });
    try {
      const { panel, resize, unmount } = setup();
      const title = screen.getByRole('button', {
        name: 'Move quality monitor',
      });
      let captured = false;
      title.setPointerCapture = jest.fn(() => {
        captured = true;
      });
      title.hasPointerCapture = jest.fn(() => captured);
      title.releasePointerCapture = jest.fn(() => {
        captured = false;
      });
      fireEvent.pointerDown(title, { button: 0, clientX: 700, clientY: 400 });
      expect(document.activeElement).toBe(title);
      expect(captured).toBe(true);
      if (boundary === 'blur') fireEvent(window, new Event('blur'));
      if (boundary === 'hidden') {
        jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
        fireEvent(document, new Event('visibilitychange'));
      }
      if (boundary === 'fullscreen')
        fireEvent(document, new Event('fullscreenchange'));
      if (boundary === 'resize') resize({ width: 1000, height: 700 });
      if (boundary === 'unmount') unmount();
      expect(title.releasePointerCapture).toHaveBeenCalledTimes(1);
      expect(captured).toBe(false);
      fireEvent.pointerMove(title, { clientX: 600, clientY: 350 });
      expect(panel.style.left).toBe('664px');
      expect(panel.style.top).toBe('384px');
    } finally {
      Object.defineProperty(window, 'PointerEvent', {
        configurable: true,
        value: original,
      });
    }
  },
);
