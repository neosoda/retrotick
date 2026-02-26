import { buildBmpFile } from './pe';
import type { BmpFileResult } from './pe';

export function dibToTransparentBlob(dibData: Uint8Array): Promise<Blob | null> {
  const dv = new DataView(dibData.buffer, dibData.byteOffset, dibData.byteLength);
  const headerSize = dv.getUint32(0, true);
  let width: number, rawHeight: number, bitCount: number, numColors: number,
    colorTableEntrySize: number, compression: number;
  if (headerSize === 12) {
    width = dv.getUint16(4, true);
    rawHeight = dv.getInt16(6, true);
    bitCount = dv.getUint16(10, true);
    numColors = bitCount <= 8 ? (1 << bitCount) : 0;
    colorTableEntrySize = 3;
    compression = 0;
  } else {
    width = dv.getInt32(4, true);
    rawHeight = dv.getInt32(8, true);
    bitCount = dv.getUint16(14, true);
    compression = dv.getUint32(16, true);
    const biClrUsed = dv.getUint32(32, true);
    numColors = biClrUsed || (bitCount <= 8 ? (1 << bitCount) : 0);
    colorTableEntrySize = 4;
  }
  const height = Math.abs(rawHeight);
  const isBottomUp = rawHeight > 0;

  const palette: [number, number, number][] = [];
  let magentaIdx = -1;
  for (let i = 0; i < numColors; i++) {
    const off = headerSize + i * colorTableEntrySize;
    const b = dibData[off], g = dibData[off + 1], r = dibData[off + 2];
    palette.push([r, g, b]);
    if (r === 255 && g === 0 && b === 255) magentaIdx = i;
  }
  if (magentaIdx < 0) return Promise.resolve(null);

  const indices = new Uint8Array(width * height);
  const pixelDataStart = headerSize + numColors * colorTableEntrySize;

  if (compression === 2 && bitCount === 4) {
    let pos = pixelDataStart, x = 0, y = isBottomUp ? height - 1 : 0;
    while (pos < dibData.length) {
      const b0 = dibData[pos++], b1 = dibData[pos++];
      if (b0 > 0) {
        for (let i = 0; i < b0 && x < width; i++) {
          indices[y * width + x++] = (i & 1) === 0 ? (b1 >> 4) & 0x0F : b1 & 0x0F;
        }
      } else if (b1 === 0) {
        x = 0;
        y += isBottomUp ? -1 : 1;
      } else if (b1 === 1) {
        break;
      } else if (b1 === 2) {
        x += dibData[pos++];
        y += (isBottomUp ? -1 : 1) * dibData[pos++];
      } else {
        for (let i = 0; i < b1 && x < width; i++) {
          if ((i & 1) === 0) {
            indices[y * width + x++] = (dibData[pos] >> 4) & 0x0F;
          } else {
            indices[y * width + x++] = dibData[pos++] & 0x0F;
          }
        }
        if (b1 & 1) pos++;
        if (pos & 1) pos++;
      }
    }
  } else if (compression === 1 && bitCount === 8) {
    let pos = pixelDataStart, x = 0, y = isBottomUp ? height - 1 : 0;
    while (pos < dibData.length) {
      const b0 = dibData[pos++], b1 = dibData[pos++];
      if (b0 > 0) {
        for (let i = 0; i < b0 && x < width; i++) indices[y * width + x++] = b1;
      } else if (b1 === 0) {
        x = 0; y += isBottomUp ? -1 : 1;
      } else if (b1 === 1) {
        break;
      } else if (b1 === 2) {
        x += dibData[pos++];
        y += (isBottomUp ? -1 : 1) * dibData[pos++];
      } else {
        for (let i = 0; i < b1 && x < width; i++) indices[y * width + x++] = dibData[pos++];
        if (b1 & 1) pos++;
      }
    }
  } else if (compression === 0 && bitCount === 4) {
    const rowBytes = Math.ceil(width / 2);
    const paddedRow = (rowBytes + 3) & ~3;
    for (let y = 0; y < height; y++) {
      const srcY = isBottomUp ? (height - 1 - y) : y;
      const rowStart = pixelDataStart + srcY * paddedRow;
      for (let x = 0; x < width; x++) {
        const byteIdx = rowStart + (x >> 1);
        indices[y * width + x] = (x & 1) === 0 ? (dibData[byteIdx] >> 4) & 0x0F : dibData[byteIdx] & 0x0F;
      }
    }
  } else if (compression === 0 && bitCount === 8) {
    const paddedRow = (width + 3) & ~3;
    for (let y = 0; y < height; y++) {
      const srcY = isBottomUp ? (height - 1 - y) : y;
      const rowStart = pixelDataStart + srcY * paddedRow;
      for (let x = 0; x < width; x++) indices[y * width + x] = dibData[rowStart + x];
    }
  } else if (compression === 0 && bitCount === 1) {
    const rowBytes = Math.ceil(width / 8);
    const paddedRow = (rowBytes + 3) & ~3;
    for (let y = 0; y < height; y++) {
      const srcY = isBottomUp ? (height - 1 - y) : y;
      const rowStart = pixelDataStart + srcY * paddedRow;
      for (let x = 0; x < width; x++) {
        const byteIdx = rowStart + (x >> 3);
        indices[y * width + x] = (dibData[byteIdx] >> (7 - (x & 7))) & 1;
      }
    }
  } else {
    return Promise.resolve(null);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);
  const px = imgData.data;
  for (let i = 0; i < width * height; i++) {
    const idx = indices[i];
    const [r, g, b] = palette[idx] || [0, 0, 0];
    const off = i * 4;
    px[off] = r; px[off + 1] = g; px[off + 2] = b;
    px[off + 3] = idx === magentaIdx ? 0 : 255;
  }

  ctx.putImageData(imgData, 0, 0);
  return new Promise(resolve => canvas.toBlob(resolve as BlobCallback, 'image/png'));
}

