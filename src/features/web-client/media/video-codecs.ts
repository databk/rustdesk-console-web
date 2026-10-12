import { hbb } from '../protocol';

export type VideoCodec = 'vp9' | 'vp8' | 'av1';
export type CodecPreference = VideoCodec | 'auto';
export interface VideoCapabilities {
  vp9: boolean;
  vp8: boolean;
  av1: boolean;
  vp9_444: boolean;
  av1_444: boolean;
}
export interface VideoFormat {
  codec: VideoCodec;
  chroma?: '4:2:0' | '4:4:4';
  profile?: number;
  bitDepth?: number;
  codecString?: string;
}
export const VIDEO_CONFIGS: Record<
  VideoCodec | 'vp9_444' | 'av1_444',
  VideoDecoderConfig
> = {
  vp9: { codec: 'vp09.00.10.08', optimizeForLatency: true },
  vp9_444: { codec: 'vp09.01.10.08.03', optimizeForLatency: true },
  vp8: { codec: 'vp8', optimizeForLatency: true },
  av1: { codec: 'av01.0.08M.08', optimizeForLatency: true },
  // AV1 可选字段必须全部提供；000 为 profile1 的 4:4:4，省略会默认 110。
  av1_444: {
    codec: 'av01.1.08M.08.0.000.01.01.01.0',
    optimizeForLatency: true,
  },
};
export async function videoCapabilities(): Promise<VideoCapabilities> {
  const result: VideoCapabilities = {
    vp9: false,
    vp8: false,
    av1: false,
    vp9_444: false,
    av1_444: false,
  };
  if (typeof VideoDecoder === 'undefined') return result;
  // 小型配置探测串行执行，不创建解码器或下载码流。
  for (const key of Object.keys(result) as (keyof VideoCapabilities)[]) {
    try {
      result[key] = !!(await VideoDecoder.isConfigSupported(VIDEO_CONFIGS[key]))
        .supported;
    } catch {
      /* 保留不支持 */
    }
  }
  return result;
}
export function supportsTrueColor(
  capabilities: VideoCapabilities,
  prefer: CodecPreference,
  encoding?: hbb.ISupportedEncoding,
): boolean {
  // VP9基础编码无独立标志；远端444按CodecAbility，不得捏造encoding.vp9。
  const vp9 =
    capabilities.vp9 &&
    capabilities.vp9_444 &&
    (!encoding || !!encoding.i444?.vp9);
  const av1 =
    capabilities.av1 &&
    capabilities.av1_444 &&
    (!encoding || (!!encoding.av1 && !!encoding.i444?.av1));
  return prefer === 'auto'
    ? vp9 || av1
    : prefer === 'vp9'
      ? vp9
      : prefer === 'av1'
        ? av1
        : false;
}

export function decoderConfig(
  format: VideoFormat,
  capabilities: VideoCapabilities,
): VideoDecoderConfig | undefined {
  if (
    !capabilities[format.codec] ||
    (format.bitDepth !== undefined && format.bitDepth !== 8)
  )
    return;
  if (format.codec === 'av1') {
    if (format.profile !== 0 && format.profile !== 1) return;
    if (format.profile === 1 && !capabilities.av1_444) return;
    // 只有实际序列头给出完整配置才开放AV1；不能把菜单偏好当profile。
    return format.codecString
      ? { codec: format.codecString, optimizeForLatency: true }
      : undefined;
  }
  if (format.codec === 'vp9' && format.profile === 1)
    return capabilities.vp9_444 ? VIDEO_CONFIGS.vp9_444 : undefined;
  return VIDEO_CONFIGS[format.codec];
}

export function decodingOptions(
  capabilities: VideoCapabilities,
  prefer: CodecPreference,
  trueColor: boolean,
): hbb.ISupportedDecoding {
  return {
    abilityVp9: capabilities.vp9 ? 1 : 0,
    abilityVp8: capabilities.vp8 ? 1 : 0,
    abilityAv1: capabilities.av1 ? 1 : 0,
    prefer: {
      auto: hbb.SupportedDecoding.PreferCodec.Auto,
      vp9: hbb.SupportedDecoding.PreferCodec.VP9,
      vp8: hbb.SupportedDecoding.PreferCodec.VP8,
      av1: hbb.SupportedDecoding.PreferCodec.AV1,
    }[prefer],
    i444: {
      vp9: capabilities.vp9 && capabilities.vp9_444,
      av1: capabilities.av1 && capabilities.av1_444,
    },
    preferChroma:
      trueColor && supportsTrueColor(capabilities, prefer)
        ? hbb.Chroma.I444
        : hbb.Chroma.I420,
  };
}
export function videoBatch(
  video: hbb.IVideoFrame,
): { codec: VideoCodec; batch: hbb.IEncodedVideoFrames } | undefined {
  if (video.vp9s) return { codec: 'vp9', batch: video.vp9s };
  if (video.vp8s) return { codec: 'vp8', batch: video.vp8s };
  if (video.av1s) return { codec: 'av1', batch: video.av1s };
  return undefined;
}
// VP9 无压缩头使用 MSB 位序。只从关键帧读取 profile/色度，不能把菜单偏好当作实际值。
export function vp9Format(data: Uint8Array): VideoFormat | undefined {
  let bit = 0;
  const read = (n: number) => {
    if (bit + n > data.length * 8) throw new Error('Truncated VP9 header');
    let value = 0;
    while (n--) {
      value = (value << 1) | ((data[bit >> 3] >> (7 - (bit & 7))) & 1);
      bit++;
    }
    return value;
  };
  try {
    if (read(2) !== 2) return;
    const profile = read(1) + read(1) * 2;
    if (profile === 3) read(1);
    if (read(1)) return;
    const nonKey = read(1);
    read(1);
    read(1);
    if (nonKey || read(24) !== 0x498342) return;
    if (profile >= 2) return; // 本轮只声明 8 位 profile0/1。
    const colorSpace = read(3);
    if (colorSpace === 7)
      return profile === 1
        ? { codec: 'vp9', profile, chroma: '4:4:4' }
        : undefined;
    read(1);
    if (profile === 1) {
      const x = read(1),
        y = read(1);
      read(1);
      return {
        codec: 'vp9',
        profile,
        chroma:
          x === 0 && y === 0
            ? '4:4:4'
            : x === 1 && y === 1
              ? '4:2:0'
              : undefined,
      };
    }
    return { codec: 'vp9', profile, chroma: '4:2:0' };
  } catch {
    return;
  }
}
