import type { PEInfo, AviResult } from './types';
import { rvaToFileOffset } from './read';

export function extractAvi(peInfo: PEInfo, arrayBuffer: ArrayBuffer): AviResult[] {
  if (!peInfo.resources) return [];
  const results: AviResult[] = [];

  const sources = peInfo.resources.filter(r =>
    r.typeId === 10 || (r.typeName && r.typeName.toUpperCase() === 'AVI')
  );

  for (const resType of sources) {
    const isNamedAvi = resType.typeName != null && resType.typeName.toUpperCase() === 'AVI';
    for (const entry of resType.entries) {
      for (const lang of entry.languages) {
        try {
          const fileOffset = rvaToFileOffset(lang.dataRva, peInfo.sections);
          if (lang.dataSize < 12) continue;
          const dv = new DataView(arrayBuffer, fileOffset, lang.dataSize);
          const riff = dv.getUint32(0, false);
          const avi = dv.getUint32(8, false);
          if (!isNamedAvi && (riff !== 0x52494646 || avi !== 0x41564920)) continue;
          const data = new Uint8Array(arrayBuffer, fileOffset, lang.dataSize);
          results.push({
            id: entry.id,
            name: entry.name,
            blob: new Blob([data], { type: 'video/avi' }),
            rawData: new Uint8Array(data),
          });
        } catch (_e) {
          // skip
        }
      }
    }
  }
  return results;
}
