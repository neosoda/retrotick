import type { Emulator } from '../emulator';

// Win16 COMMDLG module — common dialog stubs

export function registerWin16Commdlg(emu: Emulator): void {
  const commdlg = emu.registerModule16('COMMDLG');

  // Ordinal 27: ChooseColor — stub (return 0 = cancelled)
  commdlg.register('ord_27', 4, () => 0);
}
