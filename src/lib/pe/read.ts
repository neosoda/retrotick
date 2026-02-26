import type { SectionHeader } from './types';

export function readUint16(dv: DataView, offset: number): number {
  return dv.getUint16(offset, true);
}

export function readUint32(dv: DataView, offset: number): number {
  return dv.getUint32(offset, true);
}

export function readInt32(dv: DataView, offset: number): number {
  return dv.getInt32(offset, true);
}

export function readAscii(dv: DataView, offset: number, length: number): string {
  let s = '';
  for (let i = 0; i < length; i++) {
    const ch = dv.getUint8(offset + i);
    if (ch === 0) break;
    s += String.fromCharCode(ch);
  }
  return s;
}

export function readUtf16(dv: DataView, offset: number, charCount: number): string {
  let s = '';
  for (let i = 0; i < charCount; i++) {
    s += String.fromCharCode(dv.getUint16(offset + i * 2, true));
  }
  return s;
}

export function rvaToFileOffset(rva: number, sections: SectionHeader[]): number {
  for (const section of sections) {
    if (rva >= section.virtualAddress && rva < section.virtualAddress + section.sizeOfRawData) {
      return rva - section.virtualAddress + section.pointerToRawData;
    }
  }
  throw new Error(`Cannot map RVA 0x${rva.toString(16)} to file offset`);
}

/** Decode a null-terminated ANSI string from a DataView at the given offset using TextDecoder. */
export function readAnsiStr(dv: DataView, offset: number, maxLen: number, encoding: string): { value: string; end: number } {
  const start = offset;
  let end = offset;
  while (end < start + maxLen) {
    if (dv.getUint8(end) === 0) break;
    end++;
  }
  const bytes = new Uint8Array(dv.buffer, dv.byteOffset + start, end - start);
  const value = new TextDecoder(encoding).decode(bytes);
  // skip past the null terminator
  if (end < start + maxLen && dv.getUint8(end) === 0) end++;
  return { value, end };
}

/** Decode a fixed-length ANSI byte sequence using TextDecoder. */
export function decodeAnsi(dv: DataView, offset: number, length: number, encoding: string): string {
  const bytes = new Uint8Array(dv.buffer, dv.byteOffset + offset, length);
  return new TextDecoder(encoding).decode(bytes);
}

export const RT_TYPES: Record<number, string> = {
  1: 'RT_CURSOR',
  2: 'RT_BITMAP',
  3: 'RT_ICON',
  4: 'RT_MENU',
  5: 'RT_DIALOG',
  6: 'RT_STRING',
  7: 'RT_FONTDIR',
  8: 'RT_FONT',
  9: 'RT_ACCELERATOR',
  10: 'RT_RCDATA',
  11: 'RT_MESSAGETABLE',
  12: 'RT_GROUP_CURSOR',
  14: 'RT_GROUP_ICON',
  16: 'RT_VERSION',
  24: 'RT_MANIFEST',
};
