import type { PEInfo, ExportResult, ExportFunction } from './types';
import { rvaToFileOffset, readUint32, readUint16 } from './read';

export function extractExports(peInfo: PEInfo, arrayBuffer: ArrayBuffer): ExportResult | null {
  if (peInfo.isNE) return null;

  const dataDirectories = peInfo.optionalHeader.dataDirectories;
  if (!dataDirectories || dataDirectories.length < 1) return null;

  const exportDir = dataDirectories[0];
  if (exportDir.virtualAddress === 0 || exportDir.size === 0) return null;

  const dv = new DataView(arrayBuffer);
  const sections = peInfo.sections;

  let exportTableOffset: number;
  try {
    exportTableOffset = rvaToFileOffset(exportDir.virtualAddress, sections);
  } catch {
    return null;
  }

  // IMAGE_EXPORT_DIRECTORY fields
  const nameRva = readUint32(dv, exportTableOffset + 12);
  const base = readUint32(dv, exportTableOffset + 16);
  const numberOfFunctions = readUint32(dv, exportTableOffset + 20);
  const numberOfNames = readUint32(dv, exportTableOffset + 24);
  const addressOfFunctionsRva = readUint32(dv, exportTableOffset + 28);
  const addressOfNamesRva = readUint32(dv, exportTableOffset + 32);
  const addressOfNameOrdinalsRva = readUint32(dv, exportTableOffset + 36);

  let dllName: string;
  try {
    const nameOffset = rvaToFileOffset(nameRva, sections);
    dllName = readNullTerminatedAscii(dv, nameOffset);
  } catch {
    dllName = '(unknown)';
  }

  // Read function address table
  let functionsOffset: number;
  try {
    functionsOffset = rvaToFileOffset(addressOfFunctionsRva, sections);
  } catch {
    return { dll: dllName, functions: [] };
  }

  // Read name pointer table and ordinal table
  let namesOffset: number | null = null;
  let ordinalsOffset: number | null = null;
  if (numberOfNames > 0) {
    try {
      namesOffset = rvaToFileOffset(addressOfNamesRva, sections);
      ordinalsOffset = rvaToFileOffset(addressOfNameOrdinalsRva, sections);
    } catch {
      // proceed without names
    }
  }

  // Build ordinal-to-name map
  const ordinalToName = new Map<number, string>();
  if (namesOffset != null && ordinalsOffset != null) {
    for (let i = 0; i < numberOfNames; i++) {
      const funcNameRva = readUint32(dv, namesOffset + i * 4);
      const ordinalIndex = readUint16(dv, ordinalsOffset + i * 2);
      try {
        const funcNameOffset = rvaToFileOffset(funcNameRva, sections);
        const funcName = readNullTerminatedAscii(dv, funcNameOffset);
        ordinalToName.set(ordinalIndex, funcName);
      } catch {
        // skip
      }
    }
  }

  // Export directory RVA range (for detecting forwarded exports)
  const exportDirStart = exportDir.virtualAddress;
  const exportDirEnd = exportDirStart + exportDir.size;

  const functions: ExportFunction[] = [];
  for (let i = 0; i < numberOfFunctions; i++) {
    const funcRva = readUint32(dv, functionsOffset + i * 4);
    if (funcRva === 0) continue; // unused entry

    const ordinal = base + i;
    const name = ordinalToName.get(i) ?? null;

    let forwardedTo: string | null = null;
    if (funcRva >= exportDirStart && funcRva < exportDirEnd) {
      // Forwarded export: the RVA points to a string within the export directory
      try {
        const forwardOffset = rvaToFileOffset(funcRva, sections);
        forwardedTo = readNullTerminatedAscii(dv, forwardOffset);
      } catch {
        // not forwarded
      }
    }

    functions.push({ ordinal, name, rva: funcRva, forwardedTo });
  }

  return { dll: dllName, functions };
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
