export type QualityBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export type QualityBounds = { width: number; height: number };
export type QualityEdge = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
const margin = 8;
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
function limits(bounds: QualityBounds, minimum: QualityBounds) {
  const width = Math.max(0, bounds.width - margin * 2);
  const height = Math.max(0, bounds.height - margin * 2);
  return {
    width,
    height,
    minWidth: Math.min(minimum.width, width),
    minHeight: Math.min(minimum.height, height),
  };
}
// 短视口优先留在工作区内，内容由浮窗内部滚动；不扩大远控画面。
export function fitQualityBox(
  box: QualityBox,
  bounds: QualityBounds,
  minimum: QualityBounds = { width: 260, height: 244 },
): QualityBox {
  const limit = limits(bounds, minimum);
  const width = clamp(box.width, limit.minWidth, limit.width);
  const height = clamp(box.height, limit.minHeight, limit.height);
  return {
    width,
    height,
    x: clamp(box.x, margin, Math.max(margin, bounds.width - margin - width)),
    y: clamp(box.y, margin, Math.max(margin, bounds.height - margin - height)),
  };
}
export function resizeQualityBox(
  box: QualityBox,
  edge: QualityEdge,
  dx: number,
  dy: number,
  bounds: QualityBounds,
  minimum: QualityBounds = { width: 260, height: 244 },
): QualityBox {
  const original = fitQualityBox(box, bounds, minimum);
  const limit = limits(bounds, minimum);
  let left = original.x;
  let right = original.x + original.width;
  let top = original.y;
  let bottom = original.y + original.height;
  if (edge.includes('w'))
    left = clamp(left + dx, margin, right - limit.minWidth);
  if (edge.includes('e'))
    right = clamp(
      right + dx,
      left + limit.minWidth,
      Math.max(left, bounds.width - margin),
    );
  if (edge.includes('n'))
    top = clamp(top + dy, margin, bottom - limit.minHeight);
  if (edge.includes('s'))
    bottom = clamp(
      bottom + dy,
      top + limit.minHeight,
      Math.max(top, bounds.height - margin),
    );
  return fitQualityBox(
    { x: left, y: top, width: right - left, height: bottom - top },
    bounds,
    minimum,
  );
}
