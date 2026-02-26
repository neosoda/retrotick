import type { PEInfo, AccelResult } from './types';
import { rvaToFileOffset } from './read';

export const VK_NAMES: Record<number, string> = {
  0x08: 'Backspace', 0x09: 'Tab', 0x0D: 'Enter', 0x1B: 'Esc', 0x20: 'Space',
  0x21: 'PgUp', 0x22: 'PgDn', 0x23: 'End', 0x24: 'Home',
  0x25: 'Left', 0x26: 'Up', 0x27: 'Right', 0x28: 'Down',
  0x2D: 'Insert', 0x2E: 'Delete',
  0x70: 'F1', 0x71: 'F2', 0x72: 'F3', 0x73: 'F4', 0x74: 'F5', 0x75: 'F6',
  0x76: 'F7', 0x77: 'F8', 0x78: 'F9', 0x79: 'F10', 0x7A: 'F11', 0x7B: 'F12',
};

export function accelKeyName(fVirt: number, key: number): string {
  const parts: string[] = [];
  if (fVirt & 0x08) parts.push('Ctrl');
  if (fVirt & 0x10) parts.push('Alt');
  if (fVirt & 0x04) parts.push('Shift');

  let keyName: string;
  if (fVirt & 0x01) {
    if (VK_NAMES[key]) keyName = VK_NAMES[key];
    else if (key >= 0x30 && key <= 0x39) keyName = String.fromCharCode(key);
    else if (key >= 0x41 && key <= 0x5A) keyName = String.fromCharCode(key);
    else keyName = `VK_0x${key.toString(16).toUpperCase()}`;
  } else {
    keyName = String.fromCharCode(key);
  }

  parts.push(keyName);
  return parts.join('+');
}

export function extractAccelerators(peInfo: PEInfo, arrayBuffer: ArrayBuffer): AccelResult[] {
  if (!peInfo.resources) return [];
  const accelType = peInfo.resources.find(r => r.typeId === 9);
  if (!accelType) return [];

  const results: AccelResult[] = [];
  for (const entry of accelType.entries) {
    for (const lang of entry.languages) {
      try {
        const fileOffset = rvaToFileOffset(lang.dataRva, peInfo.sections);
        const dv = new DataView(arrayBuffer, fileOffset, lang.dataSize);
        const entries = [];
        if (peInfo.isNE) {
          // NE: 5-byte entries (BYTE fVirt, WORD key, WORD cmd)
          let off = 0;
          while (off + 5 <= lang.dataSize) {
            const fVirt = dv.getUint8(off);
            const key = dv.getUint16(off + 1, true);
            const cmd = dv.getUint16(off + 3, true);
            entries.push({ fVirt, key, cmd, keyName: accelKeyName(fVirt, key) });
            off += 5;
            if (fVirt & 0x80) break;
          }
        } else {
          // PE: 8-byte entries (WORD fVirt, WORD key, WORD cmd, WORD pad)
          const count = Math.floor(lang.dataSize / 8);
          for (let i = 0; i < count; i++) {
            const off = i * 8;
            const fVirt = dv.getUint16(off, true);
            const key = dv.getUint16(off + 2, true);
            const cmd = dv.getUint16(off + 4, true);
            entries.push({ fVirt, key, cmd, keyName: accelKeyName(fVirt, key) });
            if (fVirt & 0x80) break;
          }
        }
        results.push({ id: entry.id, name: entry.name, entries });
      } catch (e: unknown) {
        console.warn(`Failed to extract accelerator ${entry.id ?? entry.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
  return results;
}
