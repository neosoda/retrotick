import type { Emulator } from '../emulator';

export function registerMsacm32(emu: Emulator): void {
  const msacm32 = emu.registerDll('MSACM32.DLL');

  msacm32.register('acmStreamOpen', 7, () => 1);       // MMSYSERR_ERROR
  msacm32.register('acmStreamClose', 2, () => 0);
  msacm32.register('acmStreamSize', 4, () => 0);
  msacm32.register('acmStreamConvert', 3, () => 0);
  msacm32.register('acmStreamPrepareHeader', 3, () => 0);
  msacm32.register('acmStreamUnprepareHeader', 3, () => 0);
  msacm32.register('acmFormatSuggest', 5, () => 1);    // MMSYSERR_ERROR
  msacm32.register('acmFormatChooseW', 1, () => 1);
  msacm32.register('acmMetrics', 3, () => 0);
  msacm32.register('acmFormatTagDetailsW', 3, () => 0);
  msacm32.register('acmFormatDetailsW', 3, () => 0);
}
