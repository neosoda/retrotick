import type { Emulator } from '../emulator';

// Win16 MMSYSTEM module — sound stubs (no audio)

export function registerWin16Mmsystem(emu: Emulator): void {
  const mmsystem = emu.registerModule16('MMSYSTEM');

  // Ordinal 2: sndPlaySound — stub (no sound)
  mmsystem.register('ord_2', 6, () => 1);

  // Ordinal 401: PlaySound — stub (no sound)
  mmsystem.register('ord_401', 10, () => 1);
}
