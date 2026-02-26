import type { Emulator } from '../emulator';

// Win16 KEYBOARD module

export function registerWin16Keyboard(emu: Emulator): void {
  const keyboard = emu.registerModule16('KEYBOARD');

  // Ordinal 6: AnsiToOem(lpAnsiStr:4, lpOemStr:4) — copy string as-is
  keyboard.register('ord_6', 8, () => {
    const [lpAnsi, lpOem] = emu.readPascalArgs16([4, 4]);
    if (lpAnsi && lpOem) {
      let i = 0;
      while (true) {
        const ch = emu.memory.readU8(lpAnsi + i);
        emu.memory.writeU8(lpOem + i, ch);
        if (ch === 0) break;
        i++;
        if (i > 260) break;
      }
    }
    return 1;
  });
}
