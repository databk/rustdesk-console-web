import type { hbb } from '../protocol';
import { type RemoteDisplay, remotePoint } from './input';

export type TouchMode = 'pointer' | 'scroll' | 'zoom';
export interface Viewport {
  scale: number;
  x: number;
  y: number;
}
interface Point {
  x: number;
  y: number;
}
export class RemoteTouch {
  private points = new Map<number, Point>();
  private origin?: Point;
  private last?: Point;
  private dragging = false;
  private suppressClick = false;
  private distance = 0;
  private midpoint?: Point;
  private hold?: ReturnType<typeof setTimeout>;
  private abort = new AbortController();
  constructor(
    private canvas: HTMLCanvasElement,
    private display: RemoteDisplay,
    private send: (input: { mouseEvent: hbb.IMouseEvent }) => void,
    private mode: TouchMode,
    private viewport: Viewport,
    private changed: (viewport: Viewport) => void,
  ) {
    const options = { signal: this.abort.signal, passive: false };
    canvas.addEventListener('pointerdown', this.down, options);
    canvas.addEventListener('pointermove', this.move, options);
    canvas.addEventListener('pointerup', this.up, options);
    canvas.addEventListener('pointercancel', this.cancel, options);
    canvas.addEventListener('lostpointercapture', this.cancel, options);
    window.addEventListener('blur', this.cancel, options);
    window.addEventListener('orientationchange', this.cancel, options);
    document.addEventListener('visibilitychange', this.visibility, options);
  }
  private visibility = () => {
    if (document.hidden) this.cancel();
  };
  private point(event: PointerEvent) {
    return { x: event.clientX, y: event.clientY };
  }
  private position(point: Point) {
    const remote = remotePoint(
      point.x,
      point.y,
      this.canvas.getBoundingClientRect(),
      this.display,
    );
    if (remote) this.send({ mouseEvent: { mask: 0, ...remote } });
  }
  private click(button = 1) {
    this.send({ mouseEvent: { mask: 1 | (button << 3) } });
    this.send({ mouseEvent: { mask: 2 | (button << 3) } });
  }
  private pair() {
    const [a, b] = [...this.points.values()];
    return {
      distance: Math.hypot(a.x - b.x, a.y - b.y),
      midpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  }
  private down = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') return;
    event.preventDefault();
    if (this.points.size >= 2) {
      this.cancel();
      return;
    }
    this.canvas.setPointerCapture(event.pointerId);
    const point = this.point(event);
    this.points.set(event.pointerId, point);
    if (this.points.size === 2) {
      clearTimeout(this.hold);
      this.releaseDrag();
      this.suppressClick = true;
      const pair = this.pair();
      this.distance = pair.distance;
      this.midpoint = pair.midpoint;
      return;
    }
    this.origin = this.last = point;
    this.suppressClick = false;
    if (this.mode === 'pointer') {
      this.position(point);
      this.hold = setTimeout(() => {
        if (this.points.size === 1 && !this.dragging && !this.suppressClick) {
          this.click(2);
          this.suppressClick = true;
        }
      }, 500);
    }
  };
  private move = (event: PointerEvent) => {
    if (!this.points.has(event.pointerId)) return;
    event.preventDefault();
    const point = this.point(event);
    this.points.set(event.pointerId, point);
    if (this.points.size === 2) {
      const pair = this.pair();
      const scale = Math.max(
        1,
        Math.min(
          3,
          this.viewport.scale *
            (this.distance > 0 ? pair.distance / this.distance : 1),
        ),
      );
      this.viewport = {
        scale,
        x:
          scale === 1
            ? 0
            : Math.max(
                -2000,
                Math.min(
                  2000,
                  this.viewport.x +
                    pair.midpoint.x -
                    (this.midpoint?.x ?? pair.midpoint.x),
                ),
              ),
        y:
          scale === 1
            ? 0
            : Math.max(
                -2000,
                Math.min(
                  2000,
                  this.viewport.y +
                    pair.midpoint.y -
                    (this.midpoint?.y ?? pair.midpoint.y),
                ),
              ),
      };
      this.distance = pair.distance;
      this.midpoint = pair.midpoint;
      this.changed(this.viewport);
      return;
    }
    if (this.suppressClick || !this.last || !this.origin) return;
    const dx = point.x - this.last.x;
    const dy = point.y - this.last.y;
    if (this.mode === 'zoom') {
      this.viewport = {
        ...this.viewport,
        x:
          this.viewport.scale === 1
            ? 0
            : Math.max(-2000, Math.min(2000, this.viewport.x + dx)),
        y:
          this.viewport.scale === 1
            ? 0
            : Math.max(-2000, Math.min(2000, this.viewport.y + dy)),
      };
      this.changed(this.viewport);
      this.last = point;
    } else if (this.mode === 'scroll') {
      if (Math.abs(dx) >= 24 || Math.abs(dy) >= 24) {
        this.send({
          mouseEvent: {
            mask: 3,
            x: Math.trunc(dx / 24),
            y: Math.trunc(dy / 24),
          },
        });
        this.last = point;
      }
    } else if (
      Math.hypot(point.x - this.origin.x, point.y - this.origin.y) > 6 ||
      this.dragging
    ) {
      clearTimeout(this.hold);
      if (!this.dragging) {
        this.dragging = true;
        this.send({ mouseEvent: { mask: 9 } });
      }
      this.position(point);
      this.last = point;
    }
  };
  private up = (event: PointerEvent) => {
    if (!this.points.has(event.pointerId)) return;
    event.preventDefault();
    clearTimeout(this.hold);
    if (
      this.points.size === 1 &&
      !this.suppressClick &&
      this.mode === 'pointer'
    ) {
      if (this.dragging) this.releaseDrag();
      else {
        this.position(this.point(event));
        this.click();
      }
    }
    this.points.delete(event.pointerId);
    if (!this.points.size) {
      this.origin = this.last = undefined;
      this.suppressClick = false;
    }
  };
  private releaseDrag() {
    if (this.dragging) this.send({ mouseEvent: { mask: 10 } });
    this.dragging = false;
  }
  setViewport(viewport: Viewport) {
    this.cancel();
    this.viewport = viewport;
  }
  cancel = () => {
    clearTimeout(this.hold);
    this.releaseDrag();
    this.points.clear();
    this.origin = this.last = undefined;
    this.suppressClick = true;
  };
  dispose() {
    this.cancel();
    this.abort.abort();
  }
}
