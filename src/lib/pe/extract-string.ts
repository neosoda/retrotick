import type { PEInfo, StringResult } from './types';
import { rvaToFileOffset, decodeAnsi } from './read';

export function extractStrings(peInfo: PEInfo, arrayBuffer: ArrayBuffer): StringResult[] {
  if (!peInfo.resources) return [];

  const stringType = peInfo.resources.find(r => r.typeId === 6);
  if (!stringType) return [];

  const results: StringResult[] = [];
  for (const entry of stringType.entries) {
    for (const lang of entry.languages) {
      try {
        const fileOffset = rvaToFileOffset(lang.dataRva, peInfo.sections);
        const dv = new DataView(arrayBuffer, fileOffset, lang.dataSize);
        const baseId = (entry.id! - 1) * 16;

        let offset = 0;
        if (peInfo.neEncoding) {
          // NE: BYTE length + ANSI chars
          for (let i = 0; i < 16; i++) {
            if (offset >= lang.dataSize) break;
            const len = dv.getUint8(offset);
            offset += 1;
            if (len > 0) {
              const s = decodeAnsi(dv, offset, len, peInfo.neEncoding);
              offset += len;
              results.push({ id: baseId + i, string: s, languageId: lang.languageId });
            }
          }
        } else {
          // PE: WORD length + Unicode chars
          for (let i = 0; i < 16; i++) {
            if (offset + 2 > lang.dataSize) break;
            const len = dv.getUint16(offset, true);
            offset += 2;
            if (len > 0) {
              let s = '';
              for (let j = 0; j < len; j++) {
                s += String.fromCharCode(dv.getUint16(offset + j * 2, true));
              }
              offset += len * 2;
              results.push({ id: baseId + i, string: s, languageId: lang.languageId });
            }
          }
        }
      } catch (e: unknown) {
        console.warn(`Failed to extract string block ${entry.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  results.sort((a, b) => a.id - b.id);
  return results;
}
