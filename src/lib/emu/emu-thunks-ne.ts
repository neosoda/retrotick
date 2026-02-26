import type { Emulator } from './emulator';
import { rvaToFileOffset } from '../pe/read';

export function buildNEThunkTable(emu: Emulator): void {
  if (!emu.ne) return;

  for (const [addr, info] of emu.ne.apiMap) {
    const key = `${info.dll}:${info.name}`;
    const def = emu.apiDefs.get(key);
    const stackBytes = def?.stackBytes ?? 0;
    if (!def) {
      console.warn(`[NE THUNK] No API definition for ${key} — defaulting to stackBytes=0`);
    }
    emu.thunkToApi.set(addr, { dll: info.dll, name: info.name, stackBytes });
  }

  console.log(`[NE] Thunk table built: ${emu.thunkToApi.size} entries`);
}

export function readResourceString(emu: Emulator, base: number, offset: number): string {
  const addr = base + offset;
  const len = emu.memory.readU16(addr);
  let s = '';
  for (let i = 0; i < len; i++) {
    s += String.fromCharCode(emu.memory.readU16(addr + 2 + i * 2));
  }
  return s;
}

export function emuRvaToFileOffset(emu: Emulator, rva: number): number {
  try {
    return rvaToFileOffset(rva, emu.peInfo.sections);
  } catch {
    return rva;
  }
}
