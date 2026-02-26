import type { PEInfo, ImportResult, ImportFunction } from './types';
import { rvaToFileOffset, readUint16, readUint32 } from './read';

export function extractImports(peInfo: PEInfo, arrayBuffer: ArrayBuffer): ImportResult[] {
  if (peInfo.isNE) return [];

  const dataDirectories = peInfo.optionalHeader.dataDirectories;
  if (!dataDirectories || dataDirectories.length < 2) return [];

  const importDir = dataDirectories[1];
  if (importDir.virtualAddress === 0 || importDir.size === 0) return [];

  const dv = new DataView(arrayBuffer);
  const sections = peInfo.sections;
  const isPE32Plus = peInfo.optionalHeader.isPE32Plus;

  let importTableOffset: number;
  try {
    importTableOffset = rvaToFileOffset(importDir.virtualAddress, sections);
  } catch {
    return [];
  }

  const results: ImportResult[] = [];
  const descriptorSize = 20;

  for (let i = 0; ; i++) {
    const descOffset = importTableOffset + i * descriptorSize;
    if (descOffset + descriptorSize > arrayBuffer.byteLength) break;

    const originalFirstThunk = readUint32(dv, descOffset);
    const name = readUint32(dv, descOffset + 12);
    const firstThunk = readUint32(dv, descOffset + 16);

    // Null terminator: all fields zero
    if (originalFirstThunk === 0 && name === 0 && firstThunk === 0) break;

    let dllName: string;
    try {
      const nameOffset = rvaToFileOffset(name, sections);
      dllName = readNullTerminatedAscii(dv, nameOffset);
    } catch {
      continue;
    }

    const functions: ImportFunction[] = [];
    // Prefer OriginalFirstThunk (ILT), fall back to FirstThunk (IAT)
    const thunkRva = originalFirstThunk !== 0 ? originalFirstThunk : firstThunk;
    if (thunkRva === 0) {
      results.push({ dll: dllName, functions });
      continue;
    }

    let thunkOffset: number;
    try {
      thunkOffset = rvaToFileOffset(thunkRva, sections);
    } catch {
      results.push({ dll: dllName, functions });
      continue;
    }

    const entrySize = isPE32Plus ? 8 : 4;
    const ordinalFlag = isPE32Plus ? 0x8000000000000000n : 0x80000000;

    for (let j = 0; ; j++) {
      const entryOffset = thunkOffset + j * entrySize;
      if (entryOffset + entrySize > arrayBuffer.byteLength) break;

      if (isPE32Plus) {
        const value = dv.getBigUint64(entryOffset, true);
        if (value === 0n) break;

        if (value & BigInt(ordinalFlag)) {
          // Import by ordinal
          const ordinal = Number(value & 0xFFFFn);
          functions.push({ name: null, ordinal, hint: 0 });
        } else {
          // Import by name
          const hintNameRva = Number(value & 0x7FFFFFFFn);
          try {
            const hintNameOffset = rvaToFileOffset(hintNameRva, sections);
            const hint = readUint16(dv, hintNameOffset);
            const funcName = readNullTerminatedAscii(dv, hintNameOffset + 2);
            functions.push({ name: funcName, ordinal: null, hint });
          } catch {
            functions.push({ name: null, ordinal: null, hint: 0 });
          }
        }
      } else {
        const value = readUint32(dv, entryOffset);
        if (value === 0) break;

        if (value & (ordinalFlag as number)) {
          const ordinal = value & 0xFFFF;
          functions.push({ name: null, ordinal, hint: 0 });
        } else {
          const hintNameRva = value & 0x7FFFFFFF;
          try {
            const hintNameOffset = rvaToFileOffset(hintNameRva, sections);
            const hint = readUint16(dv, hintNameOffset);
            const funcName = readNullTerminatedAscii(dv, hintNameOffset + 2);
            functions.push({ name: funcName, ordinal: null, hint });
          } catch {
            functions.push({ name: null, ordinal: null, hint: 0 });
          }
        }
      }
    }

    results.push({ dll: dllName, functions });
  }

  return results;
}

function readNullTerminatedAscii(dv: DataView, offset: number): string {
  let s = '';
  for (let i = 0; offset + i < dv.byteLength; i++) {
    const ch = dv.getUint8(offset + i);
    if (ch === 0) break;
    s += String.fromCharCode(ch);
  }
  return s;
}
