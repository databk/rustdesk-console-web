import type { VideoFormat } from './video-codecs';

// AOM AV1 §5.3/5.5 的低开销 OBU 和序列头。只解析有界头部，不展开图像或保存码流。
const LIMITS = { obus: 64, headerBytes: 1024, lebBytes: 8 };
class Bits {
  private bit = 0;
  constructor(private data: Uint8Array) {}
  read(n: number): number {
    if (n < 0 || n > 32 || this.bit + n > this.data.length * 8)
      throw new Error('Truncated AV1 header');
    let value = 0;
    for (let i = 0; i < n; ++i, ++this.bit)
      value =
        value * 2 + ((this.data[this.bit >> 3] >> (7 - (this.bit & 7))) & 1);
    return value;
  }
  uvlc() {
    let leading = 0;
    while (!this.read(1))
      if (++leading >= 32) throw new Error('Invalid AV1 uvlc');
    this.read(leading);
  }
  trailing() {
    if (this.read(1) !== 1) throw new Error('Invalid AV1 trailing bit');
    while (this.bit < this.data.length * 8)
      if (this.read(1)) throw new Error('Invalid AV1 padding');
  }
}

function sequence(data: Uint8Array): { format: VideoFormat; reduced: boolean } {
  if (!data.length || data.length > LIMITS.headerBytes)
    throw new Error('AV1 sequence size');
  const b = new Bits(data);
  const profile = b.read(3);
  if (profile > 2) throw new Error('Reserved AV1 profile');
  const still = b.read(1),
    reduced = b.read(1);
  if (reduced && !still) throw new Error('Invalid AV1 still header');
  let level = 0,
    tier = 0;
  if (reduced) level = b.read(5);
  else {
    let model = 0,
      delayBits = 0;
    if (b.read(1)) {
      b.read(32);
      b.read(32);
      if (b.read(1)) b.uvlc();
      model = b.read(1);
      if (model) {
        delayBits = b.read(5) + 1;
        b.read(32);
        b.read(5);
        b.read(5);
      }
    }
    const initialDelay = b.read(1),
      operatingPoints = b.read(5) + 1;
    for (let i = 0; i < operatingPoints; ++i) {
      b.read(12);
      const opLevel = b.read(5),
        opTier = opLevel > 7 ? b.read(1) : 0;
      if (!i) {
        level = opLevel;
        tier = opTier;
      }
      if (model && b.read(1)) {
        b.read(delayBits);
        b.read(delayBits);
        b.read(1);
      }
      if (initialDelay && b.read(1)) b.read(4);
    }
  }
  const widthBits = b.read(4) + 1,
    heightBits = b.read(4) + 1;
  b.read(widthBits);
  b.read(heightBits);
  if (!reduced && b.read(1)) {
    b.read(4);
    b.read(3);
  }
  b.read(3); // superblock/filter-intra/intra-edge
  if (!reduced) {
    b.read(4); // interintra/masked/warped/dual-filter
    const orderHint = b.read(1);
    if (orderHint) b.read(2);
    const screenTools = b.read(1) ? 2 : b.read(1);
    if (screenTools > 0 && !b.read(1)) b.read(1);
    if (orderHint) b.read(3);
  }
  b.read(3); // superres/cdef/restoration
  const high = b.read(1),
    twelve = profile === 2 && high ? b.read(1) : 0;
  const bitDepth = twelve ? 12 : high ? 10 : 8;
  const monochrome = profile === 1 ? 0 : b.read(1);
  let cp = 2,
    tc = 2,
    mc = 2;
  if (b.read(1)) {
    cp = b.read(8);
    tc = b.read(8);
    mc = b.read(8);
  }
  let range = 0,
    x = 1,
    y = 1,
    position = 0;
  if (monochrome) range = b.read(1);
  else {
    if (cp === 1 && tc === 13 && mc === 0) {
      range = 1;
      x = 0;
      y = 0;
    } else {
      range = b.read(1);
      if (profile === 1) {
        x = 0;
        y = 0;
      } else if (profile === 2) {
        x = bitDepth === 12 ? b.read(1) : 1;
        y = bitDepth === 12 && x ? b.read(1) : 0;
      }
      if (x && y) position = b.read(2);
    }
    b.read(1); // separate_uv_delta_q
  }
  b.read(1); // film_grain_params_present
  b.trailing();
  // 本产品只协商8bit非单色profile0/1；保留高位深信息供资格判断明确拒绝。
  if (
    monochrome ||
    (profile === 0 && (!x || !y)) ||
    (profile === 1 && (x || y))
  )
    throw new Error('Unsupported AV1 color layout');
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    reduced: !!reduced,
    format: {
      codec: 'av1',
      profile,
      bitDepth,
      chroma: !x && !y ? '4:4:4' : x && y ? '4:2:0' : undefined,
      codecString: `av01.${profile}.${pad(level)}${tier ? 'H' : 'M'}.${pad(bitDepth)}.${monochrome}.${x}${y}${position}.${pad(cp)}.${pad(tc)}.${pad(mc)}.${range}`,
    },
  };
}

