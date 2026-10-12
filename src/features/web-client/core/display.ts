import type { hbb } from '../protocol';

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

export interface Resolution {
  width: number;
  height: number;
}
export interface DisplayOptions {
  display: number;
  identity: string;
  resolutions: Resolution[];
  originalResolution?: Resolution;
  supported: boolean;
}
export function resolutionList(values: hbb.IResolution[] | null | undefined) {
  const result: Resolution[] = [];
  const seen = new Set<string>();
  for (const value of (values || []).slice(0, 128)) {
    const width = value.width ?? 0,
      height = value.height ?? 0;
    const key = `${width}x${height}`;
    if (validFrameSize(width, height) && !seen.has(key)) {
      seen.add(key);
      result.push({ width, height });
    }
  }
  return result;
}
export function supportsResolution(platform: string, version: string) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+\s].*)?$/.exec(version);
  if (platform !== 'Windows' || !match) return false;
  const [major, minor, patch] = match.slice(1, 4).map(Number);
  return (
    major > 1 || (major === 1 && (minor > 2 || (minor === 2 && patch >= 4)))
  );
}

// 两层复用归属规则；列表只来自原生消息，页面不能提供模式或身份。
export class DisplayCatalog {
  private entries: DisplayOptions[] = [];
  private layout = '';
  private layoutRevision = 0;
  platform = '';
  version = '';
  updatePeer(peer: hbb.IPeerInfo) {
    if (peer.platform) this.platform = peer.platform;
    if (peer.version) this.version = peer.version;
    const layout = (peer.displays || [])
      .slice(0, DISPLAY_LIMITS.count)
      .map((item) => [item.name ?? '', item.x ?? 0, item.y ?? 0].join(':'))
      .join('|');
    if (layout !== this.layout) {
      this.layout = layout;
      ++this.layoutRevision;
    }
    this.entries = (peer.displays || [])
      .slice(0, DISPLAY_LIMITS.count)
      .map((item, index) => {
        const identity = item.name
          ? `named:${index}:${item.name}`
          : `anonymous:${index}:${this.layoutRevision}:${item.x ?? 0}:${item.y ?? 0}`;
        const previous = this.entries[index];
        const original = resolutionList(
          item.originalResolution ? [item.originalResolution] : [],
        )[0];
        return {
          display: index,
          identity,
          resolutions:
            previous?.identity === identity ? previous.resolutions : [],
          originalResolution: Object.hasOwn(item, 'originalResolution')
            ? original
            : previous?.identity === identity
              ? previous.originalResolution
              : undefined,
          supported: supportsResolution(this.platform, this.version),
        };
      });
    // 在 Worker 改写 currentDisplay 前应用原始 wire 归属。
    const entry = this.entries[peer.currentDisplay ?? 0];
    if (entry && Object.hasOwn(peer, 'resolutions'))
      entry.resolutions = resolutionList(peer.resolutions?.resolutions);
  }
  updateSwitch(value: hbb.ISwitchDisplay) {
    const entry = this.entries[value.display ?? -1];
    if (!entry) return;
    if (Object.hasOwn(value, 'resolutions'))
      entry.resolutions = resolutionList(value.resolutions?.resolutions);
    if (Object.hasOwn(value, 'originalResolution'))
      entry.originalResolution = resolutionList(
        value.originalResolution ? [value.originalResolution] : [],
      )[0];
  }
  get(index: number): DisplayOptions {
    const entry = this.entries[index];
    return entry
      ? {
          ...entry,
          resolutions: entry.resolutions.map((value) => ({ ...value })),
        }
      : { display: index, identity: '', resolutions: [], supported: false };
  }
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
