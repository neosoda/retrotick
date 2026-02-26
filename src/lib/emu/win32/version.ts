import type { Emulator } from '../emulator';

export function registerVersion(emu: Emulator): void {
  const version = emu.registerDll('VERSION.DLL');

  version.register('GetFileVersionInfoSizeA', 2, () => {
    // lpdwHandle out param
    const handlePtr = emu.readArg(1);
    if (handlePtr) emu.memory.writeU32(handlePtr, 0);
    return 0; // no version info available
  });

  version.register('GetFileVersionInfoA', 4, () => 0); // failure
  version.register('VerQueryValueA', 4, () => 0); // failure

  version.register('GetFileVersionInfoSizeW', 2, () => {
    const handlePtr = emu.readArg(1);
    if (handlePtr) emu.memory.writeU32(handlePtr, 0);
    return 0; // no version info available
  });

  version.register('GetFileVersionInfoW', 4, () => 0); // failure
  version.register('VerQueryValueW', 4, () => 0); // failure
}
