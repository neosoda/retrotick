import type { PEInfo, DfmComponent, DfmResult } from './types';
import { rvaToFileOffset } from './read';

function parseDfmBinary(arrayBuffer: ArrayBuffer, baseOffset: number, dataSize: number): DfmComponent | null {
  const dv = new DataView(arrayBuffer, baseOffset, dataSize);
  let pos = 0;

  if (dv.getUint8(0) === 0xFF) pos = 1;

  if (pos + 4 > dataSize) return null;
  const s0 = dv.getUint8(pos), s1 = dv.getUint8(pos + 1), s2 = dv.getUint8(pos + 2), s3 = dv.getUint8(pos + 3);
  if (s0 !== 0x54 || s1 !== 0x50 || s2 !== 0x46 || s3 !== 0x30) return null; // "TPF0"
  pos += 4;

  function u8() { return dv.getUint8(pos++); }
  function i8() { return dv.getInt8(pos++); }
  function i16() { const v = dv.getInt16(pos, true); pos += 2; return v; }
  function i32() { const v = dv.getInt32(pos, true); pos += 4; return v; }
  function u32() { const v = dv.getUint32(pos, true); pos += 4; return v; }
  function f32() { const v = dv.getFloat32(pos, true); pos += 4; return v; }
  function f64() { const v = dv.getFloat64(pos, true); pos += 8; return v; }

  function pstr(): string {
    const len = u8();
    let s = '';
    for (let i = 0; i < len; i++) s += String.fromCharCode(u8());
    return s;
  }

  function lstr(): string {
    const len = u32();
    let s = '';
    for (let i = 0; i < len; i++) s += String.fromCharCode(u8());
    return s;
  }

  function wstr(): string {
    const charLen = u32();
    let s = '';
    for (let i = 0; i < charLen; i++) {
      s += String.fromCharCode(dv.getUint16(pos, true));
      pos += 2;
    }
    return s;
  }

  function utf8str(): string {
    const len = u32();
    const bytes = new Uint8Array(arrayBuffer, baseOffset + pos, len);
    pos += len;
    return new TextDecoder('utf-8').decode(bytes);
  }

  function peek(): number { return pos < dataSize ? dv.getUint8(pos) : 0; }

  function readValue(): unknown {
    const tag = u8();
    switch (tag) {
      case 0: return null;
      case 1: {
        const items: unknown[] = [];
        while (peek() !== 0) items.push(readValue());
        pos++;
        return items;
      }
      case 2: return i8();
      case 3: return i16();
      case 4: return i32();
      case 5: {
        const bytes: number[] = [];
        for (let i = 0; i < 10; i++) bytes.push(u8());
        const sign = (bytes[9] >> 7) & 1;
        const exp = ((bytes[9] & 0x7F) << 8) | bytes[8];
        if (exp === 0) return 0;
        let mantissa = 0;
        for (let i = 7; i >= 0; i--) mantissa = mantissa * 256 + bytes[i];
        mantissa /= 0x8000000000000000;
        return (sign ? -1 : 1) * mantissa * Math.pow(2, exp - 16383);
      }
      case 6: return pstr();
      case 7: return pstr();
      case 8: return false;
      case 9: return true;
      case 10: {
        const len = u32();
        const data = new Uint8Array(arrayBuffer.slice(baseOffset + pos, baseOffset + pos + len));
        pos += len;
        return { binary: data };
      }
      case 11: {
        const items: string[] = [];
        while (true) {
          const s = pstr();
          if (s === '') break;
          items.push(s);
        }
        return { set: items };
      }
      case 12: return lstr();
      case 13: return null;
      case 14: {
        const items: Record<string, unknown>[] = [];
        while (peek() !== 0) {
          if (peek() >= 2 && peek() <= 4) readValue();
          if (peek() === 1) pos++;
          const item: Record<string, unknown> = {};
          while (peek() !== 0) {
            const name = pstr();
            item[name] = readValue();
          }
          pos++;
          items.push(item);
        }
        pos++;
        return { collection: items };
      }
      case 15: return f32();
      case 16: {
        const lo = u32();
        const hi = i32();
        return (hi * 4294967296 + lo) / 10000;
      }
      case 17: return f64();
      case 18: return wstr();
      case 19: {
        const lo = u32();
        const hi = i32();
        return hi * 4294967296 + lo;
      }
      case 20: return utf8str();
      case 21: return f64();
      default: return null;
    }
  }

  function readComponent(): DfmComponent {
    if ((peek() & 0xF0) === 0xF0) {
      const prefix = u8();
      const flags = prefix & 0x0F;
      if (flags & 0x02) readValue();
    }

    const className = pstr();
    const name = pstr();

    const properties: Record<string, unknown> = {};
    while (peek() !== 0) {
      const propName = pstr();
      properties[propName] = readValue();
    }
    pos++;

    const children: DfmComponent[] = [];
    while (peek() !== 0) {
      children.push(readComponent());
    }
    pos++;

    return { className, name, properties, children };
  }

  try {
    return readComponent();
  } catch (e: unknown) {
    console.warn('DFM parse error:', e instanceof Error ? e.message : String(e));
    return null;
  }
}

export function extractDelphiForms(peInfo: PEInfo, arrayBuffer: ArrayBuffer): DfmResult[] {
  if (!peInfo.resources) return [];
  const rcdataType = peInfo.resources.find(r => r.typeId === 10);
  if (!rcdataType) return [];

  const results: DfmResult[] = [];
  for (const entry of rcdataType.entries) {
    for (const lang of entry.languages) {
      try {
        const fileOffset = rvaToFileOffset(lang.dataRva, peInfo.sections);
        const form = parseDfmBinary(arrayBuffer, fileOffset, lang.dataSize);
        if (form) {
          results.push({ id: entry.id, name: entry.name, languageId: lang.languageId, form });
        }
      } catch (_e) {
        // Not a DFM or parse error — skip silently
      }
    }
  }
  return results;
}
