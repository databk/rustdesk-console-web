// Defensive allocation ceilings, not a claim of tested 8K compatibility.
export const DISPLAY_LIMITS = {
  count: 16,
  dimension: 8192,
  pixels: 7680 * 4320,
};

export function validFrameSize(width: number, height: number): boolean {
  return (
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    width > 0 &&
    height > 0 &&
    width <= DISPLAY_LIMITS.dimension &&
    height <= DISPLAY_LIMITS.dimension &&
    width * height <= DISPLAY_LIMITS.pixels
  );
}

export function validDisplay(
  display:
    | {
        width?: number | null;
        height?: number | null;
        x?: number | null;
        y?: number | null;
      }
    | undefined
    | null,
): boolean {
  if (!display || !validFrameSize(display.width ?? 0, display.height ?? 0))
    return false;
  const x = display.x ?? 0;
  const y = display.y ?? 0;
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= -2147483648 &&
    y >= -2147483648 &&
    x + (display.width ?? 0) <= 2147483647 &&
    y + (display.height ?? 0) <= 2147483647
  );
}
