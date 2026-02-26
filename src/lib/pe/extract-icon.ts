import type { PEInfo, IconResult } from './types';
import { rvaToFileOffset } from './read';

export function extractIcons(peInfo: PEInfo, arrayBuffer: ArrayBuffer): IconResult[] {
  if (!peInfo.resources) return [];

  const groupIconType = peInfo.resources.find(r => r.typeId === 14);
  if (!groupIconType) return [];

  const iconType = peInfo.resources.find(r => r.typeId === 3);
  const iconDataMap = new Map<number, { fileOffset: number; dataSize: number }>();
  if (iconType) {
    for (const entry of iconType.entries) {
      for (const lang of entry.languages) {
        try {
          const fileOffset = rvaToFileOffset(lang.dataRva, peInfo.sections);
          iconDataMap.set(entry.id!, { fileOffset, dataSize: lang.dataSize });
        } catch (e: unknown) {
          console.warn(`Failed to locate RT_ICON #${entry.id}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }
  }

  const results: IconResult[] = [];
  for (const groupEntry of groupIconType.entries) {
    for (const lang of groupEntry.languages) {
      try {
        const fileOffset = rvaToFileOffset(lang.dataRva, peInfo.sections);
        const dv = new DataView(arrayBuffer, fileOffset, lang.dataSize);

        const idCount = dv.getUint16(4, true);

        const variants: { width: number; height: number; bitCount: number }[] = [];
        const iconEntries: { dwBytesInRes: number; nID: number; width: number; height: number }[] = [];
        for (let i = 0; i < idCount; i++) {
          const off = 6 + i * 14;
          const bWidth = dv.getUint8(off);
          const bHeight = dv.getUint8(off + 1);
          const wBitCount = dv.getUint16(off + 6, true);
          const dwBytesInRes = dv.getUint32(off + 8, true);
          const nID = dv.getUint16(off + 12, true);

          const width = bWidth === 0 ? 256 : bWidth;
          const height = bHeight === 0 ? 256 : bHeight;

          variants.push({ width, height, bitCount: wBitCount });
          iconEntries.push({ dwBytesInRes, nID, width, height });
        }

        const headerSize = 6 + idCount * 16;
        let totalDataSize = 0;
        const iconDataChunks: ({ fileOffset: number; dataSize: number } | null)[] = [];
        for (const entry of iconEntries) {
          const iconData = iconDataMap.get(entry.nID);
          if (!iconData) {
            console.warn(`RT_ICON #${entry.nID} not found for group #${groupEntry.id}`);
            iconDataChunks.push(null);
            continue;
          }
          iconDataChunks.push(iconData);
          totalDataSize += iconData.dataSize;
        }

        const icoSize = headerSize + totalDataSize;
        const ico = new ArrayBuffer(icoSize);
        const icoDv = new DataView(ico);
        const icoBytes = new Uint8Array(ico);

        icoDv.setUint16(0, 0, true);
        icoDv.setUint16(2, 1, true);
        icoDv.setUint16(4, idCount, true);

        let dataOffset = headerSize;
        for (let i = 0; i < idCount; i++) {
          const grpOff = 6 + i * 14;
          const entryOff = 6 + i * 16;
          const chunk = iconDataChunks[i];

          for (let j = 0; j < 12; j++) {
            icoBytes[entryOff + j] = dv.getUint8(grpOff + j);
          }

          if (chunk) {
            icoDv.setUint32(entryOff + 12, dataOffset, true);
            icoBytes.set(new Uint8Array(arrayBuffer, chunk.fileOffset, chunk.dataSize), dataOffset);
            dataOffset += chunk.dataSize;
          } else {
            icoDv.setUint32(entryOff + 12, 0, true);
          }
        }

        results.push({
          id: groupEntry.id,
          name: groupEntry.name,
          blob: new Blob([ico], { type: 'image/x-icon' }),
          variants,
        });
      } catch (e: unknown) {
        console.warn(`Failed to extract icon group ${groupEntry.id ?? groupEntry.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  return results;
}
