import type { PEInfo, CursorResult } from './types';
import { rvaToFileOffset } from './read';

export function extractCursors(peInfo: PEInfo, arrayBuffer: ArrayBuffer): CursorResult[] {
  if (!peInfo.resources) return [];

  const groupCursorType = peInfo.resources.find(r => r.typeId === 12);
  if (!groupCursorType) return [];

  const cursorType = peInfo.resources.find(r => r.typeId === 1);
  const cursorDataMap = new Map<number, { fileOffset: number; dataSize: number }>();
  if (cursorType) {
    for (const entry of cursorType.entries) {
      for (const lang of entry.languages) {
        try {
          const fileOffset = rvaToFileOffset(lang.dataRva, peInfo.sections);
          cursorDataMap.set(entry.id!, { fileOffset, dataSize: lang.dataSize });
        } catch (e: unknown) {
          console.warn(`Failed to locate RT_CURSOR #${entry.id}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }
  }

  const results: CursorResult[] = [];
  for (const groupEntry of groupCursorType.entries) {
    for (const lang of groupEntry.languages) {
      try {
        const fileOffset = rvaToFileOffset(lang.dataRva, peInfo.sections);
        const dv = new DataView(arrayBuffer, fileOffset, lang.dataSize);

        const idCount = dv.getUint16(4, true);

        const cursorEntries: {
          wWidth: number; wHeight: number; wPlanes: number;
          wBitCount: number; dwBytesInRes: number; nID: number;
        }[] = [];
        for (let i = 0; i < idCount; i++) {
          const off = 6 + i * 14;
          cursorEntries.push({
            wWidth: dv.getUint16(off, true),
            wHeight: dv.getUint16(off + 2, true),
            wPlanes: dv.getUint16(off + 4, true),
            wBitCount: dv.getUint16(off + 6, true),
            dwBytesInRes: dv.getUint32(off + 8, true),
            nID: dv.getUint16(off + 12, true),
          });
        }

        const headerSize = 6 + idCount * 16;
        let totalDataSize = 0;
        const cursorDataChunks: ({ fileOffset: number; dataSize: number } | null)[] = [];
        for (const entry of cursorEntries) {
          const cursorData = cursorDataMap.get(entry.nID);
          if (!cursorData) {
            cursorDataChunks.push(null);
            continue;
          }
          cursorDataChunks.push(cursorData);
          totalDataSize += cursorData.dataSize - 4;
        }

        const curSize = headerSize + totalDataSize;
        const cur = new ArrayBuffer(curSize);
        const curDv = new DataView(cur);
        const curBytes = new Uint8Array(cur);

        curDv.setUint16(0, 0, true);
        curDv.setUint16(2, 2, true);
        curDv.setUint16(4, idCount, true);

        const variants: { width: number; height: number; hotspotX: number; hotspotY: number }[] = [];
        let dataOffset = headerSize;
        for (let i = 0; i < idCount; i++) {
          const entryOff = 6 + i * 16;
          const chunk = cursorDataChunks[i];
          const ce = cursorEntries[i];

          let hotspotX = 0, hotspotY = 0;
          let dibSize = 0;

          if (chunk) {
            const localDv = new DataView(arrayBuffer, chunk.fileOffset, chunk.dataSize);
            hotspotX = localDv.getUint16(0, true);
            hotspotY = localDv.getUint16(2, true);
            dibSize = chunk.dataSize - 4;
          }

          const width = ce.wWidth;
          const height = ce.wHeight / 2;

          variants.push({ width, height, hotspotX, hotspotY });

          curBytes[entryOff] = width >= 256 ? 0 : width;
          curBytes[entryOff + 1] = height >= 256 ? 0 : height;
          curBytes[entryOff + 2] = 0;
          curBytes[entryOff + 3] = 0;
          curDv.setUint16(entryOff + 4, hotspotX, true);
          curDv.setUint16(entryOff + 6, hotspotY, true);
          curDv.setUint32(entryOff + 8, dibSize, true);
          curDv.setUint32(entryOff + 12, dataOffset, true);

          if (chunk) {
            curBytes.set(new Uint8Array(arrayBuffer, chunk.fileOffset + 4, dibSize), dataOffset);
            dataOffset += dibSize;
          }
        }

        results.push({
          id: groupEntry.id,
          name: groupEntry.name,
          blob: new Blob([cur], { type: 'image/x-icon' }),
          variants,
        });
      } catch (e: unknown) {
        console.warn(`Failed to extract cursor group ${groupEntry.id ?? groupEntry.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  return results;
}
