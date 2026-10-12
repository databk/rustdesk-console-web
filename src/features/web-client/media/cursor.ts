import type { RemoteDisplay } from '../input/input';
import type { hbb } from '../protocol';

export const CURSOR_LIMITS = {
  count: 32,
  source: 256,
  output: 128,
  minimum: 12,
};
export type CursorShape = Omit<hbb.ICursorData, 'id'> & {
  id: string;
  colors: Uint8Array;
};
export function cursorMetrics(
  width: number,
  height: number,
  hotx: number,
  hoty: number,
  scale: number,
  minimum = true,
) {
  if (
    ![width, height, hotx, hoty].every(Number.isInteger) ||
    width <= 0 ||
    height <= 0 ||
    width > CURSOR_LIMITS.source ||
    height > CURSOR_LIMITS.source ||
    hotx < 0 ||
    hoty < 0 ||
    hotx >= width ||
    hoty >= height ||
    !Number.isFinite(scale) ||
    scale <= 0
  )
    return undefined;
  const ratio = Math.min(
    CURSOR_LIMITS.output / Math.max(width, height),
    Math.max(
      scale,
      minimum ? CURSOR_LIMITS.minimum / Math.min(width, height) : 0,
    ),
  );
  const w = Math.max(1, Math.round(width * ratio)),
    h = Math.max(1, Math.round(height * ratio));
  return {
    width: w,
    height: h,
    hotx: Math.min(w - 1, Math.round(hotx * ratio)),
    hoty: Math.min(h - 1, Math.round(hoty * ratio)),
  };
}

