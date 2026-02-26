import type { PEInfo, DialogResult, DialogTemplate, DialogItem, DialogFont } from './types';
import { rvaToFileOffset, readAnsiStr } from './read';

export const DIALOG_CLASS_NAMES: Record<number, string> = {
  0x0080: 'Button', 0x0081: 'Edit', 0x0082: 'Static',
  0x0083: 'ListBox', 0x0084: 'ScrollBar', 0x0085: 'ComboBox',
};

export function parseDialogTemplate(arrayBuffer: ArrayBuffer, baseOffset: number, dataSize: number): DialogTemplate {
  const dv = new DataView(arrayBuffer, baseOffset, dataSize);
  let pos = 0;

  function u8() { const v = dv.getUint8(pos); pos += 1; return v; }
  function u16() { const v = dv.getUint16(pos, true); pos += 2; return v; }
  function i16() { const v = dv.getInt16(pos, true); pos += 2; return v; }
  function u32() { const v = dv.getUint32(pos, true); pos += 4; return v; }
  function align4() { pos = (pos + 3) & ~3; }

  function wstr(): string {
    let s = '';
    while (pos + 2 <= dataSize) {
      const ch = dv.getUint16(pos, true);
      pos += 2;
      if (ch === 0) break;
      s += String.fromCharCode(ch);
    }
    return s;
  }

  function szOrOrd(): string | { ordinal: number } | null {
    const first = dv.getUint16(pos, true);
    if (first === 0x0000) { pos += 2; return null; }
    if (first === 0xFFFF) { pos += 2; return { ordinal: u16() }; }
    return wstr();
  }

  function szOrOrdToString(v: string | { ordinal: number } | null): string | null {
    if (v === null) return null;
    if (typeof v === 'string') return v;
    return `#${v.ordinal}`;
  }

  const isEx = dv.getUint16(0, true) === 1 && dv.getUint16(2, true) === 0xFFFF;

  let style: number, exStyle: number, count: number, x: number, y: number, cx: number, cy: number;
  let title: string;
  let menuName: string | null;
  let className: string | null;
  let font: DialogFont | null;

  if (isEx) {
    pos = 0;
    u16(); u16(); u32();
    exStyle = u32(); style = u32(); count = u16();
    x = i16(); y = i16(); cx = i16(); cy = i16();
    menuName = szOrOrdToString(szOrOrd());
    className = szOrOrdToString(szOrOrd());
    title = wstr();
    font = null;
    if (style & 0x40) {
      const pt = u16(), wt = u16(), it = u8(); u8();
      font = { pointSize: pt, weight: wt, italic: it !== 0, typeface: wstr() };
    }
  } else {
    pos = 0;
    style = u32(); exStyle = u32(); count = u16();
    x = i16(); y = i16(); cx = i16(); cy = i16();
    menuName = szOrOrdToString(szOrOrd());
    className = szOrOrdToString(szOrOrd());
    title = wstr();
    font = null;
    if (style & 0x40) {
      const pt = u16();
      font = { pointSize: pt, typeface: wstr() };
    }
  }

  const items: DialogItem[] = [];
  for (let i = 0; i < count; i++) {
    align4();
    let s: number, ex: number, ix: number, iy: number, icx: number, icy: number, id: number;
    if (isEx) {
      u32();
      ex = u32(); s = u32();
      ix = i16(); iy = i16(); icx = i16(); icy = i16();
      id = u32();
    } else {
      s = u32(); ex = u32();
      ix = i16(); iy = i16(); icx = i16(); icy = i16();
      id = u16();
    }

    const cls = szOrOrd();
    const ttl = szOrOrd();
    const extra = u16();
    if (extra > 0) pos += extra;

    let className: string;
    if (cls && typeof cls === 'object') className = DIALOG_CLASS_NAMES[(cls as { ordinal: number }).ordinal] || 'Unknown';
    else className = (typeof cls === 'string') ? cls : 'Unknown';

    let text = '';
    let titleOrdinal: number | null = null;
    if (typeof ttl === 'string') text = ttl;
    else if (ttl && typeof ttl === 'object') titleOrdinal = (ttl as { ordinal: number }).ordinal;

    items.push({ style: s, exStyle: ex, x: ix, y: iy, cx: icx, cy: icy, id, className, text, titleOrdinal });
  }

  return { style, exStyle, x, y, cx, cy, title, className, menuName, font, items };
}