export function parseBmpBlob(bmpData: Uint8Array): BmpFileResult & { dibData: Uint8Array | null } {
  const dv = new DataView(bmpData.buffer, bmpData.byteOffset, bmpData.byteLength);
  const dibData = bmpData.subarray(14);
  const dibDv = new DataView(dibData.buffer, dibData.byteOffset, dibData.byteLength);
  const headerSize = dibDv.getUint32(0, true);
  const w = headerSize === 12 ? dibDv.getUint16(4, true) : Math.abs(dibDv.getInt32(4, true));
  const h = headerSize === 12 ? dibDv.getUint16(6, true) : Math.abs(dibDv.getInt32(8, true));
  const bpp = headerSize === 12 ? dibDv.getUint16(10, true) : dibDv.getUint16(14, true);
  let magentaIndex = -1;
  const numColors = bpp <= 8 ? (headerSize >= 40 ? (dibDv.getUint32(32, true) || (1 << bpp)) : (1 << bpp)) : 0;
  const entrySize = headerSize === 12 ? 3 : 4;
  for (let i = 0; i < numColors; i++) {
    const off = headerSize + i * entrySize;
    if (off + 2 < dibData.length && dibData[off + 2] === 255 && dibData[off + 1] === 0 && dibData[off] === 255) {
      magentaIndex = i; break;
    }
  }
  return {
    blob: new Blob([bmpData as BlobPart], { type: 'image/bmp' }),
    width: w, height: h, bitCount: bpp, magentaIndex,
    dibData: magentaIndex >= 0 ? new Uint8Array(dibData) : null,
  };
}

export function parseDfmBitmap(binary: Uint8Array): (BmpFileResult & { dibData?: Uint8Array | null }) | null {
  if (!binary || binary.length < 2) return null;

  // Raw ICO file
  if (binary[0] === 0 && binary[1] === 0 && binary.length >= 6) {
    const type = binary[2] | (binary[3] << 8);
    if (type === 1) return { blob: new Blob([binary as BlobPart], { type: 'image/x-icon' }), width: 0, height: 0, bitCount: 0, magentaIndex: -1 };
    if (type === 2) return { blob: new Blob([binary as BlobPart], { type: 'image/x-icon' }), width: 0, height: 0, bitCount: 0, magentaIndex: -1 };
  }
  // Glyph.Data (Delphi 1): u32 size + complete BMP file
  if (binary.length >= 8) {
    const sz = binary[0] | (binary[1] << 8) | (binary[2] << 16) | ((binary[3] << 24) >>> 0);
    if (sz + 4 <= binary.length && binary[4] === 0x42 && binary[5] === 0x4D) {
      return parseBmpBlob(binary.subarray(4, 4 + sz));
    }
  }

  const classLen = binary[0];
  if (1 + classLen > binary.length) return null;
  const className = String.fromCharCode(...binary.slice(1, 1 + classLen));
  let offset = 1 + classLen;
  if (className === 'TBitmap') {
    if (offset + 4 > binary.length) return null;
    const size = binary[offset] | (binary[offset + 1] << 8) | (binary[offset + 2] << 16) | ((binary[offset + 3] << 24) >>> 0);
    offset += 4;
    const data = binary.subarray(offset, offset + size);
    if (data.length >= 14 && data[0] === 0x42 && data[1] === 0x4D) {
      return parseBmpBlob(data);
    }
    const result = buildBmpFile(data);
    return {
      ...result,
      dibData: result.magentaIndex >= 0 ? new Uint8Array(data) : null,
    };
  } else if (className === 'TJPEGImage') {
    return { blob: new Blob([binary.subarray(offset) as BlobPart], { type: 'image/jpeg' }), width: 0, height: 0, bitCount: 0, magentaIndex: -1 };
  } else if (className === 'TIcon') {
    return { blob: new Blob([binary.subarray(offset) as BlobPart], { type: 'image/x-icon' }), width: 0, height: 0, bitCount: 0, magentaIndex: -1 };
  } else if (className === 'TGIFImage') {
    return { blob: new Blob([binary.subarray(offset) as BlobPart], { type: 'image/gif' }), width: 0, height: 0, bitCount: 0, magentaIndex: -1 };
  } else if (className === 'TPngImage') {
    return { blob: new Blob([binary.subarray(offset) as BlobPart], { type: 'image/png' }), width: 0, height: 0, bitCount: 0, magentaIndex: -1 };
  }
  return null;
}
