import type { Emulator } from '../emulator';

export function registerWinspool(emu: Emulator): void {
  const winspool = emu.registerDll('WINSPOOL.DRV');

  winspool.register('OpenPrinterA', 3, () => 0);  // failure
  winspool.register('OpenPrinterW', 3, () => 0);
  winspool.register('DocumentPropertiesA', 6, () => 0);
  winspool.register('GetPrinterDriverW', 6, () => 0);
  winspool.register('ClosePrinter', 1, () => 1);
}
