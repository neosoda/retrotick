import type { Emulator } from '../../emulator';

export function registerTls(emu: Emulator): void {
  const kernel32 = emu.registerDll('KERNEL32.DLL');

  // TLS (Thread Local Storage)
  // Values are stored both in a JS Map and in the TEB TLS array (FS:[0x2C])
  // so that both API calls and direct FS segment access work
  let nextTlsIndex = 0;
  kernel32.register('TlsAlloc', 0, () => nextTlsIndex++);
  kernel32.register('TlsFree', 1, () => 1);
  kernel32.register('TlsGetValue', 1, () => {
    const idx = emu.readArg(0);
    // Read from TEB TLS array
    const tlsArrayPtr = emu.memory.readU32((emu.cpu.fsBase + 0x2C) >>> 0);
    return emu.memory.readU32((tlsArrayPtr + idx * 4) >>> 0);
  });
  kernel32.register('TlsSetValue', 2, () => {
    const idx = emu.readArg(0);
    const val = emu.readArg(1);
    // Write to TEB TLS array
    const tlsArrayPtr = emu.memory.readU32((emu.cpu.fsBase + 0x2C) >>> 0);
    emu.memory.writeU32((tlsArrayPtr + idx * 4) >>> 0, val);
    return 1;
  });

  // FLS (Fiber Local Storage) — emulated with a simple map
  let nextFlsIndex = 0;
  const flsValues = new Map<number, number>();
  kernel32.register('FlsAlloc', 1, () => {
    return nextFlsIndex++;
  });
  kernel32.register('FlsFree', 1, () => 1);
  kernel32.register('FlsGetValue', 1, () => {
    const idx = emu.readArg(0);
    return flsValues.get(idx) ?? 0;
  });
  kernel32.register('FlsSetValue', 2, () => {
    const idx = emu.readArg(0);
    const val = emu.readArg(1);
    flsValues.set(idx, val);
    return 1;
  });
}
