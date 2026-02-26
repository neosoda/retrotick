import type { PEInfo, ManifestResult } from './types';
import { rvaToFileOffset } from './read';

export function extractManifests(peInfo: PEInfo, arrayBuffer: ArrayBuffer): ManifestResult[] {
  if (!peInfo.resources) return [];

  const manifestType = peInfo.resources.find(r => r.typeId === 24);
  if (!manifestType) return [];

  const decoder = new TextDecoder('utf-8');
  const results: ManifestResult[] = [];
  for (const entry of manifestType.entries) {
    for (const lang of entry.languages) {
      try {
        const fileOffset = rvaToFileOffset(lang.dataRva, peInfo.sections);
        const data = new Uint8Array(arrayBuffer, fileOffset, lang.dataSize);
        results.push({
          id: entry.id,
          name: entry.name,
          languageId: lang.languageId,
          text: decoder.decode(data),
        });
      } catch (e: unknown) {
        console.warn(`Failed to extract manifest ${entry.id ?? entry.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  return results;
}
