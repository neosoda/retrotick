import type { Emulator } from '../../emulator';

export function registerFocus(emu: Emulator): void {
  const user32 = emu.registerDll('USER32.DLL');

  user32.register('GetFocus', 0, () => 0);
  user32.register('SetFocus', 1, () => 0);
  user32.register('GetActiveWindow', 0, () => {
    const wins = emu.handles.findByType('window');
    return wins.length > 0 ? wins[0][0] : 0;
  });
  user32.register('SetActiveWindow', 1, () => emu.readArg(0));
  user32.register('GetForegroundWindow', 0, () => {
    const wins = emu.handles.findByType('window');
    return wins.length > 0 ? wins[0][0] : 0;
  });
  user32.register('SetForegroundWindow', 1, () => 1);
}