function parseDialogTemplate16(arrayBuffer: ArrayBuffer, baseOffset: number, dataSize: number, encoding: string): DialogTemplate {
  const dv = new DataView(arrayBuffer, baseOffset, dataSize);
  let pos = 0;

  function u8() { const v = dv.getUint8(pos); pos += 1; return v; }
  function u16() { const v = dv.getUint16(pos, true); pos += 2; return v; }
  function u32() { const v = dv.getUint32(pos, true); pos += 4; return v; }

  function astr(): string {
    const r = readAnsiStr(dv, pos, dataSize - pos, encoding);
    pos = r.end;
    return r.value;
  }

  const style = u32();
  const count = u8();
  const x = u16(), y = u16(), cx = u16(), cy = u16();

  // menu: 0 = none, 0xFF + WORD ordinal, or ANSI string
  let menuName: string | null = null;
  const menuByte = u8();
  if (menuByte === 0xFF) { menuName = `#${u16()}`; }
  else if (menuByte !== 0) {
    pos--; // put back the first byte
    menuName = astr();
  }

  // class
  let className: string | null = null;
  const classByte = u8();
  if (classByte !== 0) {
    pos--; // put back the first byte
    className = astr();
  }

  // title
  const title = astr();

  let font: DialogFont | null = null;
  if (style & 0x40) { // DS_SETFONT
    const pt = u16();
    font = { pointSize: pt, typeface: astr() };
  }

  const items: DialogItem[] = [];
  for (let i = 0; i < count; i++) {
    const ix = u16(), iy = u16(), icx = u16(), icy = u16();
    const id = u16();
    const s = u32();

    // class: byte >= 0x80 = predefined, else first char of ANSI string
    const clsByte = u8();
    let className: string;
    if (clsByte >= 0x80) {
      className = DIALOG_CLASS_NAMES[clsByte] || `Unknown_0x${clsByte.toString(16)}`;
    } else if (clsByte === 0) {
      className = 'Unknown';
    } else {
      pos--; // put back the first byte
      className = astr();
    }

    // text: 0xFF + WORD ordinal, or ANSI string (first byte is first char or 0)
    const txtByte = u8();
    let text = '';
    let titleOrdinal: number | null = null;
    if (txtByte === 0xFF) {
      titleOrdinal = u16();
    } else if (txtByte !== 0) {
      pos--; // put back the first byte
      text = astr();
    }

    // cbExtra
    const extra = u8();
    if (extra > 0) pos += extra;

    items.push({ style: s, exStyle: 0, x: ix, y: iy, cx: icx, cy: icy, id, className, text, titleOrdinal });
  }

  return { style, exStyle: 0, x, y, cx, cy, title, className, menuName, font, items };
}

export function extractDialogs(peInfo: PEInfo, arrayBuffer: ArrayBuffer): DialogResult[] {
  if (!peInfo.resources) return [];
  const dialogType = peInfo.resources.find(r => r.typeId === 5);
  if (!dialogType) return [];

  const results: DialogResult[] = [];
  for (const entry of dialogType.entries) {
    for (const lang of entry.languages) {
      try {
        const fileOffset = rvaToFileOffset(lang.dataRva, peInfo.sections);
        const dialog = peInfo.neEncoding
          ? parseDialogTemplate16(arrayBuffer, fileOffset, lang.dataSize, peInfo.neEncoding)
          : parseDialogTemplate(arrayBuffer, fileOffset, lang.dataSize);
        results.push({ id: entry.id, name: entry.name, languageId: lang.languageId, dialog });
      } catch (e: unknown) {
        console.warn(`Failed to extract dialog ${entry.id ?? entry.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
  return results;
}
