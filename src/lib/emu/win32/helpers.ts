import type { Emulator } from '../emulator';

export function readAnsiStr(emu: Emulator, addr: number): string {
  if (!addr) return '';
  return emu.memory.readCString(addr);
}

export function readWideStr(emu: Emulator, addr: number): string {
  if (!addr) return '';
  return emu.memory.readUTF16String(addr);
}

export function writeWideStr(emu: Emulator, addr: number, s: string): void {
  for (let i = 0; i < s.length; i++) {
    emu.memory.writeU16(addr + i * 2, s.charCodeAt(i));
  }
  emu.memory.writeU16(addr + s.length * 2, 0);
}

export function allocWideStr(emu: Emulator, s: string): number {
  const addr = emu.allocHeap((s.length + 1) * 2);
  writeWideStr(emu, addr, s);
  return addr;
}
