import type { PEInfo, VersionResult, VersionFixedInfo } from './types';
import { rvaToFileOffset, readAnsiStr, decodeAnsi } from './read';

function parseVersionInfo(
  arrayBuffer: ArrayBuffer,
  fileOffset: number,
  dataSize: number,
  isAnsi?: string,
): { fixedInfo: VersionFixedInfo | null; strings: Record<string, string> } | null {
  const dv = new DataView(arrayBuffer, fileOffset, dataSize);

  function align4(pos: number): number {
    return (pos + 3) & ~3;
  }

  function readWString(pos: number): { value: string; end: number } {
    let s = '';
    while (pos + 2 <= dataSize) {
      const ch = dv.getUint16(pos, true);
      pos += 2;
      if (ch === 0) break;
      s += String.fromCharCode(ch);
    }
    return { value: s, end: pos };
  }

  function readAString(pos: number): { value: string; end: number } {
    return readAnsiStr(dv, pos, dataSize - pos, isAnsi || 'windows-1252');
  }

  function readAStringN(pos: number, len: number): { value: string; end: number } {
    const s = decodeAnsi(dv, pos, len, isAnsi || 'windows-1252');
    return { value: s.replace(/\0.*$/, ''), end: pos + len };
  }

  // Win16 (NE): wLength, wValueLength, szKey (ANSI) — no wType field
  // Win32 (PE): wLength, wValueLength, wType, szKey (Unicode)
  function parseNode(pos: number) {
    const start = pos;
    if (pos + 4 > dataSize) return null;
    const wLength = dv.getUint16(pos, true);
    const wValueLength = dv.getUint16(pos + 2, true);
    if (isAnsi) {
      const key = readAString(pos + 4);
      pos = align4(key.end);
      return { start, wLength, wValueLength, key: key.value, valueOffset: pos };
    } else {
      if (pos + 6 > dataSize) return null;
      const _wType = dv.getUint16(pos + 4, true);
      const key = readWString(pos + 6);
      pos = align4(key.end);
      return { start, wLength, wValueLength, key: key.value, valueOffset: pos };
    }
  }

  const root = parseNode(0);
  if (!root || root.key !== 'VS_VERSION_INFO') return null;

  const result: { fixedInfo: VersionFixedInfo | null; strings: Record<string, string> } = {
    fixedInfo: null,
    strings: {},
  };

  let pos = root.valueOffset;
  if (root.wValueLength >= 52) {
    const sig = dv.getUint32(pos, true);
    if (sig === 0xFEEF04BD) {
      const fileVerMS = dv.getUint32(pos + 8, true);
      const fileVerLS = dv.getUint32(pos + 12, true);
      const prodVerMS = dv.getUint32(pos + 16, true);
      const prodVerLS = dv.getUint32(pos + 20, true);
      result.fixedInfo = {
        fileVersion: `${fileVerMS >>> 16}.${fileVerMS & 0xFFFF}.${fileVerLS >>> 16}.${fileVerLS & 0xFFFF}`,
        productVersion: `${prodVerMS >>> 16}.${prodVerMS & 0xFFFF}.${prodVerLS >>> 16}.${prodVerLS & 0xFFFF}`,
      };
    }
    pos += root.wValueLength;
  }
  pos = align4(pos);

  const rootEnd = root.start + root.wLength;
  while (pos < rootEnd) {
    pos = align4(pos);
    const child = parseNode(pos);
    if (!child || child.wLength === 0) break;

    if (child.key === 'StringFileInfo') {
      let stPos = align4(child.valueOffset);
      const sfiEnd = child.start + child.wLength;
      while (stPos < sfiEnd) {
        stPos = align4(stPos);
        const table = parseNode(stPos);
        if (!table || table.wLength === 0) break;

        let strPos = align4(table.valueOffset);
        const tableEnd = table.start + table.wLength;
        while (strPos < tableEnd) {
          strPos = align4(strPos);
          const strNode = parseNode(strPos);
          if (!strNode || strNode.wLength === 0) break;

          let value = '';
          if (strNode.wValueLength > 0) {
            if (isAnsi) {
              const valRead = readAStringN(strNode.valueOffset, strNode.wValueLength);
              value = valRead.value;
            } else {
              const valRead = readWString(strNode.valueOffset);
              value = valRead.value;
            }
          }
          result.strings[strNode.key] = value;

          strPos = align4(strNode.start + strNode.wLength);
        }
        stPos = align4(table.start + table.wLength);
      }
    }

    pos = align4(child.start + child.wLength);
  }

  return result;
}

export function extractVersionInfo(peInfo: PEInfo, arrayBuffer: ArrayBuffer): VersionResult[] {
  if (!peInfo.resources) return [];

  const versionType = peInfo.resources.find(r => r.typeId === 16);
  if (!versionType) return [];

  const results: VersionResult[] = [];
  for (const entry of versionType.entries) {
    for (const lang of entry.languages) {
      try {
        const fileOffset = rvaToFileOffset(lang.dataRva, peInfo.sections);
        const info = parseVersionInfo(arrayBuffer, fileOffset, lang.dataSize, peInfo.neEncoding);
        if (info) {
          results.push({
            id: entry.id,
            name: entry.name,
            languageId: lang.languageId,
            fixedInfo: info.fixedInfo,
            strings: info.strings,
          });
        }
      } catch (e: unknown) {
        console.warn(`Failed to extract version info ${entry.id ?? entry.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  return results;
}
