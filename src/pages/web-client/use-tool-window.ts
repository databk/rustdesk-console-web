import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  fitQualityBox,
  resizeQualityBox,
  type QualityBox,
  type QualityBounds,
  type QualityEdge,
} from './quality-geometry';

let topLayer = 40;
export const nextToolLayer = () => ++topLayer;
// 工具共享工作区边界算法；隐藏时保留位置和尺寸，不重挂会话资源。
export function useToolWindow(
  open: boolean,
  size: QualityBounds,
  minimum: QualityBounds,
  mobileFill = false,
  initialPlacement: 'right' | 'center' = 'right',
) {
  const panel = useRef<HTMLElement | null>(null);
  const current = useRef<QualityBox | undefined>(undefined);
  const [box, setBox] = useState<QualityBox>();
  const [layer, setLayer] = useState(40);
  const gesture = useRef<
    | {
        id: number;
        x: number;
        y: number;
        box: QualityBox;
        edge?: QualityEdge;
        target: HTMLButtonElement;
      }
    | undefined
  >(undefined);
  const activate = () => setLayer(nextToolLayer());
  const bounds = () => {
    const rect = panel.current?.parentElement?.getBoundingClientRect();
    return rect && rect.width > 0 && rect.height > 0 ? rect : undefined;
  };
  const update = (next: QualityBox) => {
    current.current = next;
    setBox(next);
  };
  const finish = useCallback(() => {
    const active = gesture.current;
    gesture.current = undefined;
    if (active?.target.hasPointerCapture?.(active.id))
      active.target.releasePointerCapture(active.id);
  }, []);
  useEffect(() => {
    if (open) setLayer(nextToolLayer());
  }, [open]);
  useEffect(() => {
    // 选择页的工作区尺寸不是工具实际可用区域；首次打开时才初始化。
    // 收起后保留用户几何，下一次打开再约束到当前全屏工作区。
    if (!open) {
      finish();
      return;
    }
    const fitWindow = () => {
      finish();
      const area = bounds();
      if (!area) return;
      const initial =
        current.current ??
        (mobileFill && area.width < 600
          ? { x: 12, y: 90, width: area.width - 24, height: area.height - 104 }
          : {
              x:
                initialPlacement === 'center'
                  ? (area.width - size.width) / 2
                  : area.width - size.width - 16,
              y: 96,
              ...size,
            });
      update(fitQualityBox(initial, area, minimum));
    };
    const visibility = () => {
      if (document.hidden) finish();
    };
    fitWindow();
    window.addEventListener('resize', fitWindow);
    window.addEventListener('blur', finish);
    document.addEventListener('fullscreenchange', fitWindow);
    document.addEventListener('visibilitychange', visibility);
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(fitWindow);
    if (panel.current?.parentElement)
      observer?.observe(panel.current.parentElement);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', fitWindow);
      window.removeEventListener('blur', finish);
      document.removeEventListener('fullscreenchange', fitWindow);
      document.removeEventListener('visibilitychange', visibility);
      finish();
    };
  }, [
    open,
    finish,
    size.width,
    size.height,
    minimum.width,
    minimum.height,
    mobileFill,
    initialPlacement,
  ]);
  const begin = (
    event: React.PointerEvent<HTMLButtonElement>,
    edge?: QualityEdge,
  ) => {
    if (event.button !== 0 || !current.current) return;
    event.preventDefault();
    event.stopPropagation();
    finish();
    activate();
    event.currentTarget.focus({ preventScroll: true });
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      box: current.current,
      edge,
      target: event.currentTarget,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const move = (event: React.PointerEvent) => {
    const active = gesture.current;
    const area = bounds();
    if (!active || event.pointerId !== active.id || !area) return;
    event.preventDefault();
    event.stopPropagation();
    const dx = event.clientX - active.x;
    const dy = event.clientY - active.y;
    update(
      active.edge
        ? resizeQualityBox(active.box, active.edge, dx, dy, area, minimum)
        : fitQualityBox(
            { ...active.box, x: active.box.x + dx, y: active.box.y + dy },
            area,
            minimum,
          ),
    );
  };
  const end = (event: React.PointerEvent) => {
    if (event.pointerId === gesture.current?.id) finish();
  };
  const keyboard = (event: React.KeyboardEvent, edge?: QualityEdge) => {
    const area = bounds();
    const active = current.current;
    if (
      !area ||
      !active ||
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    const step = event.shiftKey ? 1 : 10;
    const dx =
      event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
    const dy =
      event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
    update(
      edge
        ? resizeQualityBox(active, edge, dx, dy, area, minimum)
        : fitQualityBox(
            { ...active, x: active.x + dx, y: active.y + dy },
            area,
            minimum,
          ),
    );
  };
  const control = (edge?: QualityEdge) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) =>
      begin(event, edge),
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) =>
      keyboard(event, edge),
  });
  return {
    panel,
    style: {
      ...(box
        ? {
            left: box.x,
            top: box.y,
            width: box.width,
            height: box.height,
            right: 'auto',
            bottom: 'auto',
          }
        : {}),
      zIndex: layer,
    } as React.CSSProperties,
    control,
    events: {
      onPointerMove: move,
      onPointerUp: end,
      onPointerCancel: end,
      onLostPointerCapture: end,
      onPointerDown: (event: React.PointerEvent) => {
        event.stopPropagation();
        activate();
      },
      onFocus: activate,
      onWheel: (event: React.WheelEvent) => event.stopPropagation(),
    },
  };
}
