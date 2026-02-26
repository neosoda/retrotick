/** Decode a DIB (Device-Independent Bitmap) byte array into an OffscreenCanvas.
 *  Supports BITMAPCOREHEADER (12 bytes) and BITMAPINFOHEADER (40+ bytes),
 *  1/4/8/24/32 bpp uncompressed, plus RLE8 (compression=1) and RLE4 (compression=2).
 */
export function decodeDib(dibData: Uint8Array): {
  canvas: OffscreenCanvas;
  ctx: OffscreenCanvasRenderingContext2D;
  imageData: ImageData;
  width: number;
  height: number;
} {
  const dv = new DataView(dibData.buffer, dibData.byteOffset, dibData.byteLength);
  const headerSize = dv.getUint32(0, true);
  let width: number, height: number, bitCount: number, numColors: number;
  let colorTableEntrySize: number, compression: number;

  if (headerSize === 12) {
    width = dv.getUint16(4, true);
    height = dv.getUint16(6, true);
    bitCount = dv.getUint16(10, true);
    numColors = bitCount <= 8 ? (1 << bitCount) : 0;
    colorTableEntrySize = 3;
    compression = 0;
  } else {
    width = Math.abs(dv.getInt32(4, true));
    height = Math.abs(dv.getInt32(8, true));
    bitCount = dv.getUint16(14, true);
    compression = dv.getUint32(16, true);
    const biClrUsed = dv.getUint32(32, true);
    numColors = biClrUsed || (bitCount <= 8 ? (1 << bitCount) : 0);
    colorTableEntrySize = 4;
  }

  const rawHeight = headerSize === 12 ? dv.getUint16(6, true) : dv.getInt32(8, true);
  const isBottomUp = rawHeight > 0;

  // Build palette
  const palette: [number, number, number][] = [];
  for (let i = 0; i < numColors; i++) {
    const off = headerSize + i * colorTableEntrySize;
    const b = dibData[off], g = dibData[off + 1], r = dibData[off + 2];
    palette.push([r, g, b]);
  }

  const pixelDataStart = headerSize + numColors * colorTableEntrySize;

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const imgData = ctx.createImageData(width, height);
  const px = imgData.data;

  if (compression === 0 && bitCount === 8) {
    const paddedRow = (width + 3) & ~3;
    for (let y = 0; y < height; y++) {
      const srcY = isBottomUp ? (height - 1 - y) : y;
      const rowStart = pixelDataStart + srcY * paddedRow;
      for (let x = 0; x < width; x++) {
        const idx = dibData[rowStart + x];
        const [r, g, b] = palette[idx] || [0, 0, 0];
        const off = (y * width + x) * 4;
        px[off] = r; px[off + 1] = g; px[off + 2] = b; px[off + 3] = 255;
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
        const idx = (x & 1) === 0 ? (dibData[byteIdx] >> 4) & 0x0F : dibData[byteIdx] & 0x0F;
        const [r, g, b] = palette[idx] || [0, 0, 0];
        const off = (y * width + x) * 4;
        px[off] = r; px[off + 1] = g; px[off + 2] = b; px[off + 3] = 255;
      }
    }
  } else if (compression === 0 && bitCount === 1) {
    const rowBytes = Math.ceil(width / 8);
    const paddedRow = (rowBytes + 3) & ~3;
    for (let y = 0; y < height; y++) {
      const srcY = isBottomUp ? (height - 1 - y) : y;
      const rowStart = pixelDataStart + srcY * paddedRow;
      for (let x = 0; x < width; x++) {
        const byteIdx = rowStart + (x >> 3);
        const idx = (dibData[byteIdx] >> (7 - (x & 7))) & 1;
        const [r, g, b] = palette[idx] || [0, 0, 0];
        const off = (y * width + x) * 4;
        px[off] = r; px[off + 1] = g; px[off + 2] = b; px[off + 3] = 255;
      }
    }
  } else if (compression === 0 && bitCount === 24) {
    const paddedRow = (width * 3 + 3) & ~3;
    for (let y = 0; y < height; y++) {
      const srcY = isBottomUp ? (height - 1 - y) : y;
      const rowStart = pixelDataStart + srcY * paddedRow;
      for (let x = 0; x < width; x++) {
        const srcOff = rowStart + x * 3;
        const off = (y * width + x) * 4;
        px[off] = dibData[srcOff + 2];
        px[off + 1] = dibData[srcOff + 1];
        px[off + 2] = dibData[srcOff];
        px[off + 3] = 255;
      }
    }
  } else if (compression === 0 && bitCount === 32) {
    const paddedRow = width * 4;
    for (let y = 0; y < height; y++) {
      const srcY = isBottomUp ? (height - 1 - y) : y;
      const rowStart = pixelDataStart + srcY * paddedRow;
      for (let x = 0; x < width; x++) {
        const srcOff = rowStart + x * 4;
        const off = (y * width + x) * 4;
        px[off] = dibData[srcOff + 2];
        px[off + 1] = dibData[srcOff + 1];
        px[off + 2] = dibData[srcOff];
        px[off + 3] = 255;
      }
    }
  } else if (compression === 1 && bitCount === 8) {
    // RLE8
    let pos = pixelDataStart, x = 0, y = isBottomUp ? height - 1 : 0;
    while (pos < dibData.length) {
      const b0 = dibData[pos++], b1 = dibData[pos++];
      if (b0 > 0) {
        for (let i = 0; i < b0 && x < width; i++) {
          const [r, g, b] = palette[b1] || [0, 0, 0];
          const off = (y * width + x++) * 4;
          px[off] = r; px[off + 1] = g; px[off + 2] = b; px[off + 3] = 255;
        }
      } else if (b1 === 0) { x = 0; y += isBottomUp ? -1 : 1; }
      else if (b1 === 1) break;
      else if (b1 === 2) { x += dibData[pos++]; y += (isBottomUp ? -1 : 1) * dibData[pos++]; }
      else {
        for (let i = 0; i < b1 && x < width; i++) {
          const [r, g, b] = palette[dibData[pos++]] || [0, 0, 0];
          const off = (y * width + x++) * 4;
          px[off] = r; px[off + 1] = g; px[off + 2] = b; px[off + 3] = 255;
        }
        if (b1 & 1) pos++;
      }
    }
  } else if (compression === 2 && bitCount === 4) {
    // RLE4
    let pos = pixelDataStart, x = 0, y = isBottomUp ? height - 1 : 0;
    while (pos < dibData.length) {
      const b0 = dibData[pos++], b1 = dibData[pos++];
      if (b0 > 0) {
        for (let i = 0; i < b0 && x < width; i++) {
          const idx = (i & 1) === 0 ? (b1 >> 4) & 0x0F : b1 & 0x0F;
          const [r, g, b] = palette[idx] || [0, 0, 0];
          const off = (y * width + x++) * 4;
          px[off] = r; px[off + 1] = g; px[off + 2] = b; px[off + 3] = 255;
        }
      } else if (b1 === 0) { x = 0; y += isBottomUp ? -1 : 1; }
      else if (b1 === 1) break;
      else if (b1 === 2) { x += dibData[pos++]; y += (isBottomUp ? -1 : 1) * dibData[pos++]; }
      else {
        for (let i = 0; i < b1 && x < width; i++) {
          let idx: number;
          if ((i & 1) === 0) idx = (dibData[pos] >> 4) & 0x0F;
          else idx = dibData[pos++] & 0x0F;
          const [r, g, b] = palette[idx] || [0, 0, 0];
          const off = (y * width + x++) * 4;
          px[off] = r; px[off + 1] = g; px[off + 2] = b; px[off + 3] = 255;
        }
        if (b1 & 1) pos++;
        if (pos & 1) pos++;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  return { canvas, ctx, imageData: imgData, width, height };
}