// 只缓存原始像素，当前形状重新采样；布局变化不累计重采样误差。
export class RemoteCursor {
  private shapes = new Map<string, CursorShape>();
  private current = '';
  private geometry?: RemoteDisplay;
  private embedded = false;
  private zoom = false;
  private visible = true;
  private position?: hbb.ICursorPosition;
  private remoteMoving = false;
  private movementTimer: ReturnType<typeof setTimeout> | undefined;
  private rendered?: {
    key: string;
    url: string;
    metrics: NonNullable<ReturnType<typeof cursorMetrics>>;
  };
  private observer: ResizeObserver;
  private observing = false;
  constructor(
    private canvas: HTMLCanvasElement,
    private marker: HTMLElement,
  ) {
    this.observer = new ResizeObserver(this.update);
  }
  observe(active: boolean) {
    if (active === this.observing) return;
    this.observing = active;
    if (!active) {
      this.position = undefined;
      this.localActivity();
      this.observer.disconnect();
      window.removeEventListener('resize', this.update);
      window.removeEventListener('orientationchange', this.update);
      window.removeEventListener('scroll', this.update, true);
      document.removeEventListener('fullscreenchange', this.update);
      document.removeEventListener('visibilitychange', this.visibility);
      return;
    }
    this.observer.observe(this.canvas);
    if (this.canvas.parentElement)
      this.observer.observe(this.canvas.parentElement);
    window.addEventListener('resize', this.update);
    window.addEventListener('orientationchange', this.update);
    window.addEventListener('scroll', this.update, true);
    document.addEventListener('fullscreenchange', this.update);
    document.addEventListener('visibilitychange', this.visibility);
    this.visibility();
  }
  private visibility = () => {
    if (!document.hidden) return;
    this.position = undefined;
    this.localActivity();
  };
  configure(
    geometry: RemoteDisplay | undefined,
    zoom: boolean,
    visible: boolean,
    embedded: boolean,
  ) {
    if (
      !geometry ||
      !visible ||
      embedded ||
      (this.geometry &&
        ['x', 'y', 'width', 'height'].some(
          (key) =>
            this.geometry?.[key as keyof RemoteDisplay] !==
            geometry[key as keyof RemoteDisplay],
        ))
    ) {
      this.position = undefined;
      this.localActivity();
    }
    this.geometry = geometry;
    this.zoom = zoom;
    this.visible = visible;
    this.embedded = embedded;
    this.update();
  }
  receive(shape: CursorShape) {
    if (
      !cursorMetrics(
        shape.width ?? 0,
        shape.height ?? 0,
        shape.hotx ?? 0,
        shape.hoty ?? 0,
        1,
      ) ||
      shape.colors.length !== (shape.width ?? 0) * (shape.height ?? 0) * 4
    ) {
      this.select('');
      return;
    }
    this.shapes.delete(shape.id);
    const oldest = this.shapes.keys().next().value;
    if (this.shapes.size >= CURSOR_LIMITS.count && oldest !== undefined)
      this.shapes.delete(oldest);
    this.shapes.set(shape.id, {
      ...shape,
      colors: new Uint8Array(shape.colors),
    });
    this.rendered = undefined;
    this.select(shape.id);
  }
  select(id: string) {
    this.current = id;
    this.update();
  }
  move(position: hbb.ICursorPosition) {
    if (document.hidden || !this.visible || this.embedded) return;
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) return;
    const changed =
      this.position &&
      (position.x !== this.position.x || position.y !== this.position.y);
    this.position = { ...position };
    if (changed) {
      this.remoteMoving = true;
      clearTimeout(this.movementTimer);
      this.movementTimer = setTimeout(() => this.localActivity(), 1200);
    }
    this.update();
  }
  localActivity() {
    clearTimeout(this.movementTimer);
    this.movementTimer = undefined;
    this.remoteMoving = false;
    this.update();
  }
  update = () => {
    const geometry = this.geometry,
      rect = this.canvas.getBoundingClientRect();
    const shape = this.shapes.get(this.current);
    const scale =
      this.zoom && geometry && rect.width > 0 && rect.height > 0
        ? Math.min(rect.width / geometry.width, rect.height / geometry.height)
        : 1;
    const metrics =
      shape &&
      cursorMetrics(
        shape.width ?? 0,
        shape.height ?? 0,
        shape.hotx ?? 0,
        shape.hoty ?? 0,
        scale,
        this.zoom,
      );
    if (shape && metrics) {
      const key = `${this.current}/${metrics.width}/${metrics.height}/${metrics.hotx}/${metrics.hoty}`;
      if (this.rendered?.key !== key) {
        try {
          const source = document.createElement('canvas');
          source.width = shape.width ?? 0;
          source.height = shape.height ?? 0;
          const sourceContext = source.getContext('2d');
          if (!sourceContext) throw new Error('cursor');
          sourceContext.putImageData(
            new ImageData(
              new Uint8ClampedArray(shape.colors),
              source.width,
              source.height,
            ),
            0,
            0,
          );
          const output = document.createElement('canvas');
          output.width = metrics.width;
          output.height = metrics.height;
          const context = output.getContext('2d');
          if (!context) throw new Error('cursor');
          context.drawImage(source, 0, 0, metrics.width, metrics.height);
          this.rendered = { key, url: output.toDataURL(), metrics };
        } catch {
          this.rendered = undefined;
        }
      }
    } else this.rendered = undefined;
    const rendered = this.rendered;
    this.canvas.style.cursor =
      this.embedded || (this.remoteMoving && this.visible)
        ? 'none'
        : rendered
          ? `url(${rendered.url}) ${rendered.metrics.hotx} ${rendered.metrics.hoty}, default`
          : 'default';
    const host = this.canvas.parentElement;
    if (
      !geometry ||
      !this.position ||
      !this.remoteMoving ||
      !host ||
      !this.visible ||
      this.embedded
    ) {
      this.marker.style.display = 'none';
      return;
    }
    const x = ((this.position.x ?? 0) - geometry.x) / geometry.width,
      y = ((this.position.y ?? 0) - geometry.y) / geometry.height;
    this.marker.style.display =
      x >= 0 && x < 1 && y >= 0 && y < 1 ? 'block' : 'none';
    const hostRect = host.getBoundingClientRect();
    const size = Math.min(32, Math.max(4, 8 * scale));
    const width = rendered?.metrics.width ?? size,
      height = rendered?.metrics.height ?? size;
    this.marker.style.width = `${width}px`;
    this.marker.style.height = `${height}px`;
    this.marker.style.background = rendered
      ? `url(${rendered.url}) center / 100% 100% no-repeat`
      : '#fa541c';
    this.marker.style.border = rendered ? '0' : '1px solid white';
    this.marker.style.borderRadius = rendered ? '0' : '50%';
    this.marker.style.left = `${rect.left - hostRect.left + host.scrollLeft + x * rect.width - (rendered?.metrics.hotx ?? size / 2)}px`;
    this.marker.style.top = `${rect.top - hostRect.top + host.scrollTop + y * rect.height - (rendered?.metrics.hoty ?? size / 2)}px`;
  };
  clear() {
    clearTimeout(this.movementTimer);
    this.movementTimer = undefined;
    this.remoteMoving = false;
    this.shapes.clear();
    this.current = '';
    this.position = undefined;
    this.rendered = undefined;
    this.canvas.style.cursor = 'default';
    this.marker.style.display = 'none';
  }
  dispose() {
    this.clear();
    this.observe(false);
  }
}
