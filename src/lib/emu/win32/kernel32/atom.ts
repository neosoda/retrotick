import type { Emulator } from '../../emulator';

export function registerAtom(emu: Emulator): void {
  const kernel32 = emu.registerDll('KERNEL32.DLL');

  let nextAtom = 0xC000;
  // Map atom string to atom handle
  const atomMap = new Map<string, number>();

  kernel32.register('GlobalAddAtomA', 1, () => {
    return nextAtom++;
  });

  kernel32.register('GlobalAddAtomW', 1, () => {
    return nextAtom++;
  });

  kernel32.register('GlobalDeleteAtom', 1, () => 0);
  kernel32.register('GlobalFindAtomA', 1, () => 0);

  kernel32.register('GlobalFindAtomW', 1, () => {
    return 0;
  });

  kernel32.register('GlobalGetAtomNameA', 3, () => 0);

  kernel32.register('GlobalGetAtomNameW', 3, () => {
    return 0;
  });

  // Local atom table (not global)
  // AddAtomA(LPCSTR lpString) — add atom to local table
  kernel32.register('AddAtomA', 1, () => {
    const strPtr = emu.readArg(0);
    const str = emu.memory.readCString(strPtr);
    if (!atomMap.has(str)) {
      atomMap.set(str, nextAtom++);
    }
    return atomMap.get(str)!;
  });

  // FindAtomA(LPCSTR lpString) — find atom in local table
  kernel32.register('FindAtomA', 1, () => {
    const strPtr = emu.readArg(0);
    const str = emu.memory.readCString(strPtr);
    return atomMap.get(str) || 0; // Return 0 if not found
  });

  // GetAtomNameA(ATOM nAtom, LPSTR lpBuffer, int nSize) — get atom name
  kernel32.register('GetAtomNameA', 3, () => {
    const atom = emu.readArg(0);
    const bufPtr = emu.readArg(1);
    const bufSize = emu.readArg(2);

    // Find the string for this atom
    let foundStr = '';
    for (const [str, atomId] of atomMap.entries()) {
      if (atomId === atom) {
        foundStr = str;
        break;
      }
    }

    if (!foundStr) return 0; // Not found

    // Write the string to the buffer
    const strLen = Math.min(foundStr.length, bufSize - 1);
    for (let i = 0; i < strLen; i++) {
      emu.memory.writeU8(bufPtr + i, foundStr.charCodeAt(i));
    }
    if (bufSize > 0) {
      emu.memory.writeU8(bufPtr + strLen, 0); // Null terminator
    }
    return strLen;
  });
}
