import type { PEInfo, BitmapResult, BmpFileResult } from './types';
import { readUint16, readUint32, readInt32, rvaToFileOffset } from './read';

export function buildBmpFile(dibData: Uint8Array): BmpFileResult {
  const dibDv = new DataView(dibData.buffer, dibData.byteOffset, dibData.byteLength);
  const headerSize = readUint32(dibDv, 0);

  let width: number, height: number, bitCount: number, numColors: number,
    colorTableEntrySize: number, compression: number;

  if (headerSize === 12) {
    width = readUint16(dibDv, 4);
    height = readUint16(dibDv, 6);
    bitCount = readUint16(dibDv, 10);
    numColors = bitCount <= 8 ? (1 << bitCount) : 0;
    colorTableEntrySize = 3;
    compression = 0;
  } else {
    width = readInt32(dibDv, 4);
    height = readInt32(dibDv, 8);
    bitCount = readUint16(dibDv, 14);
    compression = readUint32(dibDv, 16);
    const biClrUsed = readUint32(dibDv, 32);
    numColors = biClrUsed || (bitCount <= 8 ? (1 << bitCount) : 0);
    colorTableEntrySize = 4;
  }

  const colorTableSize = numColors * colorTableEntrySize;
  const pixelDataStart = headerSize + colorTableSize;

  const newColorTableSize = numColors * 4;
  const bfOffBits = 14 + 40 + newColorTableSize;
  const pixelDataSize = dibData.byteLength - pixelDataStart;
  const fileSize = bfOffBits + pixelDataSize;

  const bmp = new ArrayBuffer(fileSize);
  const out = new DataView(bmp);
  const outBytes = new Uint8Array(bmp);

  outBytes[0] = 0x42; // 'B'
  outBytes[1] = 0x4D; // 'M'
  out.setUint32(2, fileSize, true);
  out.setUint32(6, 0, true);
  out.setUint32(10, bfOffBits, true);

  out.setUint32(14, 40, true);
  out.setInt32(18, width, true);
  out.setInt32(22, height, true);
  out.setUint16(26, 1, true);
  out.setUint16(28, bitCount, true);
  out.setUint32(30, compression, true);
  out.setUint32(34, pixelDataSize, true);
  out.setUint32(38, 0, true);
  out.setUint32(42, 0, true);
  out.setUint32(46, numColors, true);
  out.setUint32(50, 0, true);

  if (numColors > 0) {
    if (headerSize === 12) {
      for (let i = 0; i < numColors; i++) {
        const srcOff = 12 + i * 3;
        const dstOff = 54 + i * 4;
        outBytes[dstOff] = dibData[srcOff];
        outBytes[dstOff + 1] = dibData[srcOff + 1];
        outBytes[dstOff + 2] = dibData[srcOff + 2];
        outBytes[dstOff + 3] = 0;
      }
    } else {
      outBytes.set(dibData.subarray(headerSize, headerSize + colorTableSize), 54);
    }
  }

  outBytes.set(dibData.subarray(pixelDataStart), bfOffBits);

  let magentaIndex = -1;
  if (numColors > 0) {
    for (let i = 0; i < numColors; i++) {
      const off = 54 + i * 4;
      if (outBytes[off + 2] === 255 && outBytes[off + 1] === 0 && outBytes[off] === 255) {
        magentaIndex = i;
        break;
      }
    }
  }

  return {
    blob: new Blob([bmp], { type: 'image/bmp' }),
    width: Math.abs(width),
    height: Math.abs(height),
    bitCount,
    magentaIndex,
  };
}

export function extractBitmaps(peInfo: PEInfo, arrayBuffer: ArrayBuffer): BitmapResult[] {
  if (!peInfo.resources) return [];

  const bitmapType = peInfo.resources.find(r => r.typeId === 2);
  if (!bitmapType) return [];

  const results: BitmapResult[] = [];
  for (const entry of bitmapType.entries) {
    for (const lang of entry.languages) {
      try {
        const fileOffset = rvaToFileOffset(lang.dataRva, peInfo.sections);
        const dibData = new Uint8Array(arrayBuffer, fileOffset, lang.dataSize);
        const bmp = buildBmpFile(dibData);

        results.push({
          id: entry.id,
          name: entry.name,
          languageId: lang.languageId,
          bmpBlob: bmp.blob,
          width: bmp.width,
          height: bmp.height,
          bitCount: bmp.bitCount,
          magentaIndex: bmp.magentaIndex,
          dibData: bmp.magentaIndex >= 0 ? new Uint8Array(dibData) : null,
        });
      } catch (e: unknown) {
        console.warn(`Failed to extract bitmap ${entry.id ?? entry.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  return results;
}