function* obus(data: Uint8Array) {
  let offset = 0;
  for (let count = 0; offset < data.length && count < LIMITS.obus; ++count) {
    const header = data[offset++];
    if (header & 0x81) throw new Error('Invalid AV1 OBU');
    const type = (header >> 3) & 15,
      extension = !!(header & 4);
    if (extension && (offset >= data.length || data[offset++] & 7))
      throw new Error('Invalid AV1 extension');
    let size = data.length - offset;
    if (header & 2) {
      size = 0;
      let done = false;
      for (let i = 0; i < LIMITS.lebBytes; ++i) {
        if (offset >= data.length) throw new Error('Truncated AV1 size');
        const byte = data[offset++];
        size += (byte & 127) * 2 ** (7 * i);
        if (!Number.isSafeInteger(size) || size > data.length)
          throw new Error('Invalid AV1 size');
        if (!(byte & 128)) {
          done = true;
          break;
        }
      }
      if (!done) throw new Error('AV1 size limit');
    }
    if (offset + size > data.length) throw new Error('Truncated AV1 OBU');
    yield { type, data: data.subarray(offset, offset + size) };
    offset += size;
  }
}

export function av1Format(data: Uint8Array): VideoFormat | undefined {
  try {
    for (const obu of obus(data)) {
      if (obu.type === 1) return sequence(obu.data).format;
      // 序列头必须出现在本次首个帧头之前，不扫描任意帧负载中的伪头。
      if (obu.type === 3 || obu.type === 6) return;
    }
  } catch {
    /* 无效头不发布实际色彩或配置。 */
  }
  return;
}

// Matroska V_AV1的SimpleBlock随机访问点必须同时含序列头与首个Frame OBU的KEY_FRAME。
// 只读帧头的有界前缀，不将原生key布尔直接当作容器内可独立解码证明。
export function av1RandomAccess(data: Uint8Array): VideoFormat | undefined {
  try {
    let info: ReturnType<typeof sequence> | undefined;
    for (const obu of obus(data)) {
      if (obu.type === 1) info = sequence(obu.data);
      else if (obu.type === 3) return;
      else if (obu.type === 6) {
        if (!info || !obu.data.length) return;
        if (!info.reduced) {
          const bits = new Bits(obu.data);
          if (bits.read(1) || bits.read(2) !== 0 || !bits.read(1)) return;
        }
        return info.format;
      }
    }
  } catch {
    /* 无法确认的单元不标为随机访问点。 */
  }
  return;
}

// Matroska V_AV1 的必需CodecPrivate，AV1-ISOBMFF §2.3。
// 序列头在首个key temporal unit内，av1C的configOBUs可空，不重复保存码流。
export function av1CodecPrivate(format: VideoFormat): Uint8Array | undefined {
  const match =
    /^av01\.([01])\.(\d{2})([MH])\.08\.0\.(000|11[0-3])\.\d{2}\.\d{2}\.\d{2}\.[01]$/.exec(
      format.codecString || '',
    );
  if (format.codec !== 'av1' || !match) return;
  const profile = Number(match[1]),
    level = Number(match[2]);
  if (level > 31 || (profile === 1) !== (match[4] === '000')) return;
  const chroma = match[4];
  return new Uint8Array([
    0x81,
    (profile << 5) | level,
    (match[3] === 'H' ? 0x80 : 0) |
      (Number(chroma[0]) << 3) |
      (Number(chroma[1]) << 2) |
      Number(chroma[2]),
    0,
  ]);
}
