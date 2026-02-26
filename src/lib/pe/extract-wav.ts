import type { PEInfo, WavResult } from './types';
import { rvaToFileOffset } from './read';

export function extractWav(peInfo: PEInfo, arrayBuffer: ArrayBuffer): WavResult[] {
  if (!peInfo.resources) return [];
  const results: WavResult[] = [];

  const rcdataType = peInfo.resources.find(r => r.typeId === 10);
  if (rcdataType) {
    for (const entry of rcdataType.entries) {
      for (const lang of entry.languages) {
        try {
          const fileOffset = rvaToFileOffset(lang.dataRva, peInfo.sections);
          if (lang.dataSize < 12) continue;
          const dv = new DataView(arrayBuffer, fileOffset, lang.dataSize);
          const riff = dv.getUint32(0, false);
          const wave = dv.getUint32(8, false);
          if (riff !== 0x52494646 || wave !== 0x57415645) continue;
          const data = new Uint8Array(arrayBuffer, fileOffset, lang.dataSize);
          results.push({
            id: entry.id,
            name: entry.name,
            blob: new Blob([data], { type: 'audio/wav' }),
          });
        } catch (_e) {
          // Not a WAV — skip
        }
      }
    }
  }

  for (const rt of peInfo.resources) {
    if (rt.typeId != null) continue;
    const tn = (rt.typeName || '').toUpperCase();
    if (tn !== 'WAVE' && tn !== 'WAV') continue;
    for (const entry of rt.entries) {
      for (const lang of entry.languages) {
        try {
          const fileOffset = rvaToFileOffset(lang.dataRva, peInfo.sections);
          const data = new Uint8Array(arrayBuffer, fileOffset, lang.dataSize);
          results.push({
            id: entry.id,
            name: entry.name,
            blob: new Blob([data], { type: 'audio/wav' }),
          });
        } catch (_e) {
          // skip
        }
      }
    }
  }

  return results;
}
