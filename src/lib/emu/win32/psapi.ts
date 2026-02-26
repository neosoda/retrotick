import type { Emulator } from '../emulator';

export function registerPsapi(emu: Emulator): void {
  const psapi = emu.registerDll('PSAPI.DLL');

  // GetProcessMemoryInfo(hProcess, ppsmemCounters, cb) → BOOL
  psapi.register('GetProcessMemoryInfo', 3, () => {
    const ppsmemCounters = emu.readArg(1);
    const cb = emu.readArg(2);
    if (ppsmemCounters && cb) {
      for (let i = 0; i < cb; i += 4) {
        emu.memory.writeU32(ppsmemCounters + i, 0);
      }
    }
    return 1;
  });
}
