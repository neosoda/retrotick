import type { Emulator } from '../../emulator';

export function registerClipboard(emu: Emulator): void {
  const user32 = emu.registerDll('USER32.DLL');

  user32.register('OpenClipboard', 1, () => 1);
  user32.register('CloseClipboard', 0, () => 1);
  user32.register('IsClipboardFormatAvailable', 1, () => 0);
  user32.register('GetClipboardData', 1, () => 0);
  user32.register('EmptyClipboard', 0, () => 1);
  user32.register('SetClipboardData', 2, () => emu.readArg(1)); // return the data handle
}
