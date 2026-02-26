export interface AviInfo {
  width: number;
  height: number;
  bpp: number;
  compression: number;
  usPerFrame: number;
  palette: [number, number, number][];
  numColors: number;
  frames: Uint8Array[];
}

export function parseAviFrames(rawData: Uint8Array): AviInfo | null {
  const d = rawData;
  const dv = new DataView(d.buffer, d.byteOffset, d.byteLength);
  function tag(o: number) { return String.fromCharCode(d[o], d[o + 1], d[o + 2], d[o + 3]); }
  function u32(o: number) { return dv.getUint32(o, true); }
  function u16(o: number) { return dv.getUint16(o, true); }
  function i32(o: number) { return dv.getInt32(o, true); }
  if (tag(0) !== 'RIFF' || tag(8) !== 'AVI ') return null;

  let width = 0, height = 0, bpp = 0, compression = 0, usPerFrame = 100000;
  let palette: [number, number, number][] = [], numColors = 0;
  const frames: Uint8Array[] = [];

  function walk(start: number, end: number) {
    let pos = start;
    while (pos < end - 8) {
      const t = tag(pos), sz = u32(pos + 4);
      if (t === 'LIST') {
        walk(pos + 12, pos + 8 + sz);
      } else if (t === 'avih') {
        usPerFrame = u32(pos + 8);
      } else if (t === 'strf' && sz >= 40) {
        width = Math.abs(i32(pos + 12));
        height = Math.abs(i32(pos + 16));
        bpp = u16(pos + 22);
        compression = u32(pos + 24);
        const biClrUsed = u32(pos + 40);
        numColors = biClrUsed || (bpp <= 8 ? (1 << bpp) : 0);
        palette = [];
        for (let i = 0; i < numColors; i++) {
          const o = pos + 8 + 40 + i * 4;
          palette.push([d[o + 2], d[o + 1], d[o]]);
        }
      } else if (t === '00db' || t === '00dc') {
        frames.push(d.subarray(pos + 8, pos + 8 + sz));
      }
      pos += 8 + sz + (sz & 1);
    }
  }
  walk(12, 8 + u32(4));

  return { width, height, bpp, compression, usPerFrame, palette, numColors, frames };
}

export function renderAviFrame(
  ctx: CanvasRenderingContext2D,
  frameData: Uint8Array,
  avi: AviInfo,
  prevPixels: Uint8Array | null,
): Uint8Array {
  const { width, height, bpp, compression, palette } = avi;
  const pixels = prevPixels || new Uint8Array(width * height);

  if (compression === 0 && bpp === 8) {
    const paddedRow = (width + 3) & ~3;
    for (let y = 0; y < height; y++) {
      const srcY = height - 1 - y;
      const rowStart = srcY * paddedRow;
      for (let x = 0; x < width; x++) pixels[y * width + x] = frameData[rowStart + x];
    }
  } else if (compression === 1 && bpp === 8) {
    let pos = 0, x = 0, y = height - 1;
    while (pos < frameData.length) {
      const b0 = frameData[pos++], b1 = frameData[pos++];
      if (b0 > 0) {
        for (let i = 0; i < b0 && x < width; i++) pixels[y * width + x++] = b1;
      } else if (b1 === 0) {
        x = 0; y--;
      } else if (b1 === 1) {
        break;
      } else if (b1 === 2) {
        x += frameData[pos++]; y -= frameData[pos++];
      } else {
        for (let i = 0; i < b1 && x < width; i++) pixels[y * width + x++] = frameData[pos++];
        if (b1 & 1) pos++;
      }
    }
  } else if (compression === 0 && bpp === 4) {
    const rowBytes = Math.ceil(width / 2);
    const paddedRow = (rowBytes + 3) & ~3;
    for (let y = 0; y < height; y++) {
      const srcY = height - 1 - y;
      const rowStart = srcY * paddedRow;
      for (let x = 0; x < width; x++) {
        const byteIdx = rowStart + (x >> 1);
        pixels[y * width + x] = (x & 1) === 0 ? (frameData[byteIdx] >> 4) & 0x0F : frameData[byteIdx] & 0x0F;
      }
    }
  } else {
    return pixels;
  }

  const imgData = ctx.createImageData(width, height);
  const px = imgData.data;
  for (let i = 0; i < width * height; i++) {
    const [r, g, b] = palette[pixels[i]] || [0, 0, 0];
    const o = i * 4;
    px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  return pixels;
}
