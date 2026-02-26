import type { Emulator } from '../../emulator';

export function registerProfile(emu: Emulator): void {
  const kernel32 = emu.registerDll('KERNEL32.DLL');

  kernel32.register('GetProfileIntA', 3, () => 0);

  kernel32.register('GetProfileIntW', 3, () => {
    const _sectionPtr = emu.readArg(0);
    const _keyPtr = emu.readArg(1);
    const nDefault = emu.readArg(2);
    return nDefault;
  });

  kernel32.register('GetProfileStringW', 5, () => {
    const defaultPtr = emu.readArg(2);
    const bufPtr = emu.readArg(3);
    const bufSize = emu.readArg(4);
    // Copy default string to buffer
    if (defaultPtr && bufPtr && bufSize > 0) {
      let i = 0;
      while (i < bufSize - 1) {
        const ch = emu.memory.readU16(defaultPtr + i * 2);
        emu.memory.writeU16(bufPtr + i * 2, ch);
        if (ch === 0) break;
        i++;
      }
      emu.memory.writeU16(bufPtr + i * 2, 0);
      return i;
    }
    return 0;
  });

  // GetProfileStringA(lpAppName, lpKeyName, lpDefault, lpReturnedString, nSize)
  kernel32.register('GetProfileStringA', 5, () => {
    const defaultPtr = emu.readArg(2);
    const bufPtr = emu.readArg(3);
    const bufSize = emu.readArg(4);
    if (defaultPtr && bufPtr && bufSize > 0) {
      let i = 0;
      while (i < bufSize - 1) {
        const ch = emu.memory.readU8(defaultPtr + i);
        emu.memory.writeU8(bufPtr + i, ch);
        if (ch === 0) break;
        i++;
      }
      emu.memory.writeU8(bufPtr + i, 0);
      return i;
    }
    if (bufPtr && bufSize > 0) emu.memory.writeU8(bufPtr, 0);
    return 0;
  });

  kernel32.register('WriteProfileStringA', 3, () => 1);
  kernel32.register('WriteProfileStringW', 3, () => 1); // pretend success

  kernel32.register('GetPrivateProfileIntA', 4, () => 0);

  kernel32.register('GetPrivateProfileIntW', 4, () => {
    // Return default value (arg 2)
    return emu.readArg(2);
  });

  kernel32.register('GetPrivateProfileStringW', 6, () => {
    const _section = emu.readArg(0);
    const _key = emu.readArg(1);
    const defaultPtr = emu.readArg(2);
    const bufPtr = emu.readArg(3);
    const bufSize = emu.readArg(4);

    if (defaultPtr && bufPtr && bufSize > 0) {
      // Copy default value to buffer
      let i = 0;
      while (i < bufSize - 1) {
        const ch = emu.memory.readU16(defaultPtr + i * 2);
        emu.memory.writeU16(bufPtr + i * 2, ch);
        if (ch === 0) break;
        i++;
      }
      emu.memory.writeU16(bufPtr + i * 2, 0);
      return i;
    }
    return 0;
  });

  kernel32.register('GetPrivateProfileStringA', 6, () => {
    const _section = emu.readArg(0);
    const _key = emu.readArg(1);
    const defaultPtr = emu.readArg(2);
    const bufPtr = emu.readArg(3);
    const bufSize = emu.readArg(4);

    if (defaultPtr && bufPtr && bufSize > 0) {
      let i = 0;
      while (i < bufSize - 1) {
        const ch = emu.memory.readU8(defaultPtr + i);
        emu.memory.writeU8(bufPtr + i, ch);
        if (ch === 0) break;
        i++;
      }
      emu.memory.writeU8(bufPtr + i, 0);
      return i;
    }
    if (bufPtr && bufSize > 0) emu.memory.writeU8(bufPtr, 0);
    return 0;
  });

  kernel32.register('WritePrivateProfileStringA', 4, () => 1);
  kernel32.register('WritePrivateProfileStringW', 4, () => 1);
  kernel32.register('WritePrivateProfileStructA', 5, () => 1);
  kernel32.register('GetPrivateProfileStructA', 5, () => 0); // fail — key not found

  kernel32.register('GetPrivateProfileSectionNamesW', 3, () => {
    const bufPtr = emu.readArg(0);
    const bufSize = emu.readArg(1);
    // Return empty double-null-terminated list
    if (bufPtr && bufSize >= 2) {
      emu.memory.writeU16(bufPtr, 0);
      emu.memory.writeU16(bufPtr + 2, 0);
    }
    return 0;
  });
}
