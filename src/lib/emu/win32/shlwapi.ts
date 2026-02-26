import type { Emulator } from '../emulator';

export function registerShlwapi(emu: Emulator): void {
  const shlwapi = emu.registerDll('SHLWAPI.DLL');

  // StrChrW: find first occurrence of char in string
  shlwapi.register('StrChrW', 2, () => {
    const pszStart = emu.readArg(0);
    const wMatch = emu.readArg(1) & 0xFFFF;
    if (!pszStart) return 0;
    let ptr = pszStart;
    while (true) {
      const ch = emu.memory.readU16(ptr);
      if (ch === wMatch) return ptr;
      if (ch === 0) return 0;
      ptr += 2;
    }
  });

  // StrCpyW: copy wide string
  shlwapi.register('StrCpyW', 2, () => {
    const pszDst = emu.readArg(0);
    const pszSrc = emu.readArg(1);
    if (!pszDst || !pszSrc) return pszDst;
    let i = 0;
    while (true) {
      const ch = emu.memory.readU16(pszSrc + i);
      emu.memory.writeU16(pszDst + i, ch);
      if (ch === 0) break;
      i += 2;
    }
    return pszDst;
  });

  // StrToIntW: convert wide string to integer
  shlwapi.register('StrToIntW', 1, () => {
    const pszStr = emu.readArg(0);
    if (!pszStr) return 0;
    const str = emu.memory.readUTF16String(pszStr);
    return (parseInt(str, 10) || 0) >>> 0;
  });

  // IsOS (ordinal 437): check OS type — return FALSE for all queries
  shlwapi.register('IsOS', 1, () => {
    const _dwOS = emu.readArg(0);
    return 0; // FALSE
  });

  // StrCmpIW: case-insensitive wide string compare
  shlwapi.register('StrCmpIW', 2, () => {
    const psz1 = emu.readArg(0);
    const psz2 = emu.readArg(1);
    if (!psz1 || !psz2) return psz1 === psz2 ? 0 : (psz1 ? 1 : -1);
    let i = 0;
    while (true) {
      let c1 = emu.memory.readU16(psz1 + i);
      let c2 = emu.memory.readU16(psz2 + i);
      // Simple ASCII case folding
      if (c1 >= 0x41 && c1 <= 0x5A) c1 += 0x20;
      if (c2 >= 0x41 && c2 <= 0x5A) c2 += 0x20;
      if (c1 !== c2) return c1 < c2 ? -1 : 1;
      if (c1 === 0) return 0;
      i += 2;
    }
  });
}
